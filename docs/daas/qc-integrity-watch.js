// DaaS cron — qc-integrity-watch
// Schedule: 0 * * * * (hourly, Asia/Jakarta) | timeout 15000ms | active
//
// Observability/audit detective control. Scans the last ~65 min of daas_activity
// (read via services.supabase — system collections are not reachable through
// services.items) for tamper signals against the append-only QC tables and writes
// an ALERT to qc_notifications (status='integrity') when found. Quiet when clean.
const WINDOW_MIN = 65;
const sinceISO = new Date(Date.now() - WINDOW_MIN * 60000).toISOString();

const { data: rows, error } = await services.supabase
  .from('daas_activity')
  .select('id, action, collection, item, user_id, performed_by, ip, timestamp')
  .gte('timestamp', sinceISO)
  .order('timestamp', { ascending: false })
  .limit(2000);

if (error) { throw new Error('activity read failed: ' + error.message); }

const APPEND_ONLY = ['qc_lots', 'product_reference_versions'];
const SENSITIVE = ['qc_lots', 'products', 'product_reference_versions'];
const findings = [];
let deletes = 0;

for (const r of (rows || [])) {
  const act = String(r.action || '').toLowerCase();
  const col = r.collection || '';
  if (act === 'delete') {
    deletes++;
    if (SENSITIVE.includes(col)) {
      findings.push('DELETE pada ' + col + ' (item ' + (r.item || '?') + ', user ' + (r.performed_by || r.user_id || '?') + ', ip ' + (r.ip || '?') + ')');
    }
  }
  if (act === 'update' && APPEND_ONLY.includes(col)) {
    findings.push('UPDATE pada tabel append-only ' + col + ' (item ' + (r.item || '?') + ', user ' + (r.performed_by || r.user_id || '?') + ')');
  }
}

if (deletes >= 25) {
  findings.push('Lonjakan delete: ' + deletes + ' penghapusan dalam ' + WINDOW_MIN + ' menit.');
}

console.log('integrity-watch: scanned ' + (rows ? rows.length : 0) + ' activity rows, ' + findings.length + ' finding(s).');
if (findings.length === 0) { return; }

const message = 'INTEGRITAS QC — ' + findings.length + ' anomali terdeteksi (' + WINDOW_MIN + ' menit terakhir):\n' +
  findings.slice(0, 10).map((f, i) => (i + 1) + '. ' + f).join('\n') +
  '\n\nQC lot & reference bersifat append-only. Verifikasi siapa & kenapa. Jejak lengkap ada di audit log.';

const notif = await services.items('qc_notifications');
await notif.createOne({ level: 'alert', status: 'integrity', lot_id: null, product_id: null, message: message, read: false });
console.log('integrity-watch: ALERT written.\n' + message);
