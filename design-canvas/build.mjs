// Writes every artboard (.dc.html), canvas.json and the seed argument list.
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { usedImages } from './lib.mjs';
import * as D from './desktop.mjs';
import * as M from './mobile.mjs';
import * as S from './system.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, 'artboards');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const GAP_X = 120;
const GAP_Y = 220;
const pages = [
  {
    id: 'desktop', name: 'Desktop · 1440',
    rows: [
      { note: '01 · Entry\nLanding with the one-shot pin morph and squiggle, sign in and sign up with visible labels.', boards: [
        ['Landing.dc.html', 'Landing', D.landing, 2060], ['SignIn.dc.html', 'Sign in', D.signIn, 900], ['SignUp.dc.html', 'Sign up', D.signUp, 900]] },
      { note: '02 · Home\nDashboard with popular places, both trip statuses on every card, and the coral New Trip FAB. Collections and Profile share the nav.', boards: [
        ['Dashboard.dc.html', 'Dashboard', D.dashboard, 1340], ['NewTrip.dc.html', 'Dashboard · New Trip', D.dashboardNewTrip, 900], ['Collections.dc.html', 'Collections', D.collectionsScreen, 960], ['Profile.dc.html', 'Profile', D.profileScreen, 1120]] },
      { note: '03 · Trip Board\nThe core screen. Edit mode with a selected card and an open transport menu, view mode with the route summary, dark mode filtered to Day 2, and the two dialogs.', boards: [
        ['Main.dc.html', 'Trip Board · edit', D.boardEdit, 900], ['BoardView.dc.html', 'Trip Board · view + summary', D.boardView, 900], ['BoardDark.dc.html', 'Trip Board · dark · Day 2', D.boardDark, 900], ['PlaceIntel.dc.html', 'Place intel', D.placeIntel, 900], ['EditCard.dc.html', 'Edit card', D.editCard, 900]] },
      { note: '04 · Sharing\nShare as a link or as a News story; the public read-only board and its unavailable state.', boards: [
        ['ShareLink.dc.html', 'Share · link', D.shareLink, 900], ['ShareNews.dc.html', 'Share · news', D.shareNews, 900], ['SharedBoard.dc.html', 'Shared board', D.sharedBoard, 900], ['SharedMissing.dc.html', 'Shared · unavailable', D.sharedUnavailable, 760]] },
      { note: '05 · News\nEditorial stories plus a traveller’s shared trip plan; the article view.', boards: [
        ['News.dc.html', 'News', D.newsScreen, 1960], ['NewsPost.dc.html', 'News post', D.newsPost, 1640]] },
    ],
  },
  {
    id: 'mobile', name: 'Mobile · 390', frameW: 390, gapX: 80,
    rows: [
      { note: '01 · Entry\nFull-width actions, 16 px gutters, no fake status bar.', boards: [
        ['MLanding.dc.html', 'Landing · mobile', M.mLanding, 2080], ['MSignIn.dc.html', 'Sign in · mobile', M.mSignIn, 844], ['MSignUp.dc.html', 'Sign up · error · mobile', M.mSignUp, 844]] },
      { note: '02 · Home\nA bottom tab bar replaces the top segmented nav; your boards come before popular places; forms open as bottom sheets.', boards: [
        ['MDashboard.dc.html', 'Dashboard · mobile', M.mDashboard, 1900], ['MNewTrip.dc.html', 'New Trip sheet · mobile', M.mNewTrip, 844], ['MCollections.dc.html', 'Collections · mobile', M.mCollections, 1080], ['MProfile.dc.html', 'Profile · mobile', M.mProfile, 1320]] },
      { note: '03 · Trip Board\nPanels become bottom sheets over a full-bleed canvas: places while editing, the route summary while viewing.', boards: [
        ['MBoardEdit.dc.html', 'Board edit · mobile', M.mBoardEdit, 844], ['MBoardView.dc.html', 'Board view · mobile', M.mBoardView, 844], ['MPlaceIntel.dc.html', 'Place intel · mobile', M.mPlaceIntel, 844], ['MEditCard.dc.html', 'Edit card · mobile', M.mEditCard, 844], ['MShare.dc.html', 'Share · mobile', M.mShare, 844], ['MShared.dc.html', 'Shared board · mobile', M.mShared, 844]] },
      { note: '04 · News', boards: [
        ['MNews.dc.html', 'News · mobile', M.mNews, 2020], ['MNewsPost.dc.html', 'News post · mobile', M.mNewsPost, 1700]] },
    ],
  },
  {
    id: 'system', name: 'System & motion',
    rows: [
      { note: 'Design system v2\nFoundations, components, states and the live SVG morph sheet (hover and click the stages).', boards: [
        ['Foundations.dc.html', 'Foundations', S.foundations, 2760], ['Components.dc.html', 'Components', S.components, 2860], ['States.dc.html', 'Empty · loading · error', S.states, 1060], ['Motion.dc.html', 'SVG morphs', S.motion, 2280, true]] },
    ],
  },
];

const canvas = { pages: pages.map(({ id, name }) => ({ id, name })), artboards: [], annotations: [], launch: { view: 'canvas', page: 'desktop' } };
const files = [];
for (const page of pages) {
  const frameW = page.frameW ?? 1440;
  const gapX = page.gapX ?? GAP_X;
  let y = 0;
  page.rows.forEach((row, rowIndex) => {
    canvas.annotations.push({ id: `${page.id}-row-${rowIndex + 1}`, x: -440, y, w: 340, text: row.note, page: page.id });
    let x = 0;
    let rowH = 0;
    for (const [file, title, render, h, interactive] of row.boards) {
      writeFileSync(path.join(outDir, file), render());
      files.push(file);
      canvas.artboards.push({ file, title, x, y, w: frameW, h, page: page.id, ...(interactive ? { is_interactive: true } : {}) });
      x += frameW + gapX;
      rowH = Math.max(rowH, h);
    }
    y += rowH + GAP_Y;
  });
}
writeFileSync(path.join(outDir, 'canvas.json'), JSON.stringify(canvas, null, 2));

const rel = (p) => path.relative(path.join(here, '..'), p).split(path.sep).join('/');
const template = 'C:/Users/yueha/AppData/Local/Temp/claude/bundled-skills/2.1.266/67d467a09bf96a912c5314e93daeb7fa/design/payload.template.html';
const args = [
  '--template', template,
  '--out', 'design-canvas/travelplanner-redesign.html',
  '--title', 'TravelPlanner Redesign',
  ...files.flatMap((f) => ['--artboard', rel(path.join(outDir, f))]),
  ...[...usedImages].sort().flatMap((f) => ['--image', f]),
  '--canvas', rel(path.join(outDir, 'canvas.json')),
];
writeFileSync(path.join(here, 'seed-args.txt'), `${args.join('\n')}\n`);
console.log(`wrote ${files.length} artboards, ${usedImages.size} images`);
