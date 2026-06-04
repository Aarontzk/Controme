// DaaS extension — qc-lots-autoname
// Event: qc_lots.items.create | type: filter (mutating) | timeout 5000ms | active
//
// Auto-generate lot_code = <CODE>-NNNN with a running per-product counter when
// the operator left it blank. CODE comes from products.code (fallback: sku
// prefix, then name initials, then "LOT"). qc_lots is append-only so there are
// no gaps. Operator-supplied codes are kept. Works on every create path.
//
// Requires a `code` string field on products (e.g. GIN, DRF).
const svc = (typeof services !== 'undefined') ? services : (context && context.services);
const lots = await svc.items('qc_lots', { elevated: true });
const products = await svc.items('products', { elevated: true });

const items = Array.isArray(payload) ? payload : [payload];
const codeCache = {};
const nextByCode = {};

function deriveCode(p) {
  if (p && p.code && String(p.code).trim()) return String(p.code).trim().toUpperCase();
  if (p && p.sku && String(p.sku).trim()) return String(p.sku).trim().toUpperCase().split('-')[0];
  const name = (p && p.name) ? String(p.name) : '';
  const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
  return letters.length >= 3 ? letters.slice(0, 3) : 'LOT';
}

async function codeFor(pid) {
  if (codeCache[pid] != null) return codeCache[pid];
  let p = null;
  try { p = pid ? await products.readOne(pid) : null; } catch (e) { p = null; }
  codeCache[pid] = deriveCode(p);
  return codeCache[pid];
}

async function maxFor(prefix) {
  const rows = await lots.readByQuery({
    filter: { lot_code: { _starts_with: prefix } },
    sort: ['-lot_code'], limit: 1, fields: ['lot_code'],
  });
  if (!rows || rows.length === 0) return 0;
  const mm = String(rows[0].lot_code || '').match(/-(\d+)$/);
  return mm ? parseInt(mm[1], 10) : 0;
}

for (const d of items) {
  if (!d) continue;
  if (d.lot_code != null && String(d.lot_code).trim() !== '') continue;
  const pid = (d.product_id && d.product_id.id) ? d.product_id.id : d.product_id;
  const code = await codeFor(pid);
  const prefix = code + '-';
  if (nextByCode[code] == null) nextByCode[code] = await maxFor(prefix);
  nextByCode[code] += 1;
  d.lot_code = prefix + String(nextByCode[code]).padStart(4, '0');
}

return payload;
