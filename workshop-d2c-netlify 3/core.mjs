/* Lógica del workshop (permisos + consolidación). Usada por api.mjs. */
const PERSONAL = ['hl', 'idea', 'co'];   // cada persona
const MESA = ['ss', 'ini'];              // solo el líder de la mesa
const MESA_IDS = ['m1', 'm2', 'm3'];

export function codes(env) {
  const c = {};
  MESA_IDS.forEach((m, i) => { const v = env(`MESA${i + 1}_CODE`); if (v) c[m] = String(v).trim(); });
  return c;
}
function mesaInfo(S, mid) {
  const m = (S.config?.mesas || []).find(x => x.id === mid);
  return m || { id: mid, name: 'Mesa ' + mid.slice(1), people: ['', '', '', ''], leader: -1 };
}
export function who(pin, S, env) {
  pin = String(pin || '').trim(); if (!pin) return null;
  const admin = String(env('ADMIN_CODE') || '').trim();
  if (admin && pin === admin) return { role: 'admin', name: 'Facilitador' };
  const C = codes(env); const [code, idxS] = pin.split(':');
  const mid = Object.keys(C).find(k => C[k] === code); if (!mid) return null;
  const m = mesaInfo(S, mid);
  if (idxS === undefined) return { pick: { mesaName: m.name, people: m.people.map((p, i) => ({ idx: i, name: p || 'Persona ' + (i + 1), leader: m.leader === i })) } };
  const idx = +idxS; if (!(idx >= 0 && idx < 4)) return null;
  return { role: m.leader === idx ? 'lead' : 'part', mesa: mid, idx, name: m.people[idx] || 'Persona ' + (idx + 1) };
}
function canItem(u, it, old) {
  if (u.role === 'admin') return true;
  if (it.mesa !== u.mesa || (old && old.mesa !== u.mesa)) return false;
  if (PERSONAL.includes(it.kind)) return it.who === u.name && (!old || old.who === u.name);
  if (MESA.includes(it.kind)) return u.role === 'lead';
  return false; // votos, plan, Gantt, acuerdos: facilitador
}
function canMap(u, k) {
  if (u.role === 'admin') return true;
  const [p, m] = k.split('|');
  return (p === 'op' || p === 'flow') && m === u.mesa && u.role === 'lead';
}
export function merge(S, b, u) {
  let changed = 0, rejected = 0; S.items = S.items || []; S.maps = S.maps || {};
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
  return { changed, rejected };
}
