// Trip Board rendering: header, places sidebar, React-Flow-style canvas, route edges, summary panel.
import { catalog, esc, icon, img, fmtTime, categoryLabels, rating, brand, brandMark, themeToggle, avatar, transport, modes, leg, orderPlaces, tripDayCount, input, select } from './lib.mjs';
import { dateRange } from './cards.mjs';

export const NODE_W = 240;
export const nodeH = (p) => (p.notes ? 246 : 208);
export const schedule = (p) => [p.day ? `Day ${p.day}` : null, fmtTime(p.time)].filter(Boolean).join(' · ');

export const nodeTools = () => `<div class="node-tools"><span class="tool">${icon('pencil', 13)}Edit</span><span class="tool">${icon('copy', 13)}Duplicate</span><span class="tool danger">${icon('trash', 13)}Delete</span></div>`;

export const placeNode = (p, { selected = false, dim = false, tools = false, style = '' } = {}) => {
  const c = p.c;
  const s = schedule(p);
  return `<div class="node${selected ? ' sel' : ''}${dim ? ' dim' : ''}" style="left: ${p.x}px; top: ${p.y}px; height: ${nodeH(p)}px;${style}">${tools ? nodeTools() : ''}<div class="node-img"><img src="${img(c.image)}" alt="">${s ? `<span class="chip chip-navy node-sched">${icon('calendar-days', 11)}${esc(s)}</span>` : ''}</div><div class="node-body"><h3 class="node-title">${esc(c.name)}</h3><div class="node-meta"><span class="tag">${categoryLabels[c.category]}</span><span class="trunc">${esc(c.city)}</span>${rating(c.rating, 11)}</div>${p.notes ? `<p class="node-note">${esc(p.notes)}</p>` : ''}</div><span class="handle l"></span><span class="handle r"></span></div>`;
};

/** React Flow smooth-step path from a source handle (right) to a target handle (left). */
export const stepPath = (sx, sy, tx, ty, r = 18) => {
  if (Math.abs(sy - ty) < 1) return { d: `M${sx} ${sy} L${tx} ${ty}`, lx: (sx + tx) / 2, ly: sy };
  const mx = (sx + tx) / 2;
  const dir = ty > sy ? 1 : -1;
  const rr = Math.min(r, Math.abs(ty - sy) / 2, Math.abs(mx - sx));
  return {
    d: `M${sx} ${sy} L${mx - rr} ${sy} Q${mx} ${sy} ${mx} ${sy + dir * rr} L${mx} ${ty - dir * rr} Q${mx} ${ty} ${mx + rr} ${ty} L${tx} ${ty}`,
    lx: mx,
    ly: (sy + ty) / 2,
  };
};

export const edgePill = (a, b, mode, { open = false, style = '' } = {}) => {
  const t = transport[mode];
  return `<span class="epill${open ? ' open' : ''}" style="${style}">${icon(t.icon, 14)}${t.label}<span class="dur">· ${leg(a.c, b.c, mode).duration}</span>${icon('chevron-down', 12)}</span>`;
};

export const edgeMenu = (a, b, mode, style = '') => `<div class="emenu" style="${style}">${modes.map((m) => `<div class="emenu-item${m === mode ? ' on' : ''}">${icon(transport[m].icon, 15)}${transport[m].label}<span class="t">${leg(a.c, b.c, m).duration}</span></div>`).join('')}<p class="emenu-note">≈ ${leg(a.c, b.c, mode).distance} straight line</p><div class="emenu-del">${icon('trash', 15)}Remove route</div></div>`;

export const dayBar = (board, dayFilter = null, { compact = false } = {}) => {
  const days = tripDayCount(board.trip.start_date, board.trip.end_date);
  const count = (d) => board.places.filter((p) => p.day === d).length;
  const unscheduled = board.places.filter((p) => !p.day).length;
  const dayItems = Array.from({ length: days }, (_, i) => i + 1)
    .map((d) => `<span class="day${dayFilter === d ? ' on' : ''}">${compact ? 'D' : 'Day '}${d}<span class="n">${count(d)}</span></span>`).join('');
  return `<div class="daybar">${compact ? '' : `<span class="eyebrow row" style="gap: 5px; padding: 0 8px 0 6px;">${icon('calendar-days', 12)}Days</span>`}<span class="day${dayFilter === null ? ' on' : ''}">All</span>${dayItems}${unscheduled ? `<span class="faint" style="padding: 0 8px; font-size: 11.5px;">${unscheduled} unscheduled</span>` : ''}</div>`;
};

