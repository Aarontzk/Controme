// DaaS cron — qc-audit-archive
// Schedule: 30 1 * * * (daily 01:30 Asia/Jakarta) | timeout 60000ms | active
//
// Compliance. Copies the previous day's daas_activity rows into audit_archive
// (a separate collection) BEFORE the 02:00 activity-housekeeping purge removes
// rows older than 90 days — so the full audit history is never lost. Idempotent
// on activity_id. NOTE: inserts go through services.supabase directly, so the
// audit_archive append-only filter hooks (which guard the items API) do not block
// the cron.
const TZ = 7 * 3600000; // Asia/Jakarta
const jktNow = new Date(Date.now() + TZ);
const y = new Date(jktNow); y.setUTCDate(y.getUTCDate() - 1);
const dateStr = y.toISOString().slice(0, 10);
const startUTC = new Date(Date.parse(dateStr + 'T00:00:00+07:00')).toISOString();
const endUTC = new Date(Date.parse(dateStr + 'T00:00:00+07:00') + 86400000).toISOString();

const { data: src, error: srcErr } = await services.supabase
  .from('daas_activity')
  .select('id, action, collection, item, user_id, performed_by, ip, origin, timestamp, revisions, comment')
  .gte('timestamp', startUTC).lt('timestamp', endUTC)
  .order('timestamp', { ascending: true }).limit(50000);
if (srcErr) throw new Error('activity read failed: ' + srcErr.message);
if (!src || src.length === 0) { console.log('audit-archive: no activity for ' + dateStr); return; }

const ids = src.map((r) => r.id);
const { data: existing, error: exErr } = await services.supabase
  .from('audit_archive').select('activity_id').in('activity_id', ids);
if (exErr) throw new Error('archive read failed: ' + exErr.message);
const seen = new Set((existing || []).map((r) => r.activity_id));

const nowISO = new Date().toISOString();
const toInsert = src.filter((r) => !seen.has(r.id)).map((r) => ({
  activity_id: r.id, action: r.action, src_collection: r.collection,
  src_item: r.item != null ? String(r.item) : null,
  actor_id: r.performed_by || r.user_id || null,
  ip: r.ip || null, origin: r.origin || null,
  activity_timestamp: r.timestamp, raw: r, archived_at: nowISO,
}));
if (toInsert.length === 0) { console.log('audit-archive: ' + dateStr + ' already archived (' + src.length + ' rows).'); return; }

let inserted = 0;
for (let i = 0; i < toInsert.length; i += 500) {
  const batch = toInsert.slice(i, i + 500);
  const { error: insErr } = await services.supabase.from('audit_archive').insert(batch);
  if (insErr) throw new Error('archive insert failed: ' + insErr.message);
  inserted += batch.length;
}
console.log('audit-archive: ' + dateStr + ' archived ' + inserted + '/' + src.length + ' activity rows.');
