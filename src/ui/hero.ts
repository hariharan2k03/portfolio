/** Header, hero and footer for hacker mode. Projects live in the terminal (and recruiter view). */
import { asset, h, link, svg } from '../core/dom';
import { bus } from '../core/state';
import { portfolio as P } from '../data/portfolio';
import { icon } from './icons';

export function topBar(onRecruiter: () => void, mode: 'hacker' | 'recruiter'): HTMLElement {
  const btn = h(
    'button',
    { type: 'button', class: 'btn recruiter-btn', id: 'mode-btn' },
    icon(mode === 'hacker' ? 'briefcase' : 'terminal'),
    h('span', {}, mode === 'hacker' ? 'Recruiter view' : 'Hacker mode'),
    h('span', { 'aria-hidden': 'true' }, ' →'),
  );
  btn.addEventListener('click', onRecruiter);
  const nav =
    mode === 'hacker'
      ? h(
          'nav',
          { class: 'nav', 'aria-label': 'Sections' },
          navLink('#top', 'home', 'Home'),
          projectsLink(),
          navLink('#skills', 'shield', 'Skills'),
          navLink('#about', 'user', 'About'),
          navLink('#contact', 'mail', 'Contact'),
        )
      : h(
          'nav',
          { class: 'nav', 'aria-label': 'Sections' },
          navLink('#rv-projects', 'code', 'Projects'),
          navLink('#rv-skills', 'shield', 'Skills'),
          navLink('#rv-experience', 'briefcase', 'Experience'),
          navLink('#rv-education', 'cap', 'Education'),
          navLink('#rv-contact', 'mail', 'Contact'),
        );
  return h(
    'header',
    { class: 'topbar' },
    h(
      'a',
      { class: 'brand', href: '#top', 'aria-label': `Breach Me — ${P.person.handle} home` },
      h('span', { class: 'brand-logo', 'aria-hidden': 'true' }, icon('shield')),
      h('span', { class: 'brand-text' }, h('strong', {}, 'Breach Me'), h('small', {}, 'Cybersecurity Portfolio')),
    ),
    nav,
    btn,
  );
}

function projectsLink(): HTMLAnchorElement {
  const a = navLink('#ops', 'code', 'Projects');
  a.addEventListener('click', (e) => {
    e.preventDefault();
    bus.emit('runCommand', 'enum 443');
  });
  return a;
}

function navLink(href: string, ico: string, text: string): HTMLAnchorElement {
  return h('a', { href, class: 'nav-link' }, icon(ico), text);
}

export function hero(onStart: () => void): HTMLElement {
  const start = h('button', { type: 'button', class: 'btn primary glow' }, h('span', { class: 'mono' }, '>_'), 'Start the terminal', h('span', { 'aria-hidden': 'true' }, '→'));
  start.addEventListener('click', onStart);
  return h(
    'section',
    { class: 'hero', id: 'top', 'aria-labelledby': 'hero-title' },
    skyline(),
    h(
      'div',
      { class: 'hero-copy' },
      h('p', { class: 'hero-prompt mono', 'aria-hidden': 'true' }, h('span', { class: 'p-user' }, `${P.person.handle}@breachme`), ':~$ ', h('span', { class: 'blink' }, '▌')),
      h('h1', { id: 'hero-title' }, 'Breach ', h('span', { class: 'accent' }, 'Me'), h('span', { class: 'cursor', 'aria-hidden': 'true' }, '_')),
      h('p', { class: 'hero-verbs' }, 'Explore • Hack • Inspect • Hire'),
      h('p', { class: 'hero-lede' }, P.person.tagline),
      h(
        'div',
        { class: 'hero-cta' },
        start,
        link(asset(P.person.resume), [icon('file'), 'View résumé', icon('download')], { class: 'btn ghost', download: '' }),
      ),
    ),
    portrait(),
    profileCard(),
  );
}

