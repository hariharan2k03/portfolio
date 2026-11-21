/**
 * Dot-matrix world map drawn from a tiny run-length mask (no image, ~1 KB).
 * 64 columns × 24 rows, equirectangular, 84°N → 60°S.
 * Pings are placed on random land dots — purely decorative and SIMULATED.
 */
import { svg } from '../core/dom';
import type { Alert } from '../core/state';
import { reducedMotion } from '../core/dom';

// [startCol, endCol] land runs per row
const MASK: [number, number][][] = [
  [[13, 19], [22, 28]],
  [[10, 20], [21, 28], [35, 36], [45, 58]],
  [[3, 21], [22, 27], [33, 36], [37, 63]],
  [[2, 10], [11, 17], [20, 24], [28, 28], [32, 63]],
  [[7, 17], [20, 25], [30, 31], [32, 60]],
  [[8, 24], [30, 58]],
  [[9, 23], [31, 55], [57, 57]],
  [[10, 22], [30, 33], [34, 55], [56, 57]],
  [[10, 21], [30, 55]],
  [[11, 19], [29, 43], [44, 54]],
  [[12, 16], [18, 19], [29, 43], [45, 47], [49, 52]],
  [[14, 17], [28, 39], [46, 46], [49, 51], [53, 53]],
  [[16, 22], [29, 38], [49, 50]],
  [[18, 24], [32, 39], [50, 56]],
  [[17, 26], [33, 39], [50, 58]],
  [[18, 26], [33, 39], [53, 57], [57, 59]],
  [[19, 26], [34, 38], [39, 40], [51, 59]],
  [[20, 25], [34, 38], [39, 40], [51, 59]],
  [[20, 24], [34, 37], [51, 59]],
  [[20, 23], [34, 36], [52, 58]],
  [[20, 22], [55, 58], [62, 62]],
  [[20, 21], [57, 57], [61, 62]],
  [[20, 21]],
  [],
];

const STEP = 6;
const TARGET = { col: 57, row: 20 }; // Melbourne — the "server"

const land: [number, number][] = [];
MASK.forEach((runs, row) => runs.forEach(([a, b]) => { for (let c = a; c <= b; c++) land.push([c, row]); }));

export function worldMap(): SVGSVGElement {
  const root = svg('svg', {
    viewBox: `0 0 ${64 * STEP} ${24 * STEP}`,
    class: 'worldmap',
    role: 'img',
    'aria-label': 'Decorative world map with simulated alert pings. Target server: Melbourne.',
  }) as SVGSVGElement;
  const dots = svg('g', { class: 'land' });
  for (const [c, r] of land) dots.append(svg('circle', { cx: c * STEP + 3, cy: r * STEP + 3, r: 1.3 }));
  root.append(dots, svg('g', { class: 'arcs' }), svg('g', { class: 'pings' }));
  const tx = TARGET.col * STEP + 3;
  const ty = TARGET.row * STEP + 3;
  root.append(
    svg('circle', { cx: tx, cy: ty, r: 7, class: 'target-ring' }),
    svg('circle', { cx: tx, cy: ty, r: 3, class: 'target' }),
  );
  return root;
}

export function pingAt(map: SVGSVGElement, a: Alert): void {
  // Deterministic pseudo-random land dot per alert id (never real geo)
  const [c, r] = land[(a.id * 2654435761) % land.length];
  const x = c * STEP + 3;
  const y = r * STEP + 3;
  const tx = TARGET.col * STEP + 3;
  const ty = TARGET.row * STEP + 3;
  const pings = map.querySelector('.pings')!;
  const arcs = map.querySelector('.arcs')!;
  const cls = `sev-${a.severity}`;
  const mx = (x + tx) / 2;
  const my = Math.min(y, ty) - 30;
  const arc = svg('path', { d: `M${x},${y} Q${mx},${my} ${tx},${ty}`, class: `arc ${cls}` });
  const dot = svg('circle', { cx: x, cy: y, r: 3, class: `ping ${cls}` });
  arcs.append(arc);
  pings.append(dot);
  while (pings.children.length > 14) pings.firstElementChild?.remove();
  while (arcs.children.length > 6) arcs.firstElementChild?.remove();
  if (!reducedMotion()) window.setTimeout(() => arc.classList.add('fade'), 2500);
}