const minimap = (board, { z, tx, ty, width, height }) => {
  const xs = board.places.flatMap((p) => [p.x, p.x + NODE_W]);
  const ys = board.places.flatMap((p) => [p.y, p.y + nodeH(p)]);
  const vx = -tx / z; const vy = -ty / z; const vw = width / z; const vh = height / z;
  const minX = Math.min(...xs, vx); const maxX = Math.max(...xs, vx + vw);
  const minY = Math.min(...ys, vy); const maxY = Math.max(...ys, vy + vh);
  const s = Math.min(136 / (maxX - minX), 80 / (maxY - minY));
  const ox = 10 + (136 - (maxX - minX) * s) / 2; const oy = 10 + (80 - (maxY - minY) * s) / 2;
  const at = (x, y) => [ox + (x - minX) * s, oy + (y - minY) * s];
  const rects = board.places.map((p) => {
    const [x, y] = at(p.x, p.y);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(NODE_W * s).toFixed(1)}" height="${(nodeH(p) * s).toFixed(1)}" rx="2" style="fill: var(--primary); opacity: 0.5;"></rect>`;
  }).join('');
  const [px, py] = at(vx, vy);
  return `<div class="minimap"><svg width="156" height="100" aria-hidden="true">${rects}<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(vw * s).toFixed(1)}" height="${(vh * s).toFixed(1)}" rx="3" style="fill: none; stroke: var(--coral-deep); stroke-width: 1.5;"></rect></svg></div>`;
};

export const boardCanvas = (board, o) => {
  const {
    width, height, z = 0.8, tx = 40, ty = 200, selectedId = null, openEdgeId = null, dayFilter = null,
    readOnly = false, sidebarOpen = true, summaryBtn = false, summaryOpen = false,
    minimapOn = true, controlsOn = true, compact = false,
  } = o;
  const edges = board.links.map((l) => {
    const a = board.placeById.get(l.source);
    const b = board.placeById.get(l.target);
    return { l, a, b, ...stepPath(a.x + NODE_W, a.y + nodeH(a) / 2, b.x, b.y + nodeH(b) / 2) };
  });
  const svg = `<svg class="edges" width="10" height="10" aria-hidden="true">${edges.map((e) => `<path d="${e.d}"${e.l.id === openEdgeId ? ' class="sel"' : ''}></path>`).join('')}</svg>`;
  const nodes = board.places.map((p) => placeNode(p, {
    selected: p.id === selectedId, tools: p.id === selectedId && !readOnly, dim: dayFilter !== null && p.day !== dayFilter,
  })).join('');
  const labels = edges.map((e) => edgePill(e.a, e.b, e.l.mode, { open: e.l.id === openEdgeId, style: `left: ${e.lx}px; top: ${e.ly}px;` })).join('');
  const menu = edges.filter((e) => e.l.id === openEdgeId).map((e) => edgeMenu(e.a, e.b, e.l.mode, `left: ${e.lx}px; top: ${e.ly + 24}px;`)).join('');
  const placesBtn = readOnly ? '' : (compact
    ? `<span class="fbtn" style="width: 40px; height: 40px; padding: 0; justify-content: center;" aria-label="Show places panel">${icon('panel-left', 17)}</span>`
    : `<span class="fbtn">${icon('panel-left', 16)}${sidebarOpen ? 'Hide places' : 'Places'}</span>`);
  const summaryButton = summaryBtn ? (compact
    ? `<span class="fbtn" style="margin-left: auto; width: 40px; height: 40px; padding: 0; justify-content: center;" aria-label="Show route summary">${icon('list-ordered', 17)}</span>`
    : `<span class="fbtn" style="margin-left: auto;">${icon('list-ordered', 16)}${summaryOpen ? 'Hide summary' : 'Summary'}</span>`) : '';
  const top = `<div style="position: absolute; left: 12px; right: 12px; top: 12px; display: flex; align-items: flex-start; gap: 8px;">${placesBtn}${dayBar(board, dayFilter, { compact })}${summaryButton}</div>`;
  const controls = controlsOn ? `<div class="controls"><span>${icon('plus', 16)}</span><span>${icon('minus', 16)}</span><span>${icon('fit', 15)}</span></div>` : '';
  return `<div class="board dots-bg" style="width: ${width}px; height: ${height}px; flex: none;"><div class="flow" style="transform: translate(${tx}px, ${ty}px) scale(${z});">${svg}${nodes}${labels}${menu}</div>${top}${minimapOn ? minimap(board, { z, tx, ty, width, height }) : ''}${controls}</div>`;
};