function portrait(): HTMLElement {
  if (P.person.photo) {
    // Full-bleed portrait that fades into the page, like the mockup
    return h(
      'div',
      { class: 'portrait has-photo' },
      h('img', {
        src: asset(P.person.photo),
        alt: `Portrait of ${P.person.name}`,
        width: '900',
        height: '869',
        decoding: 'async',
        fetchpriority: 'high',
      }),
    );
  }
  return h(
    'div',
    { class: 'portrait' },
    h('div', { class: 'ring r1', 'aria-hidden': 'true' }),
    h('div', { class: 'ring r2', 'aria-hidden': 'true' }),
    h('div', { class: 'ring r3', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'portrait-img' },
      h('div', { class: 'avatar-ph', role: 'img', 'aria-label': `${P.person.name} — avatar placeholder` }, icon('shield', 'ico avatar-ico'), h('span', { class: 'mono' }, P.person.handle)),
    ),
  );
}

function profileCard(): HTMLElement {
  return h(
    'aside',
    { class: 'profile-card', id: 'about', 'aria-label': 'About' },
    h('p', { class: 'pc-name' }, P.person.name, h('br'), h('span', { class: 'pc-handle' }, P.person.handle)),
    h(
      'ul',
      {},
      h('li', {}, icon('cap'), P.person.level),
      h('li', {}, icon('pin'), P.person.location),
      h('li', {}, icon('target'), h('span', {}, h('span', { class: 'pc-k' }, 'Target roles'), h('br'), P.person.targetRoles.slice(0, 2).join(' · '))),
    ),
  );
}

/** Procedural night skyline (Melbourne-ish, with a spire). */
function skyline(): SVGElement {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const W = 900;
  const base = 230;
  const g = svg('g', { class: 'bldgs' });
  let x = 0;
  while (x < W) {
    const w = 18 + Math.floor(rand() * 30);
    const center = 1 - Math.abs(x - W * 0.55) / (W * 0.6);
    const hgt = 40 + rand() * 90 + center * 110;
    g.append(svg('rect', { x, y: base - hgt, width: w - 3, height: hgt, class: 'b' }));
    // windows
    for (let wy = base - hgt + 6; wy < base - 6; wy += 9)
      for (let wx = x + 3; wx < x + w - 6; wx += 6) if (rand() > 0.84) g.append(svg('rect', { x: wx, y: wy, width: 2, height: 3, class: rand() > 0.85 ? 'w warm' : 'w' }));
    x += w;
  }
  // Tall spire tower
  g.append(svg('rect', { x: 560, y: base - 255, width: 26, height: 255, class: 'b tall' }));
  g.append(svg('path', { d: `M570 ${base - 255} L573 ${base - 300} L576 ${base - 255}z`, class: 'b tall' }));
  return svg(
    'svg',
    { class: 'skyline', viewBox: `0 0 ${W} 320`, preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' },
    g,
    svg('rect', { x: 0, y: base, width: W, height: 90, class: 'water' }),
  );
}

export function footer(): HTMLElement {
  const skills: [string, string][] = [
    ['python', 'Python'],
    ['terminal', 'Linux'],
    ['network', 'Networking'],
    ['shield', 'Security tools'],
    ['brain', 'Machine learning'],
    ['cpu', 'Embedded'],
  ];
  const { links } = P.person;
  return h(
    'footer',
    { class: 'foot', id: 'contact' },
    h(
      'div',
      { class: 'foot-skills', id: 'skills' },
      h('h2', { class: 'foot-k' }, 'Skills & technologies:'),
      h('ul', {}, skills.map(([i, t]) => h('li', {}, icon(i), t))),
    ),
    h('p', { class: 'foot-tag' }, "Let's build a safer digital world together."),
    h(
      'ul',
      { class: 'socials' },
      h('li', {}, link(links.github, icon('github'), { 'aria-label': 'GitHub', class: 'soc-btn' })),
      h('li', {}, link(links.linkedin, icon('linkedin'), { 'aria-label': 'LinkedIn', class: 'soc-btn' })),
      h('li', {}, link(`mailto:${links.email}`, icon('mail'), { 'aria-label': `Email ${links.email}`, class: 'soc-btn' })),
    ),
  );
}
