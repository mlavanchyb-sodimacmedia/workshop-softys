/* Workshop E-Commerce D2C Chile · Softys · Initiative · Infracommerce
   Netlify Function: acceso con códigos y guardado central en Netlify Blobs.
   Variables de entorno: ADMIN_CODE, MESA1_CODE, MESA2_CODE, MESA3_CODE */
import { getStore } from '@netlify/blobs';
import { who, merge, codes } from './core.mjs';

export const config = { path: '/api/*' };
const KEY = 'state';
const env = k => (globalThis.Netlify?.env?.get(k)) ?? process.env[k];
const J = (code, obj, extra = {}) => new Response(obj === undefined ? null : JSON.stringify(obj), { status: code, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra } });
const empty = () => ({ v: 3, rev: 0, items: [], maps: {}, config: null });

async function read(store) {
  const r = await store.getWithMetadata(KEY, { type: 'json' });
  return r ? { S: { ...empty(), ...r.data }, etag: r.etag } : { S: empty(), etag: null };
}
async function write(store, S, etag) {
  S.rev = (S.rev || 0) + 1; S.savedAt = new Date().toISOString();
  const res = etag ? await store.setJSON(KEY, S, { onlyIfMatch: etag }) : await store.setJSON(KEY, S, { onlyIfNew: true });
  if (res && res.modified === false) return false;
  // respaldo cada 10 minutos
  store.setJSON('backup-' + new Date().toISOString().slice(0, 15).replace(/[:T]/g, '-') + '0', S).catch(() => {});
  return true;
}
function view(u, S) { return { state: S, codes: u.role === 'admin' ? codes(env) : undefined }; }

export default async (req) => {
  const url = new URL(req.url); const p = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  if (p === 'ping') return J(200, { ok: true, configured: !!env('ADMIN_CODE') });
  const store = getStore({ name: 'workshop-d2c', consistency: 'strong' });
  try {
    if (p === 'login' && req.method === 'POST') {
      const b = await req.json().catch(() => ({})); const { S } = await read(store); const u = who(b.pin, S, env);
      if (!u) return J(401, { error: 'Código no válido' });
      return u.pick ? J(200, { pick: u.pick }) : J(200, { me: u });
    }
    let { S, etag } = await read(store);
    const u = who(req.headers.get('x-pin'), S, env);
    if (!u || u.pick) return J(401, { error: 'No autorizado' });
    if (p === 'state' && req.method === 'GET') {
      if (url.searchParams.get('rev') === String(S.rev)) return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
      return J(200, view(u, S));
    }
    if ((p === 'sync' || p === 'reset') && req.method === 'POST') {
      if (p === 'reset' && u.role !== 'admin') return J(403, { error: 'Solo facilitador' });
      const b = p === 'sync' ? await req.json() : null; let rejected = 0;
      for (let t = 0; t < 8; t++) {           // reintenta si otra persona guardó al mismo tiempo
        let changed;
        if (p === 'reset') { S.items = []; S.maps = {}; changed = 1; } else ({ changed, rejected } = merge(S, b, u));
        if (!changed) return J(200, { ...view(u, S), rejected });
        if (await write(store, S, etag)) return J(200, { ...view(u, S), rejected });
        await new Promise(r => setTimeout(r, 60 + Math.random() * 140));
        ({ S, etag } = await read(store));
      }
      return J(503, { error: 'Ocupado, reintenta' });
    }
    if (p === 'export' && u.role === 'admin') return J(200, S, { 'Content-Disposition': 'attachment; filename="workshop-d2c-estado.json"' });
    return J(404, { error: 'No encontrado' });
  } catch (e) { console.error(e); return J(500, { error: 'Error del servidor' }); }
};