export const boardSidebar = (board, { width = 300, height = 836, rows: maxRows = 99 } = {}) => {
  const region = board.trip.region;
  const list = catalog.filter((c) => c.region === region);
  const placed = new Set(board.places.map((p) => p.c.id));
  const rows = list.slice(0, maxRows).map((c) => `<div class="srow">${icon('grip', 14, 'faint')}<span class="thumb"><img src="${img(c.image)}" alt=""></span><div style="min-width: 0; flex: 1;"><p class="trunc" style="font: 650 13.5px/1.3 var(--body);">${esc(c.name)}</p><p class="row muted" style="gap: 6px; font-size: 11.5px; margin-top: 2px;"><span class="trunc">${esc(c.city)}</span>${rating(c.rating, 10)}</p>${placed.has(c.id) ? '<span class="chip chip-coral" style="margin-top: 5px; height: 18px; font-size: 9.5px;">On board</span>' : ''}</div><span class="btn btn-soft btn-icon btn-sm" aria-label="Add ${esc(c.name)} to the board">${icon('plus', 16)}</span></div>`).join('');
  return `<aside class="side" style="width: ${width}px; height: ${height}px; flex: none;"><div style="padding: 16px 16px 14px; border-bottom: 1px solid var(--line);"><p class="eyebrow">Places in Malaysia</p><p class="muted" style="font-size: 12.5px; margin: 4px 0 12px;">Drag a place onto the board, then connect the dots.</p>${input('Search by name, city or vibe', { ph: true, lead: icon('search', 16), style: 'height: 40px; border-radius: 999px;' })}<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 10px;">${select(region, { style: 'height: 36px; font-size: 12.5px;' })}${select('All categories', { style: 'height: 36px; font-size: 12.5px;' })}</div></div><div style="flex: 1; min-height: 0; overflow: hidden; padding: 12px; display: flex; flex-direction: column; gap: 8px;">${rows}</div><div style="border-top: 1px solid var(--line);"><div class="row" style="justify-content: space-between; padding: 12px 16px; font: 600 12.5px/1 var(--body);"><span class="row" style="gap: 8px;">${icon('pin', 14, '', ' style="color: var(--coral-deep);"')}Add a custom place</span>${icon('chevron-down', 14)}</div><p class="faint" style="padding: 10px 16px 12px; border-top: 1px solid var(--line); font-size: 11.5px;">${board.places.length} places on this board · ${list.length} in list</p></div></aside>`;
};

export const summaryPanel = (board, { width = 320, height = 836, closeBtn = false, border = true } = {}) => {
  const ordered = orderPlaces(board);
  const hasDays = ordered.some((p) => p.day);
  const byDay = new Map();
  for (const p of ordered) byDay.set(p.day ?? null, [...(byDay.get(p.day ?? null) ?? []), p]);
  const groups = hasDays
    ? [...byDay.entries()].sort(([a], [b]) => (a === null ? 1 : b === null ? -1 : a - b))
      .map(([day, ps]) => ({ day, places: [...ps].sort((x, y) => (x.time ?? '99:99').localeCompare(y.time ?? '99:99')) }))
    : [{ day: null, places: ordered }];
  const linkInto = (place, prev) => board.links.find((l) => l.target === place.id && (!prev || l.source === prev.id))
    ?? board.links.find((l) => l.target === place.id);
  const item = (g, p, i) => {
    const prev = i > 0 ? g.places[i - 1] : ordered[ordered.indexOf(p) - 1];
    const l = linkInto(p, prev);
    const src = l ? board.placeById.get(l.source) : null;
    const legLine = l && src
      ? `<p class="row faint" style="gap: 6px; margin: 0 0 6px 12px; font-size: 11.5px;">${icon(transport[l.mode].icon, 12)}${transport[l.mode].label} from ${esc(src.c.name)} · ${leg(src.c, p.c, l.mode).duration}</p>`
      : '';
    return `<li>${legLine}<div class="srow"><span class="thumb"><img src="${img(p.c.image)}" alt=""></span><div style="min-width: 0; flex: 1;"><p class="trunc" style="font: 650 13.5px/1.3 var(--body);">${esc(p.c.name)}</p><p class="trunc muted" style="font-size: 11.5px; margin-top: 2px;">${[fmtTime(p.time), p.c.city].filter(Boolean).map(esc).join(' · ')}</p>${p.notes ? `<p class="trunc faint" style="font-size: 11.5px; font-style: italic; margin-top: 2px;">${esc(p.notes)}</p>` : ''}</div></div></li>`;
  };
  const body = groups.map((g) => `<section style="margin-bottom: 18px;">${hasDays ? `<h3 class="eyebrow" style="margin-bottom: 10px; color: var(--muted);">${g.day ? `Day ${g.day}` : 'Unscheduled'}</h3>` : ''}<ol style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px;">${g.places.map((p, i) => item(g, p, i)).join('')}</ol></section>`).join('');
  return `<aside class="side" style="width: ${width}px; height: ${height}px; flex: none; border-right: 0;${border ? ' border-left: 1px solid var(--line);' : ''}"><div class="row" style="justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--line);"><p class="eyebrow row" style="gap: 6px;">${icon('list-ordered', 14)}Route summary</p>${closeBtn ? `<span class="btn btn-ghost btn-icon btn-sm" aria-label="Close summary">${icon('x', 16)}</span>` : `<span class="faint" style="font-size: 12px; font-weight: 600;">${board.places.length} stops</span>`}</div><div style="flex: 1; min-height: 0; overflow: hidden; padding: 14px 16px;">${body}</div></aside>`;
};

