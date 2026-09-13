// App chrome and cards shared by desktop, mobile and the component sheet.
import { esc, icon, img, fmtTripDate, fmtNewsDate, fmtNum, categoryLabels, newsCategoryLabels, regionCover, tripStatus, tripDayCount, brand, themeToggle, avatar, likeBtn, statusChip, planChip, P } from './lib.mjs';

export const dateRange = (start, end) => {
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  const md = (d) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  return s.getFullYear() === e.getFullYear() ? `${md(s)} – ${md(e)}, ${e.getFullYear()}` : `${fmtTripDate(start)} – ${fmtTripDate(end)}`;
};

export const appNav = (active = 'trips', { demo = true, name = 'Demo Traveler', width = 1232 } = {}) => {
  const items = [['trips', 'briefcase', 'My Trips'], ['news', 'newspaper', 'News'], ['collections', 'bookmark', 'Collections']];
  const ring = active === 'profile' ? 'box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--primary); border-radius: 999px;' : '';
  return `<nav style="display: flex; align-items: center; justify-content: space-between; width: ${width}px; height: 84px; margin: 0 auto;"><div class="row" style="gap: 12px;">${brand(32)}${demo ? '<span class="chip chip-coral">Demo</span>' : ''}</div><div class="seg">${items.map(([k, ic, label]) => `<span class="seg-item${k === active ? ' on' : ''}">${icon(ic, 16)}${label}</span>`).join('')}</div><div class="row" style="gap: 4px;">${themeToggle()}<span class="btn btn-ghost btn-icon" aria-label="Sign out" title="Sign out">${icon('log-out', 18)}</span><span style="margin-left: 6px; ${ring}">${avatar(name, 38)}</span></div></nav>`;
};

export const fab = (label = 'New Trip', style = 'position: absolute; right: 32px; bottom: 32px;') => `<label class="btn btn-coral btn-lg fab" style="${style} box-shadow: 0 18px 40px -16px rgb(201 83 43 / 0.6);"><input type="checkbox" style="position: absolute; opacity: 0; width: 1px; height: 1px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" aria-hidden="true"><path class="mp" d="M12 5 L12 19 M5 12 L19 12"></path></svg>${label}</label>`;

export const tripCard = (trip, { w = 292 } = {}) => {
  const status = tripStatus(trip.start_date, trip.end_date);
  const plan = trip.status === 'complete' ? 'complete' : 'draft';
  const days = tripDayCount(trip.start_date, trip.end_date);
  return `<article class="card" style="width: ${w}px; overflow: hidden; box-shadow: var(--shadow-1); flex: none;"><div class="cover" style="position: relative; height: ${Math.round(w * 10 / 16)}px;"><img src="${regionCover(trip.region)}" alt=""><div style="position: absolute; left: 12px; right: 12px; top: 12px; display: flex; justify-content: space-between;">${planChip(plan)}${statusChip(status)}</div></div><div style="padding: 18px 20px 20px;"><h3 class="trunc" style="font-size: 20px;">${esc(trip.destination)}</h3><div class="row muted" style="gap: 6px 14px; margin-top: 10px; font-size: 13px; flex-wrap: wrap;"><span class="row" style="gap: 6px;">${icon('pin', 14)}${esc(trip.region ?? 'Anywhere in Malaysia')}</span><span class="row" style="gap: 6px;">${icon('calendar', 14)}${dateRange(trip.start_date, trip.end_date)}</span></div><div class="row faint" style="gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--line); font-size: 12.5px; font-weight: 600;">${trip.places.length} places<span>·</span>${trip.links.length} routes<span>·</span>${days} days</div></div></article>`;
};

export const popularCard = (c, { w = 224 } = {}) => `<article style="width: ${w}px; flex: none; border-radius: 20px; overflow: hidden; background: var(--raised); color: var(--ink); box-shadow: var(--shadow-2);"><div class="cover" style="height: ${Math.round(w * 10 / 16)}px;"><img src="${img(c.image)}" alt=""></div><div style="padding: 14px 16px 12px;"><p class="eyebrow" style="font-size: 10px;">${categoryLabels[c.category]} · ${esc(c.region)}</p><h4 class="trunc" style="font: 650 15px/1.3 var(--body); letter-spacing: 0; margin-top: 6px;">${esc(c.name)}</h4><p class="row muted" style="gap: 5px; font-size: 12px; margin-top: 4px;">${icon('star', 12, 'star')}<b style="color: var(--ink);">${c.rating.toFixed(1)}</b>· ${fmtNum(c.reviewCount)} reviews</p></div><div style="padding: 11px 16px 13px; border-top: 1px solid var(--line);"><span class="row" style="gap: 6px; font: 600 12.5px/1 var(--body); color: var(--primary-ink);">Plan a trip in ${esc(c.region)}${icon('arrow-right', 13)}</span></div></article>`;

