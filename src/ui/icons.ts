/** Minimal hand-drawn stroke icons (24×24). No icon font, no external requests. */
import { svg } from '../core/dom';

const PATHS: Record<string, string[]> = {
  phone: ['M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M11 18h2'],
  shield: ['M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z', 'M8.5 12l2.5 2.5 4.5-5'],
  wave: ['M2 12h2', 'M6 8v8', 'M10 4v16', 'M14 7v10', 'M18 10v4', 'M22 12h-2'],
  brain: [
    'M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 4 2 2 0 0 0 2-1V4a2 2 0 0 0-2-1z',
    'M15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 4 2 2 0 0 1-2-1V4a2 2 0 0 1 2-1z',
  ],
  code: ['M8 6l-6 6 6 6', 'M16 6l6 6-6 6', 'M14 4l-4 16'],
  github: [
    'M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
  ],
  linkedin: ['M4 9h4v11H4z', 'M6 4.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z', 'M11 9h4v1.8c.6-1 1.8-2 3.6-2 3 0 3.4 2 3.4 4.6V20h-4v-5.5c0-1.3 0-2.7-1.7-2.7s-1.9 1.3-1.9 2.6V20h-3.4z'],
  mail: ['M3 5h18v14H3z', 'M3 6l9 7 9-7'],
  lock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 8 0v4'],
  unlock: ['M5 11h14v10H5z', 'M8 11V7a4 4 0 0 1 7.5-2'],
  home: ['M3 11l9-8 9 8', 'M5 10v10h14V10'],
  briefcase: ['M3 7h18v13H3z', 'M8 7V4h8v3', 'M3 13h18'],
  file: ['M6 2h9l5 5v15H6z', 'M14 2v6h6', 'M9 13h6', 'M9 17h6'],
  download: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 20h16'],
  terminal: ['M4 17l6-5-6-5', 'M12 19h8'],
  cap: ['M2 9l10-5 10 5-10 5z', 'M6 11v5c3 2 9 2 12 0v-5'],
  pin: ['M12 22s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  target: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z', 'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z'],
  folder: ['M3 6h6l2 2h10v11H3z'],
  user: ['M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z', 'M4 21c1-4 4-6 8-6s7 2 8 6'],
  python: ['M12 3c-4 0-4 1.5-4 3v2h4v1H6c-2 0-3 1.5-3 4s1 4 3 4h2v-3c0-1.5 1-2.5 2.5-2.5h4c1.5 0 2.5-1 2.5-2.5V6c0-1.5-1-3-5-3z', 'M12 21c4 0 4-1.5 4-3v-2h-4v-1h6c2 0 3-1.5 3-4'],
  cpu: ['M7 7h10v10H7z', 'M10 10h4v4h-4z', 'M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4'],
  network: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', 'M2 12h20', 'M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20'],
  monitor: ['M3 4h18v12H3z', 'M8 20h8', 'M12 16v4'],
};

export function icon(name: keyof typeof PATHS | string, cls = 'ico'): SVGElement {
  return svg(
    'svg',
    { viewBox: '0 0 24 24', class: cls, 'aria-hidden': 'true', focusable: 'false' },
    ...(PATHS[name] ?? PATHS.code).map((d) => svg('path', { d })),
  );
}

export function projectIcon(name: string): SVGElement {
  return icon(name, 'ico proj-ico');
}
