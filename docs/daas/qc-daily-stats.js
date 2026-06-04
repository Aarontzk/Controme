// DaaS cron — qc-daily-stats
// Schedule: 30 0 * * * (daily 00:30 Asia/Jakarta) | timeout 60000ms | active
//
// Performance/scalability. Precomputes one KPI rollup row per day (total/reject/
// rate/warning/avg ΔE + per-product breakdown) into qc_daily_stats so the manager
// dashboard reads one row/day instead of scanning all qc_lots. Upsert by stat_date
// (idempotent; safe to re-run).
const TZ = 7 * 3600000; // Asia/Jakarta
const jktNow = new Date(Date.now() + TZ);
const y = new Date(jktNow); y.setUTCDate(y.getUTCDate() - 1);
const dateStr = y.toISOString().slice(0, 10);
const startUTC = new Date(Date.parse(dateStr + 'T00:00:00+07:00')).toISOString();
const endUTC = new Date(Date.parse(dateStr + 'T00:00:00+07:00') + 86400000).toISOString();

const lotsSvc = await services.items('qc_lots');
const prodSvc = await services.items('products');

const lots = await lotsSvc.readByQuery({
  filter: { checked_at: { _gte: startUTC, _lt: endUTC } },
  fields: ['product_id', 'status', 'delta_e', 'warning_flag'], limit: 50000,
});
const prods = await prodSvc.readByQuery({ fields: ['id', 'name'], limit: 1000 });
const pname = {}; for (const p of prods) pname[p.id] = p.name;

const total = lots.length;
let rej = 0, warn = 0, deSum = 0, deN = 0;
const byProd = {};
for (const l of lots) {
  const isR = l.status === 'reject';
  if (isR) rej++;
  if (l.warning_flag) warn++;
  if (typeof l.delta_e === 'number') { deSum += l.delta_e; deN++; }
  const k = l.product_id || 'unknown';
  if (!byProd[k]) byProd[k] = { name: pname[k] || k, total: 0, reject: 0 };
  byProd[k].total++; if (isR) byProd[k].reject++;
}
const rejRate = total ? rej / total : 0;
const avgDe = deN ? deSum / deN : null;

const row = {
  stat_date: dateStr, total_lots: total, reject_count: rej,
  reject_rate: Number(rejRate.toFixed(4)), warning_count: warn,
  avg_delta_e: avgDe != null ? Number(avgDe.toFixed(3)) : null,
  by_product: byProd, generated_at: new Date().toISOString(),
};

const statsSvc = await services.items('qc_daily_stats');
const existing = await statsSvc.readByQuery({ filter: { stat_date: { _eq: dateStr } }, fields: ['id'], limit: 1 });
if (existing && existing.length) {
  await statsSvc.updateOne(existing[0].id, row);
  console.log('daily-stats: updated ' + dateStr + ' total=' + total + ' reject=' + rej + ' (' + (rejRate * 100).toFixed(0) + '%)');
} else {
  await statsSvc.createOne(row);
  console.log('daily-stats: created ' + dateStr + ' total=' + total + ' reject=' + rej + ' (' + (rejRate * 100).toFixed(0) + '%)');
}