export const authorChip = (name) => `<span class="row" style="gap: 8px; font-size: 12.5px; font-weight: 600; color: var(--muted);">${avatar(name, 24)}${esc(name)}</span>`;

/** News card. post: a news seed, or a trip post built with the same fields plus kind: 'trip'. */
export const newsCard = (post, { w = 389, mine = false, interactive = true } = {}) => {
  const isTrip = post.kind === 'trip';
  return `<article class="card" style="width: ${w}px; overflow: hidden; display: flex; flex-direction: column; box-shadow: var(--shadow-1); flex: none;"><div class="cover" style="position: relative; height: ${Math.round(w * 9 / 16)}px;"><img src="${img(post.coverImage)}" alt="">${isTrip ? `<span class="chip chip-navy" style="position: absolute; left: 12px; top: 12px;">${icon('route', 11)}Trip plan</span>` : ''}</div><div style="padding: 18px 20px 18px; display: flex; flex-direction: column; gap: 10px; flex: 1;"><div class="row" style="gap: 8px;"><span class="tag">${newsCategoryLabels[post.category]}</span><span class="row faint" style="gap: 4px; font-size: 12px; font-weight: 600;">${icon('pin', 12)}${esc(post.city)}</span></div><h3 style="font-size: 19px; line-height: 1.25;">${esc(post.title)}</h3><p class="muted clamp3" style="font-size: 13.5px; line-height: 1.55;">${esc(post.excerpt)}</p>${isTrip ? `<div class="row" style="gap: 12px;">${authorChip(post.author)}<span class="btn btn-primary btn-sm">${icon('route', 13)}Open plan</span></div>` : ''}<div class="row" style="margin-top: auto; padding-top: 6px; justify-content: space-between;"><span class="faint" style="font-size: 12px;">${fmtNewsDate(post.publishedAt)}</span><div class="row" style="gap: 2px;">${mine ? `<span class="btn btn-ghost btn-icon btn-sm" aria-label="Edit your story">${icon('pencil', 14)}</span><span class="btn btn-ghost btn-icon btn-sm" aria-label="Delete your story">${icon('trash', 14)}</span>` : ''}${likeBtn(post.baseLikes, { interactive })}</div></div></div></article>`;
};

/** One blob that splits into three pins while the route draws between them (plays once on load). */
export const heroPins = ({ w, h, pts, scale = 1.4 }) => {
  const cx = w / 2; const cy = h / 2;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  let len = 0;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1]; const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
    len += Math.hypot(x1 - x0, y1 - y0) * 1.12;
  }
  const pins = pts.map(([x, y], i) => `<g transform="translate(${(x - 12 * scale).toFixed(1)} ${(y - 21.5 * scale).toFixed(1)}) scale(${scale})"><path class="pin-in" style="--dx: ${((cx - x) / scale).toFixed(1)}px; --dy: ${((cy - y) / scale).toFixed(1)}px; --delay: ${(i * 0.08).toFixed(2)}s;" d="${P.PIN}"></path></g>`).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true" style="display: block; overflow: visible;"><path class="route-draw" d="${d}" style="--len: ${Math.ceil(len)}; fill: none; stroke: var(--primary); stroke-width: 2.5; stroke-linecap: round;"></path>${pins}</svg>`;
};

// ---------- Mobile chrome ----------
export const mobileTop = ({ left = brand(28, true, 17), right = themeToggle() } = {}) => `<header style="display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 16px;">${left}${right}</header>`;
export const tabBar = (active = 'trips') => {
  const items = [['trips', 'briefcase', 'Trips'], ['news', 'newspaper', 'News'], ['collections', 'bookmark', 'Saved'], ['profile', 'user', 'Profile']];
  return `<nav class="tabbar">${items.map(([k, ic, label]) => `<span class="tab${k === active ? ' on' : ''}"><span class="tab-ic">${icon(ic, 20)}</span>${label}</span>`).join('')}</nav>`;
};
export const mobileFab = (label = 'New Trip') => fab(label, 'position: absolute; right: 16px; bottom: 92px; height: 52px;');
