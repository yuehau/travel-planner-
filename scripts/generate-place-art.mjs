// Generates palette-styled SVG illustrations for catalog places, region covers and news posts.
// Run: node scripts/generate-place-art.mjs   (also `npm run art`). Output is committed.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const catalog = JSON.parse(readFileSync(resolve(root, 'shared/malaysia-catalog.json'), 'utf8'));
const news = JSON.parse(readFileSync(resolve(root, 'shared/news-posts.json'), 'utf8'));

const W = 640;
const H = 400;

const palette = {
  landmark: ['#4f6bd8', '#abc4ff'],
  food: ['#7f9bf2', '#d7e3fc'],
  cafe: ['#abc4ff', '#edf2fb'],
  nature: ['#4f6bd8', '#b6ccfe'],
  beach: ['#abc4ff', '#f5f8fe'],
  culture: ['#1b2559', '#7f9bf2'],
  nightlife: ['#1b2559', '#4f6bd8'],
  shopping: ['#b6ccfe', '#e2eafc'],
};

const inkFor = (category) => (['cafe', 'beach', 'shopping', 'food'].includes(category) ? '#1b2559' : '#f5f8fe');

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const skyline = (ink) => {
  const bars = [
    [40, 250, 46, 110], [96, 200, 38, 160], [144, 230, 60, 130], [214, 150, 34, 210], [258, 150, 34, 210],
    [302, 260, 50, 100], [362, 180, 44, 180], [416, 240, 70, 120], [496, 210, 40, 150], [546, 265, 56, 95],
  ];
  const rects = bars.map(([x, y, w, h]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${ink}" opacity="0.18"/>`).join('');
  return `${rects}<polygon points="231,150 231,96 241,96 241,150" fill="${ink}" opacity="0.28"/><polygon points="275,150 275,96 285,96 285,150" fill="${ink}" opacity="0.28"/>`;
};

const motifs = {
  landmark: (ink) => skyline(ink),
  nightlife: (ink) => `${skyline(ink)}<circle cx="520" cy="96" r="42" fill="${ink}" opacity="0.35"/><circle cx="538" cy="84" r="38" fill="url(#bg)"/>${[[120, 70], [180, 40], [330, 60], [420, 30], [590, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${ink}" opacity="0.6"/>`).join('')}`,
  food: (ink) => `<ellipse cx="320" cy="250" rx="150" ry="34" fill="${ink}" opacity="0.18"/><path d="M170 250 Q320 340 470 250 Z" fill="${ink}" opacity="0.28"/><path d="M285 150 C270 180 300 190 285 215 M320 140 C305 170 335 180 320 205 M355 150 C340 180 370 190 355 215" stroke="${ink}" stroke-width="6" fill="none" opacity="0.35" stroke-linecap="round"/><path d="M470 120 L520 240 M500 120 L540 240" stroke="${ink}" stroke-width="6" opacity="0.3" stroke-linecap="round"/>`,
  cafe: (ink) => `<rect x="250" y="190" width="150" height="110" rx="26" fill="${ink}" opacity="0.28"/><path d="M400 215 h28 a30 30 0 0 1 0 60 h-28" stroke="${ink}" stroke-width="12" fill="none" opacity="0.28"/><rect x="220" y="304" width="210" height="14" rx="7" fill="${ink}" opacity="0.2"/><path d="M290 110 C275 140 305 150 290 180 M325 100 C310 130 340 140 325 170 M360 110 C345 140 375 150 360 180" stroke="${ink}" stroke-width="7" fill="none" opacity="0.35" stroke-linecap="round"/>`,
  nature: (ink) => `<circle cx="500" cy="120" r="46" fill="${ink}" opacity="0.28"/><polygon points="0,330 150,150 300,330" fill="${ink}" opacity="0.18"/><polygon points="180,330 340,110 500,330" fill="${ink}" opacity="0.26"/><polygon points="380,330 520,190 660,330" fill="${ink}" opacity="0.18"/><rect x="0" y="330" width="640" height="70" fill="${ink}" opacity="0.14"/>`,
  beach: (ink) => `<circle cx="480" cy="130" r="52" fill="${ink}" opacity="0.22"/><path d="M0 250 Q80 220 160 250 T320 250 T480 250 T640 250 V400 H0 Z" fill="${ink}" opacity="0.12"/><path d="M0 290 Q80 260 160 290 T320 290 T480 290 T640 290" stroke="${ink}" stroke-width="6" fill="none" opacity="0.28"/><path d="M0 330 Q80 300 160 330 T320 330 T480 330 T640 330" stroke="${ink}" stroke-width="6" fill="none" opacity="0.2"/>`,
  culture: (ink) => `<path d="M120 190 Q320 100 520 190 L480 190 Q320 150 160 190 Z" fill="${ink}" opacity="0.3"/><path d="M150 236 Q320 170 490 236 L455 236 Q320 200 185 236 Z" fill="${ink}" opacity="0.24"/><rect x="200" y="236" width="18" height="90" fill="${ink}" opacity="0.28"/><rect x="311" y="236" width="18" height="90" fill="${ink}" opacity="0.28"/><rect x="422" y="236" width="18" height="90" fill="${ink}" opacity="0.28"/><rect x="170" y="326" width="300" height="14" rx="7" fill="${ink}" opacity="0.22"/>`,
  shopping: (ink) => `<path d="M60 60 H580" stroke="${ink}" stroke-width="5" opacity="0.3"/>${[110, 230, 350, 470].map((x, index) => `<path d="M${x + 30} 60 V${100 + index * 8}" stroke="${ink}" stroke-width="4" opacity="0.3"/><rect x="${x}" y="${100 + index * 8}" width="60" height="120" rx="30" fill="${ink}" opacity="0.28"/><rect x="${x + 22}" y="${222 + index * 8}" width="16" height="26" rx="4" fill="${ink}" opacity="0.28"/>`).join('')}`,
};

const dots = (ink) => `<pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="${ink}" opacity="0.16"/></pattern>`;

const card = ({ category, title, subtitle, badge }) => {
  const [from, to] = palette[category] ?? palette.landmark;
  const ink = inkFor(category);
  const titleSize = title.length > 30 ? 22 : title.length > 22 ? 26 : 30;
  const panelInk = ink === '#f5f8fe' ? '#0e1430' : '#ffffff';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeXml(title)}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>${dots(ink)}</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>
${(motifs[category] ?? motifs.landmark)(ink)}
<rect x="0" y="${H - 96}" width="${W}" height="96" fill="${panelInk}" opacity="${ink === '#f5f8fe' ? 0.42 : 0.55}"/>
<text x="32" y="${H - 52}" font-family="Inter, system-ui, sans-serif" font-size="${titleSize}" font-weight="700" fill="${ink}">${escapeXml(title)}</text>
<text x="32" y="${H - 24}" font-family="Inter, system-ui, sans-serif" font-size="15" font-weight="500" letter-spacing="1.5" fill="${ink}" opacity="0.85">${escapeXml(subtitle.toUpperCase())}</text>
${badge ? `<rect x="${W - 150}" y="26" width="118" height="30" rx="15" fill="${ink}" opacity="0.2"/><text x="${W - 91}" y="46" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1.2" fill="${ink}">${escapeXml(badge.toUpperCase())}</text>` : ''}
</svg>
`;
};

const write = (relativePath, content) => {
  const target = resolve(root, 'public', relativePath);
  mkdirSync(resolve(target, '..'), { recursive: true });
  writeFileSync(target, content);
};

let count = 0;

for (const place of catalog) {
  write(place.image.replace(/^\//, ''), card({ category: place.category, title: place.name, subtitle: place.city, badge: place.category }));
  count += 1;
}

const regionCategory = {
  'Kuala Lumpur': 'landmark',
  Selangor: 'culture',
  Penang: 'culture',
  Langkawi: 'beach',
  Malacca: 'shopping',
  'Cameron Highlands': 'nature',
  Ipoh: 'cafe',
  Johor: 'landmark',
  Pahang: 'beach',
  Terengganu: 'beach',
  Kelantan: 'food',
  Sarawak: 'nature',
  Sabah: 'nature',
};

for (const region of [...new Set(catalog.map((place) => place.region))]) {
  write(`regions/${slugify(region)}.svg`, card({ category: regionCategory[region] ?? 'landmark', title: region, subtitle: 'Malaysia' }));
  count += 1;
}

const newsCategory = { cafe: 'cafe', restaurant: 'food', attraction: 'beach', event: 'shopping' };

for (const post of news) {
  write(post.coverImage.replace(/^\//, ''), card({ category: newsCategory[post.category] ?? 'landmark', title: post.city, subtitle: post.category, badge: 'news' }));
  count += 1;
}

console.log(`Wrote ${count} illustrations to public/{places,regions,news}.`);