export const boardHeader = (trip, { mode = 'edit', dark = false, owner = 'Demo Traveler' } = {}) => {
  const meta = `<div class="row muted" style="gap: 14px; font-size: 12.5px; margin-top: 4px;">${mode === 'shared' ? `<span>by ${esc(owner)}</span>` : ''}${trip.region ? `<span class="row" style="gap: 5px;">${icon('pin', 13)}${esc(trip.region)}</span>` : ''}<span class="row" style="gap: 5px;">${icon('calendar', 13)}${dateRange(trip.start_date, trip.end_date)}</span></div>`;
  const badge = mode === 'view' ? `<span class="chip chip-mist">${icon('eye', 11)}Viewing</span>`
    : mode === 'shared' ? `<span class="chip chip-mist">${icon('eye', 11)}Shared</span>` : '';
  const title = `<div style="min-width: 0;"><h1 class="row" style="gap: 10px; font-size: 20px;"><span class="trunc">${esc(trip.destination)}</span>${badge}</h1>${meta}</div>`;
  const left = mode === 'shared'
    ? `${brand(28, true, 16)}<span class="vdiv"></span>${avatar(owner, 36)}${title}`
    : `<span class="btn btn-ghost btn-sm" style="padding: 0 10px 0 6px;">${icon('arrow-left', 16)}Dashboard</span><span class="vdiv"></span>${brandMark(28)}${title}`;
  const actions = {
    edit: `<span class="btn btn-outline btn-sm" style="color: var(--primary-ink);">${icon('share', 15)}Share</span><span class="btn btn-outline btn-sm">${icon('download', 15)}PDF</span><span class="btn btn-outline btn-sm">${icon('pencil', 15)}Trip</span><span class="btn btn-ghost btn-icon btn-sm" style="color: var(--danger);" aria-label="Delete trip">${icon('trash', 16)}</span><span class="vdiv"></span><span class="btn btn-primary btn-sm">${icon('circle-check', 15)}Save &amp; view</span>`,
    view: `<span class="btn btn-outline btn-sm" style="color: var(--primary-ink);">${icon('share', 15)}Share</span><span class="btn btn-outline btn-sm">${icon('download', 15)}PDF</span><span class="vdiv"></span><span class="btn btn-outline btn-sm">${icon('pen-line', 15)}Edit plan</span>`,
    shared: `<span class="btn btn-outline btn-sm">${icon('download', 15)}PDF</span><span class="btn btn-primary btn-sm">Plan your own</span>`,
  }[mode];
  return `<header class="bhead">${left}<div class="row" style="margin-left: auto; gap: 8px;">${actions}${themeToggle(dark)}</div></header>`;
};

export const boardScreenDesktop = (board, o = {}) => {
  const { mode = 'edit', sidebar = mode === 'edit', summary = mode !== 'edit', dark = false, ...canvas } = o;
  const cw = 1440 - (sidebar ? 300 : 0) - (summary ? 320 : 0);
  return `<div style="display: flex; flex-direction: column; width: 1440px; height: 900px;">${boardHeader(board.trip, { mode, dark })}<div style="display: flex; height: 836px;">${sidebar ? boardSidebar(board) : ''}${boardCanvas(board, { width: cw, height: 836, readOnly: mode !== 'edit', sidebarOpen: sidebar, summaryBtn: mode !== 'edit', summaryOpen: summary, ...canvas })}${summary ? summaryPanel(board) : ''}</div></div>`;
};
