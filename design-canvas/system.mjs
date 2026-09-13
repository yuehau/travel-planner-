// Design system artboards: foundations, components, states and the live SVG morph sheet.
import { doc, icon, esc, P, lerpPath, brandMark, themeToggle, likeBtn, heartSvg, field, input, select, avatar, loader, statusChip, planChip, boardFor, newsSeeds, popularPlaces, seedTrips, transport, modes, leg } from './lib.mjs';
import { placeNode, edgePill, edgeMenu, dayBar } from './board.mjs';
import { tripCard, newsCard, popularCard, fab, heroPins, tabBar } from './cards.mjs';

const kl = boardFor('seed-kl-city-lights');
const petaling = kl.placeById.get('seed-kl-petaling-street');
const petronas = kl.placeById.get('seed-kl-petronas-towers');

export const sysCss = `
.page{padding:64px 72px 80px;display:flex;flex-direction:column;gap:56px}
.sec{display:flex;flex-direction:column;gap:22px}
.sec-head h2{font-size:28px;margin-top:6px}
.sec-head p.muted{margin-top:6px;font-size:14px;max-width:640px}
.panel{background:var(--raised);border:1px solid var(--line);border-radius:24px;padding:28px}
.sw{display:flex;flex-direction:column;gap:8px}
.sw-chip{height:72px;border-radius:16px;border:1px solid rgb(27 37 89 / .08)}
.sw b{font:650 13px/1.3 var(--body);display:block}
.sw span{font:500 12px/1.4 var(--body);color:var(--faint)}
.specimen{display:grid;grid-template-columns:180px minmax(0,1fr);gap:24px;align-items:baseline;padding:18px 0;border-bottom:1px solid var(--line)}
.specimen:last-child{border-bottom:0}
.toast{display:inline-flex;align-items:center;gap:12px;padding:8px 8px 8px 16px;border-radius:16px;background:#1B2559;color:#EDF2FB;font:500 13.5px/1.3 var(--body);box-shadow:var(--shadow-2)}
.toast .undo{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:999px;background:rgb(255 255 255 / .08);color:#F0845C;font:700 13px/1 var(--body)}
@keyframes spin{to{transform:rotate(360deg)}}
.spinner{animation:spin .9s linear infinite}
@keyframes shimmer{0%{background-position:-240px 0}100%{background-position:240px 0}}
.skel{background:linear-gradient(90deg,var(--sunken) 0,var(--surface) 50%,var(--sunken) 100%);background-size:480px 100%;animation:shimmer 1.4s linear infinite;border-radius:10px}
.mtile{background:var(--raised);border:1px solid var(--line);border-radius:24px;padding:20px;display:flex;flex-direction:column;gap:14px}
.stage{position:relative;height:160px;border-radius:16px;background:var(--surface);display:flex;align-items:center;justify-content:center;overflow:hidden}
.spec{display:flex;flex-wrap:wrap;gap:6px}
.spec span{font:600 11px/1 var(--body);padding:6px 9px;border-radius:999px;background:var(--sunken);color:var(--muted)}
.xf{display:inline-grid}
.xf>span{grid-area:1/1;transition:opacity .2s ease}
.xf>.l2{opacity:0}
.mx:has(input:checked) .xf>.l1{opacity:0}
.mx:has(input:checked) .xf>.l2{opacity:1}
.psb{position:relative;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 20px;border-radius:999px;background:var(--primary);color:var(--on-primary);border:1px solid var(--primary);font:600 14px/1 var(--body);cursor:pointer;transition:background .28s var(--ease),color .28s ease,border-color .28s ease}
.psb:has(input:checked){background:var(--raised);color:var(--ink);border-color:var(--line2)}
.psb .ico{position:relative;width:16px;height:16px}
.psb .ico svg{position:absolute;inset:0;transition:opacity .2s ease,transform .28s var(--ease)}
.psb .ico .b{opacity:0;transform:rotate(-90deg) scale(.5)}
.psb:has(input:checked) .ico .a{opacity:0;transform:rotate(90deg) scale(.5)}
.psb:has(input:checked) .ico .b{opacity:1;transform:none}
.lq{position:relative;display:grid;grid-template-columns:repeat(3,80px);padding:4px;border-radius:999px;background:var(--sunken);border:1px solid var(--line)}
.lq input{position:absolute;opacity:0;pointer-events:none}
.lq label{position:relative;z-index:1;height:36px;display:flex;align-items:center;justify-content:center;gap:6px;font:600 13px/1 var(--body);color:var(--muted);cursor:pointer;transition:color .2s ease}
.lq .ind{position:absolute;top:4px;left:4px;width:80px;height:36px;border-radius:999px;background:var(--raised);box-shadow:var(--shadow-1);transition:transform .34s var(--ease)}
.lq:has(#lq1:checked) .ind{animation:stretch-a .34s var(--ease)}
.lq:has(#lq2:checked) .ind{transform:translateX(80px);animation:stretch-b .34s var(--ease)}
.lq:has(#lq3:checked) .ind{transform:translateX(160px);animation:stretch-c .34s var(--ease)}
.lq:has(#lq1:checked) label[for="lq1"],.lq:has(#lq2:checked) label[for="lq2"],.lq:has(#lq3:checked) label[for="lq3"]{color:var(--ink)}
@keyframes stretch-a{50%{scale:1.22 .84}}@keyframes stretch-b{50%{scale:1.22 .84}}@keyframes stretch-c{50%{scale:1.22 .84}}
.tp{display:flex;flex-direction:column;align-items:center;gap:14px}
.tp input{position:absolute;opacity:0;pointer-events:none}
.tp-pill{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px 0 6px;border-radius:999px;background:var(--raised);border:1px solid var(--line);box-shadow:var(--shadow-1);font:600 13px/1 var(--body)}
.tp-ic{position:relative;width:28px;height:28px;border-radius:999px;background:var(--coral-soft);color:var(--coral-deep)}
.tp-ic svg{position:absolute;left:6px;top:6px;opacity:0;transform:scale(.3) rotate(-30deg);transition:opacity .16s ease,transform .3s var(--ease)}
.tp-lb>span{display:none}
.tp-opts{display:flex;gap:6px}
.tp-opts label{display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;border:1px solid var(--line);background:var(--raised);color:var(--muted);cursor:pointer}
${modes.map((m, i) => `.tp:has(#tp-${m}:checked) .i-${m}{opacity:1;transform:none}.tp:has(#tp-${m}:checked) .l-${m}{display:inline}.tp:has(#tp-${m}:checked) .tp-ic{animation:blob-${i} .34s var(--ease)}.tp:has(#tp-${m}:checked) label[for="tp-${m}"]{background:var(--primary);border-color:var(--primary);color:var(--on-primary)}@keyframes blob-${i}{40%{border-radius:34%;transform:scale(1.25) rotate(10deg)}}`).join('')}
@keyframes grow-pin-b{0%{d:path("${P.DOT}");transform:translate(var(--dx,0px),var(--dy,0px))}55%{d:path("${P.DOT}")}100%{d:path("${P.PIN}");transform:translate(0,0)}}
@keyframes draw-b{to{stroke-dashoffset:0}}
.replay:has(input:checked) .pin-in{animation-name:grow-pin-b}
.replay:has(input:checked) .route-draw{animation-name:draw-b}
.replay-btn{position:absolute;right:10px;bottom:10px}
.frames{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.frame{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px 8px 12px;border-radius:16px;background:var(--surface)}
.frame span{font:600 11px/1 var(--body);color:var(--faint)}
`;

const sec = (eyebrow, title, sub, body) => `<section class="sec"><div class="sec-head"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${sub ? `<p class="muted">${sub}</p>` : ''}</div>${body}</section>`;
const grid = (cols, gap, body, style = '') => `<div style="display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: ${gap}px; ${style}">${body}</div>`;
const pageHead = (eyebrow, title, sub) => `<header style="display: flex; align-items: flex-end; justify-content: space-between; gap: 32px; padding-bottom: 28px; border-bottom: 1px solid var(--line);"><div><p class="eyebrow">${eyebrow}</p><h1 style="font-size: 48px; margin-top: 10px;">${title}</h1><p class="muted" style="margin-top: 12px; font-size: 16px; max-width: 720px;">${sub}</p></div><span class="row" style="gap: 12px;">${brandMark(44)}</span></header>`;

// ---------- Foundations ----------
const lightSwatches = [
  ['Surface', '#EDF2FB', 'page'], ['Raised', '#FFFFFF', 'cards, panels'], ['Sunken', '#E2EAFC', 'tracks, wells'], ['Line', '#D7E3FC', 'dividers'], ['Line strong', '#B6CCFE', 'inputs'], ['Ink', '#1B2559', '12.8:1'], ['Muted', '#4F5A86', '6.0:1'],
  ['Faint', '#5F6994', '4.7:1 · hints'], ['Primary', '#4F6BD8', 'white text 4.7:1'], ['Periwinkle', '#7F9BF2', 'illustration'], ['Coral', '#F0845C', 'navy text 5.6:1'], ['Coral deep', '#C9532B', 'stars, 4.4:1'], ['Positive', '#3E7A56', '5.1:1'], ['Danger', '#B83A55', '5.6:1'],
];
const darkSwatches = [
  ['Surface', '#131A3A', 'page'], ['Raised', '#1B2450', 'cards'], ['Sunken', '#0E1430', 'tracks'], ['Line', '#2B3874', 'dividers'], ['Ink', '#EDF2FB', '15.1:1'], ['Muted', '#B6C2EE', '9.7:1'], ['Faint', '#8994C8', '5.0:1'],
  ['Primary', '#ABC4FF', 'navy text 10.4:1'], ['Coral', '#F59A78', 'navy text 8.4:1'], ['Positive', '#8FC7A5', ''], ['Danger', '#F08AA0', '7.2:1'], ['Dot grid', '#2B3874', 'board'],
];
const swatch = ([name, hex, note]) => `<div class="sw"><div class="sw-chip" style="background: ${hex};"></div><div><b>${name}</b><span>${hex}${note ? ` · ${note}` : ''}</span></div></div>`;

export const foundations = () => doc(`<div class="page">
${pageHead('TravelPlanner · design system v2', 'Evolved mist', 'The calm periwinkle identity stays. Added: one warm Sunset coral accent for the moments that matter (new trips, likes, "on board"), a real type pairing, contrast-checked text tokens and one radius per role.')}
${sec('Colour', 'Light theme', 'Every text token passes WCAG AA on the surfaces it is used on. Coral always carries navy text; white on coral is 2.6:1 and is never used.', grid(7, 16, lightSwatches.map(swatch).join('')))}
<div class="dark panel" style="background: var(--surface); border-color: var(--line);">${sec('Colour', 'Dark theme', 'Navy surfaces, lifted periwinkle primary and a lighter coral. Used for the whole app and shown on the Trip Board artboard.', grid(6, 16, darkSwatches.map(swatch).join('')))}</div>
${sec('Type', 'Bricolage Grotesque + Plus Jakarta Sans', 'Bricolage carries personality in headings only; Jakarta handles every UI label, number and paragraph. Replaces Inter, which the app declared but never loaded.', `<div class="panel">
<div class="specimen"><span class="eyebrow">Display · 64 / 800</span><p style="font: 800 64px/1.02 var(--display); letter-spacing: -0.035em;">Plan the flow, enjoy the trip.</p></div>
<div class="specimen"><span class="eyebrow">H1 · 44 / 700</span><p style="font: 700 44px/1.08 var(--display); letter-spacing: -0.025em;">Hi Demo, your boards</p></div>
<div class="specimen"><span class="eyebrow">H2 · 30 / 700</span><p style="font: 700 30px/1.15 var(--display); letter-spacing: -0.02em;">Places travellers are adding to their boards</p></div>
<div class="specimen"><span class="eyebrow">H3 · 20 / 700</span><p style="font: 700 20px/1.2 var(--display); letter-spacing: -0.015em;">Penang Heritage &amp; Street Food</p></div>
<div class="specimen"><span class="eyebrow">Body L · 16 / 400</span><p style="font: 400 16px/1.65 var(--body); max-width: 640px;">Murals, clan houses and hawker stalls around George Town, then up the hill for sunset.</p></div>
<div class="specimen"><span class="eyebrow">Body · 14 / 500</span><p style="font: 500 14px/1.5 var(--body);">Drag a place onto the board, then connect the dots.</p></div>
<div class="specimen"><span class="eyebrow">Label · 12.5 / 600</span><p style="font: 600 12.5px/1.2 var(--body); color: var(--muted);">Start date</p></div>
<div class="specimen"><span class="eyebrow">Eyebrow · 11 / 700</span><p class="eyebrow">Popular right now in Malaysia</p></div>
<div class="specimen"><span class="eyebrow">Numbers · tabular</span><p style="font: 600 14px/1.2 var(--body); font-variant-numeric: tabular-nums;">48,211 reviews · Train · 35 min · ≈ 11.5 km</p></div>
</div>`)}
${grid(2, 24, `${sec('Shape', 'One radius per role', '', `<div class="panel" style="display: flex; gap: 20px; align-items: flex-end; flex-wrap: wrap;">${[['Pill · 999', 999, 96, 40], ['Input · 12', 12, 96, 44], ['Tile · 16', 16, 96, 72], ['Node · 18', 18, 96, 72], ['Card · 24', 24, 96, 96], ['Modal · 28', 28, 96, 96]].map(([label, r, w, h]) => `<div style="display: flex; flex-direction: column; gap: 10px; align-items: center;"><div style="width: ${w}px; height: ${h}px; border-radius: ${r}px; background: var(--sunken); border: 1px solid var(--line2);"></div><span class="faint" style="font-size: 12px; font-weight: 600;">${label}</span></div>`).join('')}</div>`)}
${sec('Depth', 'Three navy-tinted shadows', '', `<div class="panel" style="display: flex; gap: 24px; background: var(--surface);">${[['1 · resting', 'var(--shadow-1)'], ['2 · floating', 'var(--shadow-2)'], ['3 · modal', 'var(--shadow-3)']].map(([label, s]) => `<div style="flex: 1; height: 110px; border-radius: 20px; background: var(--raised); box-shadow: ${s}; display: flex; align-items: flex-end; padding: 14px;"><span class="faint" style="font-size: 12px; font-weight: 600;">${label}</span></div>`).join('')}</div>`)}`)}
${sec('Motion tokens', 'Morph, don’t decorate', 'One easing curve for every morph. Only the loader loops; everything else is triggered by a person and settles in under a third of a second.', `<div class="panel" style="display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: 40px; align-items: center;"><svg width="200" height="160" viewBox="-10 -10 120 120" aria-hidden="true"><rect x="0" y="0" width="100" height="100" rx="6" style="fill: var(--surface); stroke: var(--line);"></rect><path d="M0 100 C65 100 35 0 100 0" style="fill: none; stroke: var(--coral-deep); stroke-width: 3; stroke-linecap: round;"></path><circle cx="0" cy="100" r="4" style="fill: var(--primary);"></circle><circle cx="100" cy="0" r="4" style="fill: var(--primary);"></circle></svg>${grid(4, 16, [['--ease-morph', 'cubic-bezier(.65, 0, .35, 1)'], ['--duration-micro', '180 ms · hovers, fades'], ['--duration-morph', '280 ms · icon morphs'], ['--duration-hero', '900 ms · once, on load'], ['Reverse', '≈ 65% of forward'], ['Loader', '1.8 s loop'], ['Reduced motion', 'snap to end shape'], ['Rule', 'max 1–2 morphs per view']].map(([k, v]) => `<div style="padding: 14px 16px; border-radius: 16px; background: var(--surface);"><p style="font: 700 13px/1.3 var(--body);">${k}</p><p class="muted" style="font-size: 12.5px; margin-top: 4px;">${v}</p></div>`).join(''))}</div>`)}
</div>`, { width: 1440, height: 2760, css: sysCss });

// ---------- Components ----------
const spinner = `<svg class="spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9" opacity=".9"></path></svg>`;
export const confirmDialog = (style = 'position: relative;') => `<div class="modal" style="${style} width: 420px;"><div style="padding: 28px 28px 8px; display: flex; flex-direction: column; gap: 14px;"><span style="display: flex; width: 48px; height: 48px; border-radius: 16px; align-items: center; justify-content: center; background: var(--danger-soft); color: var(--danger);">${icon('trash', 22)}</span><h3 style="font-size: 22px;">Delete KL City Lights?</h3><p class="muted" style="font-size: 14px; line-height: 1.55;">This removes the board with its 7 places and 6 routes. You can undo for a few seconds afterwards.</p></div><div class="row" style="justify-content: flex-end; gap: 10px; padding: 20px 28px 24px;"><span class="btn btn-outline">Cancel</span><span class="btn btn-danger">Delete board</span></div></div>`;
export const toast = (text) => `<div class="toast" role="status">${icon('circle-check', 16)}<span>${esc(text)}</span><span class="undo">${icon('undo', 14)}Undo</span></div>`;

const tripPost = {
  kind: 'trip', category: 'trip', title: 'My plan for KL City Lights', city: 'Kuala Lumpur', author: 'Demo Traveler', publishedAt: '2026-09-12', coverImage: '/regions/kuala-lumpur.svg', baseLikes: 5,
  excerpt: 'Look guys, this is my plan for Kuala Lumpur (KL City Lights). Stops: Batu Caves → Merdeka Square → Petaling Street → Petronas Twin Towers → KLCC Park → Jalan Alor Food Street → Heli Lounge Bar.',
};
export { tripPost };

export const components = () => doc(`<div class="page">
${pageHead('TravelPlanner · design system v2', 'Components', 'The shared primitives that replace ten copy-pasted versions of the same input, alert and modal. Every control is 40–52 px tall, every button is a pill.')}
${sec('Actions', 'Buttons', 'One primary per view. Coral is reserved for creating and loving things; destructive actions are red and set apart.', `<div class="panel" style="display: flex; flex-direction: column; gap: 22px;">
<div class="row" style="gap: 12px; flex-wrap: wrap;"><span class="btn btn-primary">${icon('circle-check', 16)}Save &amp; view</span><span class="btn btn-coral">${icon('plus', 16)}New Trip</span><span class="btn btn-outline">${icon('download', 16)}PDF</span><span class="btn btn-outline" style="color: var(--primary-ink);">${icon('share', 16)}Share</span><span class="btn btn-soft">Cancel</span><span class="btn btn-ghost">Sign in</span><span class="btn btn-danger">${icon('trash', 16)}Delete board</span><span class="btn btn-danger-ghost">Revoke link</span></div>
<div class="row" style="gap: 12px; flex-wrap: wrap; align-items: center;"><span class="btn btn-primary btn-sm">Small · 32</span><span class="btn btn-primary">Medium · 40</span><span class="btn btn-primary btn-lg">Large · 52${icon('arrow-right', 18)}</span><span class="btn btn-outline btn-icon" aria-label="Edit">${icon('pencil', 16)}</span><span class="btn btn-soft btn-icon btn-sm" aria-label="Add">${icon('plus', 16)}</span><span class="btn btn-primary is-disabled">Disabled</span><span class="btn btn-primary" style="opacity: 0.8;">${spinner}Saving…</span></div>
</div>`)}
${sec('Forms', 'Inputs with real labels', 'Visible labels on every field (the sign-in form used placeholders only). Errors sit under the field and say how to fix them.', `<div class="panel">${grid(4, 20, [
  field('Trip name', input('Penang long weekend'), { req: true }),
  field('Search', input('Search trips or regions', { ph: true, lead: icon('search', 16), style: 'border-radius: 999px;' })),
  field('Email', input('demo@travelplanner.local', { cls: 'focus', lead: icon('mail', 16) })),
  field('Password', input('••••••', { cls: 'error', lead: icon('lock', 16) }), { error: 'Use at least 8 characters.' }),
  field('Region', select('Kuala Lumpur')),
  field('Start date', input('Nov 6, 2026', { trail: icon('calendar', 16) })),
  field('Email', input('demo@travelplanner.local', { cls: 'readonly' }), { help: 'Read-only · used to sign in' }),
  field('Country', input('Malaysia', { cls: 'disabled' }), { help: 'Disabled while saving' }),
].join(''))}<div style="margin-top: 20px;">${field('Short bio', `<div class="input area">Slow mornings, street food, one museum per trip.</div>`, { help: '48 / 280' })}</div></div>`)}
${grid(2, 24, `${sec('Status', 'Chips &amp; tags', 'Two status systems, kept apart: the plan (left, Draft / Complete) and the calendar (right, Upcoming / Active / Past).', `<div class="panel" style="display: flex; flex-direction: column; gap: 16px;"><div class="row" style="gap: 8px; flex-wrap: wrap;">${planChip('draft')}${planChip('complete')}<span style="width: 12px;"></span>${statusChip('upcoming')}${statusChip('active')}${statusChip('past')}</div><div class="row" style="gap: 8px; flex-wrap: wrap;"><span class="chip chip-coral">Demo</span><span class="chip chip-coral">On board</span><span class="chip chip-mist">${icon('eye', 11)}Viewing</span><span class="chip chip-mist">${icon('eye', 11)}Shared</span><span class="chip chip-navy">${icon('route', 11)}Trip plan</span><span class="chip chip-navy">${icon('calendar-days', 11)}Day 2 · 3:30 PM</span></div><div class="row" style="gap: 8px; flex-wrap: wrap;">${['Landmark', 'Food', 'Café', 'Nature', 'Beach', 'Culture', 'Nightlife', 'Shopping'].map((t) => `<span class="tag">${t}</span>`).join('')}</div></div>`)}
${sec('Navigation', 'Segments, filters, days', '', `<div class="panel" style="display: flex; flex-direction: column; gap: 18px;"><div class="seg"><span class="seg-item on">${icon('briefcase', 16)}My Trips</span><span class="seg-item">${icon('newspaper', 16)}News</span><span class="seg-item">${icon('bookmark', 16)}Collections</span></div><div class="pills"><span class="pill on">All stories</span><span class="pill">Trip plan</span><span class="pill">Café</span><span class="pill">Restaurant</span><span class="pill">Attraction</span><span class="pill">Event</span></div>${dayBar(kl, 2)}<div style="position: relative; width: 390px; height: 76px; border-radius: 16px; overflow: hidden; border: 1px solid var(--line);">${tabBar('trips')}</div></div>`)}`)}
${sec('Content', 'Cards', 'Trip cards now show both statuses and the board size; news cards keep the like on the right; place nodes are unchanged in size so saved boards still line up.', `<div style="display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap;">${tripCard(seedTrips[1], { w: 300 })}${newsCard(tripPost, { w: 320, mine: true })}${popularCard(popularPlaces[0])}<div style="display: flex; flex-direction: column; gap: 24px;"><div style="position: relative; padding-top: 58px;">${placeNode(petronas, { selected: true, tools: true, style: ' position: relative; left: auto; top: auto;' })}</div>${placeNode(kl.placeById.get('seed-kl-klcc-park'), { dim: true, style: ' position: relative; left: auto; top: auto;' })}</div><div style="position: relative; width: 210px;">${edgePill(petaling, petronas, 'train', { open: true, style: 'position: relative; transform: none; left: 0; top: 0;' })}${edgeMenu(petaling, petronas, 'train', 'position: relative; transform: none; left: 0; top: 0; margin-top: 10px;')}</div></div>`)}
${sec('Feedback', 'Alerts, toasts, confirmations', 'window.confirm() is replaced by a designed dialog; quick removals get an undo toast instead of a question.', `<div style="display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 24px; align-items: start;"><div class="panel" style="display: flex; flex-direction: column; gap: 14px;"><div class="alert alert-danger">${icon('alert', 16)}<span><b>Could not save the new position.</b> Check your connection — your board will retry when you move a card again.</span></div><div class="alert alert-pos">${icon('circle-check', 16)}<span><b>Profile saved.</b> Shown on the plans and stories you share.</span></div><div class="alert alert-info">${icon('eye', 16)}<span>Anyone with the link can view this board read-only, with the route summary and a PDF download.</span></div><div class="row" style="gap: 14px; flex-wrap: wrap; margin-top: 6px;">${toast('Removed Jalan Alor Food Street')}${likeBtn(128)}${likeBtn(214, { liked: true })}${likeBtn(96, { size: 'md' })}</div></div>${confirmDialog()}</div>`)}
</div>`, { width: 1440, height: 2860, css: sysCss });

// ---------- States ----------
const emptyArt = () => `<svg width="220" height="96" viewBox="0 0 220 96" aria-hidden="true" style="overflow: visible;"><path class="route-draw" d="M46 70 C100 70 118 34 176 34" style="--len: 150; fill: none; stroke: var(--line2); stroke-width: 2.5; stroke-linecap: round;"></path><circle cx="182" cy="34" r="9" style="fill: var(--raised); stroke: var(--primary); stroke-width: 2.5; stroke-dasharray: 4 4;"></circle><g transform="translate(28 38) scale(1.5)"><path class="pin-in" d="${P.PIN}"></path></g></svg>`;
export const emptyBoardCard = (readOnly = false) => `<div class="card" style="max-width: 380px; padding: 28px 30px; text-align: center; border-style: dashed; border-color: var(--line2); background: rgb(255 255 255 / 0.86); box-shadow: var(--shadow-2); display: flex; flex-direction: column; align-items: center; gap: 12px;"><span class="replay">${emptyArt()}</span><h3 style="font-size: 20px;">${readOnly ? 'Nothing on this board yet' : 'Your board is empty'}</h3>${readOnly ? '' : '<p class="muted" style="font-size: 14px; line-height: 1.55;">Drag a place from the left panel onto the canvas. Then drag from the right dot of one card to the left dot of another to plan the route.</p>'}</div>`;

export const states = () => doc(`<div class="page">
${pageHead('TravelPlanner · design system v2', 'Empty, loading &amp; error', 'Every list and canvas has all three. Empty states morph once when they appear; loading uses the plane-to-pin loader or skeletons, never a blank page.')}
${grid(3, 24, `<div class="panel dots-bg" style="height: 360px; display: flex; align-items: center; justify-content: center;">${emptyBoardCard()}</div>
<div class="panel" style="height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center;"><span style="display: flex; width: 64px; height: 64px; border-radius: 20px; align-items: center; justify-content: center; background: var(--coral-soft); color: var(--coral-deep);">${icon('bookmark', 28)}</span><h3 style="font-size: 20px;">Nothing saved here yet</h3><p class="muted" style="font-size: 14px; max-width: 280px;">Save a destination you want to visit, then turn it into a board with one tap.</p><span class="btn btn-outline btn-sm">${icon('plus', 15)}Save a destination</span></div>
<div class="panel" style="height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; text-align: center;"><span style="display: flex; width: 64px; height: 64px; border-radius: 20px; align-items: center; justify-content: center; background: var(--sunken); color: var(--primary-ink);">${icon('newspaper', 28)}</span><h3 style="font-size: 20px;">No stories in this category yet</h3><p class="muted" style="font-size: 14px; max-width: 280px;">Try All stories, or share one of your boards as a trip plan.</p><span class="btn btn-ghost btn-sm">Show all stories</span></div>`)}
${grid(3, 24, `<div class="panel" style="height: 320px; display: flex; align-items: center; justify-content: center;">${loader(40, 'Loading board')}</div>
<div class="panel" style="height: 320px; display: flex; flex-direction: column; gap: 14px;"><div class="skel" style="height: 150px; border-radius: 18px;"></div><div class="skel" style="height: 18px; width: 70%;"></div><div class="skel" style="height: 14px; width: 50%;"></div><div class="skel" style="height: 14px; width: 40%;"></div></div>
<div class="panel" style="height: 320px; display: flex; flex-direction: column; justify-content: center; gap: 12px;"><span class="btn btn-ghost btn-sm" style="align-self: flex-start; padding: 0 8px 0 4px;">${icon('arrow-left', 16)}Back to Dashboard</span><h3 style="font-size: 26px;">Trip unavailable</h3><p class="muted" style="font-size: 14px;">This trip was not found or is not available to this account.</p><span class="btn btn-primary btn-sm" style="align-self: flex-start;">Go to My Trips</span></div>`)}
</div>`, { width: 1440, height: 1060, css: sysCss });

// ---------- Motion ----------
const tile = (n, title, stage, specs) => `<div class="mtile"><div class="row" style="justify-content: space-between;"><p style="font: 700 14px/1.3 var(--body);"><span class="faint" style="margin-right: 8px;">${String(n).padStart(2, '0')}</span>${title}</p></div><div class="stage">${stage}</div><div class="spec">${specs.map((s) => `<span>${s}</span>`).join('')}</div></div>`;
const plusX = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><path class="mp" d="M12 5 L12 19 M5 12 L19 12"></path></svg>`;
const tpDemo = () => `<div class="tp">${modes.map((m) => `<input type="radio" name="tp" id="tp-${m}"${m === 'train' ? ' checked' : ''}>`).join('')}<span class="tp-pill"><span class="tp-ic">${modes.map((m) => icon(transport[m].icon, 16, `i-${m}`)).join('')}</span><span class="tp-lb">${modes.map((m) => `<span class="l-${m}">${transport[m].label} · ${leg(petaling.c, petronas.c, m).duration}</span>`).join('')}</span>${icon('chevron-down', 12)}</span><div class="tp-opts">${modes.map((m) => `<label for="tp-${m}" aria-label="${transport[m].label}">${icon(transport[m].icon, 16)}</label>`).join('')}</div></div>`;
const lqDemo = () => `<div class="lq"><input type="radio" name="lq" id="lq1" checked><input type="radio" name="lq" id="lq2"><input type="radio" name="lq" id="lq3"><span class="ind"></span><label for="lq1">${icon('briefcase', 15)}Trips</label><label for="lq2">${icon('newspaper', 15)}News</label><label for="lq3">${icon('bookmark', 15)}Saved</label></div>`;

const strokeSvg = (d, size = 56, extra = '') => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color: var(--ink);">${extra}<path d="${d}"></path></svg>`;
const fillSvg = (d, color = 'var(--primary)', size = 56) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}" style="fill: ${color}; fill-rule: evenodd;"></path></svg>`;
const strip = (title, sub, frames) => `<div class="mtile"><div><p style="font: 700 14px/1.3 var(--body);">${title}</p><p class="muted" style="font-size: 12.5px; margin-top: 2px;">${sub}</p></div><div class="frames">${frames.map(([svg, label]) => `<div class="frame">${svg}<span>${label}</span></div>`).join('')}</div></div>`;

export const motion = () => doc(`<div class="page">
${pageHead('TravelPlanner · motion', 'SVG morphs', 'Point-matched shapes that turn into each other, like the SVGator references, but hand-authored and shipped without a runtime. Hover and click the stages — they are live.')}
${grid(4, 20, [
  tile(1, 'Brand mark · plane → pin', `<span class="brand-hover" style="cursor: pointer;">${brandMark(76)}</span><span class="faint" style="position: absolute; bottom: 10px; font-size: 11px; font-weight: 600;">Hover me</span>`, ['hover', '280 ms', 'take-off → arrive']),
  tile(2, 'Preloader', loader(40), ['loading', '1.8 s loop', 'dot → pin → plane']),
  tile(3, 'Theme toggle', `<span style="transform: scale(1.9); display: inline-flex;">${themeToggle(false, 'tt-demo')}</span>`, ['click', '280 ms', 'rays retract into moon']),
  tile(4, 'Like', likeBtn(128, { size: 'md' }), ['click', '320 ms pop', 'outline → filled']),
  tile(5, 'New Trip FAB', fab('New Trip', 'position: relative;'), ['click', '280 ms', '+ → × while modal open']),
  tile(6, 'Plan status', `<label class="psb mx"><input type="checkbox"><span class="ico">${icon('circle-check', 16, 'a')}${icon('pen-line', 16, 'b')}</span><span class="xf"><span class="l1">Save &amp; view</span><span class="l2">Edit plan</span></span></label>`, ['click', '280 ms', 'primary → outline, no width jump']),
  tile(7, 'Panel toggle', `<label class="fbtn pt mx" style="cursor: pointer; height: 40px;"><input type="checkbox"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M9 3v18"></path><path class="mp chev" d="${P.CHEV_CLOSE}"></path></svg><span class="xf"><span class="l1">Hide places</span><span class="l2">Places</span></span></label>`, ['click', '240 ms', 'chevron flips']),
  tile(8, 'Transport', tpDemo(), ['select', '340 ms', 'icon morphs through a blob']),
  tile(9, 'Copy link', `<label class="btn btn-primary cc mx" style="cursor: pointer;"><input type="checkbox"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="mp back" d="${P.COPY_BACK}"></path><path class="mp front" d="${P.COPY}"></path></svg><span class="xf"><span class="l1">Copy</span><span class="l2">Copied</span></span></label>`, ['click', '280 ms', 'copy → check']),
  tile(10, 'Hero pins', `<span class="replay" style="display: contents;">${heroPins({ w: 240, h: 90, pts: [[30, 62], [120, 34], [210, 62]] })}<label class="btn btn-soft btn-sm replay-btn mx"><input type="checkbox">Replay</label></span>`, ['once on load', '900 ms', 'one blob → three pins']),
  tile(11, 'Empty board', `<span class="replay" style="display: contents;">${emptyArt()}<label class="btn btn-soft btn-sm replay-btn mx"><input type="checkbox">Replay</label></span>`, ['on mount', '900 ms', 'pin grows, route draws']),
  tile(12, 'Active pill', lqDemo(), ['click', '340 ms', 'slides and stretches']),
].join(''))}
${sec('Storyboards', 'In-between frames', 'Every pair shares its point count, so the middle frame is a real shape — no tearing. Frames are generated from the same paths the app will ship.', grid(3, 20, [
  strip('Brand · plane → pin', 'hover · 280 ms', [[fillSvg(P.PLANE, '#1B2559'), '0 ms'], [fillSvg(lerpPath(P.PLANE, P.PIN, 0.5), '#8A5A7A'), '140 ms'], [fillSvg(P.PIN, 'var(--coral)'), '280 ms']]),
  strip('Loader · dot → pin → plane', '1.8 s loop', [[fillSvg(P.DOT), '0 s'], [fillSvg(P.PIN), '0.6 s'], [fillSvg(P.PLANE), '1.2 s']]),
  strip('Theme · sun → moon', 'click · 280 ms', [[strokeSvg(P.SUN, 56, `<path d="${P.RAYS}"></path>`), '0 ms'], [`<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="color: var(--ink); transform: rotate(-20deg);"><path d="${P.RAYS}" transform="translate(12 12) scale(.65) translate(-12 -12)" opacity=".45"></path><path d="${lerpPath(P.SUN, P.MOON, 0.5)}"></path></svg>`, '140 ms'], [`<svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true" style="color: var(--ink); transform: rotate(-40deg);"><path d="${P.MOON}"></path></svg>`, '280 ms']]),
  strip('Copy → check', 'click · 280 ms', [[strokeSvg(P.COPY, 56, `<path d="${P.COPY_BACK}"></path>`), '0 ms'], [strokeSvg(lerpPath(P.COPY, P.CHECK, 0.5), 56, `<path d="${P.COPY_BACK}" opacity=".4"></path>`), '140 ms'], [strokeSvg(P.CHECK), '280 ms']]),
  strip('Like · outline → filled', 'click · 320 ms', [[`<span style="color: var(--muted);">${heartSvg(56)}</span>`, '0 ms'], [`<span style="color: var(--coral-deep); display: inline-flex; transform: scale(1.3);"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="${P.HEART}" style="fill: var(--coral); fill-opacity: .5;"></path></svg></span>`, '140 ms'], [`<span style="color: var(--coral-deep);"><svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="${P.HEART}" style="fill: var(--coral);"></path></svg></span>`, '320 ms']]),
  strip('Hero · straight → wave', 'once on load · 900 ms', [[`<svg width="120" height="40" viewBox="0 0 188 20" aria-hidden="true"><path d="${P.LINE}" style="fill: none; stroke: var(--coral); stroke-width: 4; stroke-linecap: round;"></path></svg>`, '0 ms'], [`<svg width="120" height="40" viewBox="0 0 188 20" aria-hidden="true"><path d="${lerpPath(P.LINE, P.WAVE, 0.5)}" style="fill: none; stroke: var(--coral); stroke-width: 4; stroke-linecap: round;"></path></svg>`, '450 ms'], [`<svg width="120" height="40" viewBox="0 0 188 20" aria-hidden="true"><path d="${P.WAVE}" style="fill: none; stroke: var(--coral); stroke-width: 4; stroke-linecap: round;"></path></svg>`, '900 ms']]),
].join('')))}
${sec('Implementation', 'How it ships', '', `<div class="panel" style="padding: 8px 28px;">${[
  ['morphPaths.ts', 'Every pair above lives here, point-matched, on the 24 px grid with a 2 px round stroke so they sit beside Lucide.'],
  ['<MorphIcon shapes active />', 'One <path> with an SVG <animate attributeName="d"> started by beginElement(); works in Chrome, Edge, Firefox and Safari. No new dependency.'],
  ['Where', 'BrandMark, LoadingSpinner, ThemeToggle, LikeButton, the New Trip FAB, Save & view, the panel toggles, RouteEdge, ShareDialog copy, LandingPage hero, empty states, and MorphingPillGroup.'],
  ['Guardrails', 'Fixed icon boxes (no layout shift). Nothing morphs inside the canvas while dragging. prefers-reduced-motion snaps straight to the end shape.'],
].map(([k, v]) => `<div class="specimen" style="grid-template-columns: 260px minmax(0, 1fr);"><span style="font: 700 13.5px/1.4 var(--body); font-family: ui-monospace, 'SF Mono', Menlo, monospace;">${esc(k)}</span><p class="muted" style="font-size: 14px; line-height: 1.55;">${esc(v)}</p></div>`).join('')}</div>`)}
</div>`, { width: 1440, height: 2280, css: sysCss });
