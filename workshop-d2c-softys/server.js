/* Workshop E-Commerce D2C Chile · Softys · Initiative · Infracommerce
   Servidor liviano sin dependencias (Node.js 18+).
   - Sirve la plataforma (public/index.html)
   - Guarda todos los aportes en data/state.json (+ respaldos automáticos)
   - Acceso con PIN personal; roles: facilitador, líder de mesa, participante */
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const ADMIN_CODE = String(process.env.ADMIN_CODE || 'softys2027');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'state.json');
const INDEX = path.join(__dirname, 'public', 'index.html');
fs.mkdirSync(DATA_DIR, { recursive: true });

let S = { v: 3, rev: 0, items: [], maps: {}, config: null };
try { S = { ...S, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }; console.log('Estado cargado:', S.items.length, 'aportes'); } catch (e) { console.log('Iniciando sin datos previos'); }

function persist() {
  S.rev++; S.savedAt = new Date().toISOString();
  const tmp = FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(S)); fs.renameSync(tmp, FILE);
}
let lastBackupRev = S.rev;
setInterval(() => { // respaldo cada 5 minutos si hubo cambios
  if (S.rev === lastBackupRev) return; lastBackupRev = S.rev;
  const f = path.join(DATA_DIR, 'backup-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json');
  fs.writeFileSync(f, JSON.stringify(S));
  const bks = fs.readdirSync(DATA_DIR).filter(x => x.startsWith('backup-')).sort();
  bks.slice(0, Math.max(0, bks.length - 50)).forEach(x => fs.unlinkSync(path.join(DATA_DIR, x)));
}, 5 * 60 * 1000);

/* ---------- identidad y permisos ---------- */
function who(req) {
  const pin = String(req.headers['x-pin'] || '').trim();
  if (!pin) return null;
  if (pin === ADMIN_CODE) return { role: 'admin' };
  if (!S.config) return null;
  for (const m of S.config.mesas || []) {
    const i = (m.pins || []).indexOf(pin);
    if (i >= 0 && m.people[i]) return { role: m.leader === i ? 'lead' : 'part', mesa: m.id, idx: i, name: m.people[i] };
  }
  return null;
}
const PERSONAL = ['hl', 'idea', 'co'];      // cada persona
const MESA = ['ss', 'ini'];                 // solo el líder de la mesa
function canItem(u, it, old) {
  if (u.role === 'admin') return true;
  if (it.mesa !== u.mesa || (old && old.mesa !== u.mesa)) return false;
  if (PERSONAL.includes(it.kind)) return it.who === u.name && (!old || old.who === u.name);
  if (MESA.includes(it.kind)) return u.role === 'lead';
  return false;                              // votos, plan, Gantt: facilitador
}
function canMap(u, k) {
  if (u.role === 'admin') return true;
  const [p, m] = k.split('|');
  return (p === 'op' || p === 'flow') && m === u.mesa && u.role === 'lead';
}
function view(u) { // los PIN solo los ve el facilitador
  if (u.role === 'admin' || !S.config) return S;
  return { ...S, config: { ...S.config, mesas: S.config.mesas.map(m => ({ ...m, pins: undefined })) } };
}
function me(u) { return u.role === 'admin' ? { role: 'admin', name: 'Facilitador' } : u; }

/* ---------- http ---------- */
function send(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(obj === undefined ? '' : JSON.stringify(obj)); }
function body(req) {
  return new Promise((ok, ko) => { let d = ''; req.on('data', c => { d += c; if (d.length > 8e6) { ko(new Error('too big')); req.destroy(); } }); req.on('end', () => { try { ok(d ? JSON.parse(d) : {}); } catch (e) { ko(e); } }); });
}
http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x'); const p = url.pathname.replace(/\/+$/, '') || '/';
    if (req.method === 'GET' && (p === '/' || p === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return fs.createReadStream(INDEX).pipe(res);
    }
    if (p === '/api/ping') return send(res, 200, { ok: true });
    if (p === '/api/login' && req.method === 'POST') {
      const b = await body(req); const u = who({ headers: { 'x-pin': b.pin } });
      return u ? send(res, 200, { me: me(u) }) : send(res, 401, { error: 'PIN no válido' });
    }
    const u = who(req); if (!u) return send(res, 401, { error: 'No autorizado' });
    if (p === '/api/state' && req.method === 'GET') {
      if (url.searchParams.get('rev') === String(S.rev)) { res.writeHead(204); return res.end(); }
      return send(res, 200, { state: view(u), me: me(u) });
    }
    if (p === '/api/sync' && req.method === 'POST') {
      const b = await body(req); let changed = 0, rejected = 0;
      const idx = new Map(S.items.map(i => [i.id, i]));
      for (const it of b.items || []) {
        if (!it || !it.id) continue; const ex = idx.get(it.id);
        if (!ex) { if (canItem(u, it)) { S.items.push(it); idx.set(it.id, it); changed++; } else rejected++; }
        else if ((it.ts || 0) > (ex.ts || 0)) { if (canItem(u, it, ex)) { Object.assign(ex, it); changed++; } else rejected++; }
      }
      for (const [k, v] of Object.entries(b.maps || {})) {
        const ex = S.maps[k];
        if (!ex || (v.ts || 0) > (ex.ts || 0)) { if (canMap(u, k)) { S.maps[k] = v; changed++; } else rejected++; }
      }
      if (u.role === 'admin' && b.config && (!S.config || (b.config._ts || 0) > (S.config._ts || 0))) { S.config = b.config; changed++; }
      if (changed) persist();
      return send(res, 200, { state: view(u), rejected });
    }
    if (p === '/api/reset' && req.method === 'POST' && u.role === 'admin') { S.items = []; S.maps = {}; persist(); return send(res, 200, { state: view(u) }); }
    if (p === '/api/export' && u.role === 'admin') { res.writeHead(200, { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="workshop-d2c-estado.json"' }); return res.end(JSON.stringify(S, null, 1)); }
    send(res, 404, { error: 'No encontrado' });
  } catch (e) { console.error(e); send(res, 500, { error: 'Error del servidor' }); }
}).listen(PORT, () => {
  console.log(`\n  Workshop D2C listo en http://localhost:${PORT}`);
  console.log(`  Código del facilitador: ${ADMIN_CODE === 'softys2027' ? 'softys2027 (cámbialo con ADMIN_CODE)' : '(definido en ADMIN_CODE)'}\n`);
});
