// DaaS extension — qc-lots-autoname
// Event: qc_lots.items.create | type: filter (mutating) | timeout 5000ms | active
//
// Auto-generate lot_code = LOT-<YYYYMMDD WIB>-<NNN> when the operator left it
// blank. Per-day counter; qc_lots is append-only so there are no gaps. Any
// operator-supplied lot_code is kept untouched. Works on every create path
// (capture form, API, MCP).
const TZ = 7 * 3600000; // Asia/Jakarta
const svc = (typeof services !== 'undefined') ? services : (context && context.services);

function dateKey(iso) {
  const t = iso ? Date.parse(iso) : Date.now();
  const base = Number.isNaN(t) ? Date.now() : t;
  const d = new Date(base + TZ); // shift to WIB wallclock
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return '' + y + m + day;
}

const items = Array.isArray(payload) ? payload : [payload];
const lots = await svc.items('qc_lots', { elevated: true });
const nextByPrefix = {};

async function maxFor(prefix) {
  const rows = await lots.readByQuery({
    filter: { lot_code: { _starts_with: prefix } },
    sort: ['-lot_code'],
    limit: 1,
    fields: ['lot_code'],
  });
  if (!rows || rows.length === 0) return 0;
  const mm = String(rows[0].lot_code || '').match(/-(\d+)$/);
  return mm ? parseInt(mm[1], 10) : 0;
}

for (const d of items) {
  if (!d) continue;
  if (d.lot_code != null && String(d.lot_code).trim() !== '') continue;
  const prefix = 'LOT-' + dateKey(d.checked_at) + '-';
  if (nextByPrefix[prefix] == null) {
    nextByPrefix[prefix] = await maxFor(prefix);
  }
  nextByPrefix[prefix] += 1;
  d.lot_code = prefix + String(nextByPrefix[prefix]).padStart(3, '0');
}

return payload;
