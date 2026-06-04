// DaaS cron — qc-heartbeat
// Schedule: */10 * * * * (every 10 min, UTC) | timeout 10000ms | active
//
// Observability. Samples DaaS reachability (query latency) + QC data freshness
// (newest lot age, lots in last 24h) and writes one row to system_health.
// Self-prunes system_health to 7 days. Also keeps the DaaS instance warm,
// mitigating idle cold-starts. Cadence is the cost knob (*/5 warmer, */15 leaner).
const t0 = Date.now();
const lotsSvc = await services.items('qc_lots');

const latest = await lotsSvc.readByQuery({ sort: ['-checked_at'], fields: ['checked_at'], limit: 1 });
const latestAt = latest && latest[0] && latest[0].checked_at ? new Date(latest[0].checked_at).getTime() : null;
// Clamp clock-skew negatives (a lot timestamped slightly ahead of "now").
const ageMin = latestAt ? Math.max(0, Math.round((Date.now() - latestAt) / 60000)) : null;

const dayAgo = new Date(Date.now() - 24 * 3600000).toISOString();
const today = await lotsSvc.readByQuery({ filter: { checked_at: { _gte: dayAgo } }, fields: ['id'], limit: 5000 });
const lots24h = today ? today.length : 0;

const latency = Date.now() - t0;
const status = latency < 4000 ? 'ok' : 'warn';

const health = await services.items('system_health');
await health.createOne({
  service: 'daas',
  status: status,
  latency_ms: latency,
  detail: { lots_24h: lots24h, last_lot_age_min: ageMin },
  checked_at: new Date().toISOString(),
});

const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
const { error: pruneErr } = await services.supabase.from('system_health').delete().lt('checked_at', cutoff);
if (pruneErr) console.log('prune skipped: ' + pruneErr.message);

console.log('heartbeat ' + status + ' latency=' + latency + 'ms lots24h=' + lots24h + ' lastLotAgeMin=' + ageMin);
