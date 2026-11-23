/**
 * Recruiter view: a light, single-page résumé that is still readable in < 60 s,
 * with tasteful motion: scroll reveals, count-up stats, a rotating tagline,
 * an animated timeline, tilt-on-hover project cards and scroll-spy navigation.
 * Every animation is disabled under prefers-reduced-motion.
 */
import { asset, h, link, reducedMotion } from '../core/dom';
import { portfolio as P } from '../data/portfolio';
import type { Education, Job, Project } from '../data/schema';
import { icon, projectIcon } from '../ui/icons';

const rvPhoto = (): string => P.person.recruiterPhoto || P.person.photo;

const SKILL_ICONS: Record<string, string> = {
  Security: 'shield',
  Languages: 'code',
  'Frameworks & Tools': 'terminal',
  'AI & Embedded': 'cpu',
};

export function renderRecruiter(): HTMLElement {
  const certs = P.certifications.filter((c) => !c.todo);
  const mainJobs = P.experience.filter((j) => !j.secondary);
  const otherJobs = P.experience.filter((j) => j.secondary);

  const root = h(
    'main',
    { class: 'rv', id: 'main', tabindex: '-1' },
    h('div', { class: 'rv-progress', 'aria-hidden': 'true' }, h('span', { class: 'rv-progress-bar' })),
    h('div', { class: 'rv-bg', 'aria-hidden': 'true' }, h('span', { class: 'blob b1' }), h('span', { class: 'blob b2' }), h('span', { class: 'blob b3' })),
    hero(),
    section(
      'summary',
      'About me',
      h(
        'div',
        { class: 'rv-about reveal' },
        h('p', { class: 'rv-summary' }, P.person.summary),
        h(
          'ul',
          { class: 'rv-focus' },
          P.person.interests.map((i, n) => h('li', { class: 'reveal', 'data-delay': String(n) }, h('span', { class: 'rv-focus-ico' }, icon(['monitor', 'target', 'shield', 'phone'][n % 4])), i)),
        ),
      ),
    ),
    section(
      'skills',
      'Skills',
      h(
        'div',
        { class: 'rv-skillgrid' },
        P.skills.map((g, n) =>
          h(
            'article',
            { class: 'rv-skillcard reveal', 'data-delay': String(n) },
            h('h3', {}, h('span', { class: 'rv-chip-ico' }, icon(SKILL_ICONS[g.group] ?? 'code')), g.group),
            h('ul', { class: 'tags' }, g.items.map((i) => h('li', {}, i))),
          ),
        ),
      ),
    ),
    section('projects', 'Projects', h('div', { class: 'rv-projects' }, P.projects.map(projectCard))),
    section(
      'experience',
      'Experience',
      h('ol', { class: 'rv-timeline' }, mainJobs.map(jobItem)),
      otherJobs.length ? h('h3', { class: 'rv-sub reveal' }, 'Other experience') : null,
      otherJobs.length ? h('ol', { class: 'rv-timeline' }, otherJobs.map(jobItem)) : null,
    ),
    section('education', 'Education', h('div', { class: 'rv-edu' }, P.education.map(eduCard))),
    certs.length
      ? section(
          'certifications',
          'Certifications',
          h('ul', { class: 'rv-certs' }, certs.map((c) => h('li', { class: 'reveal' }, h('strong', {}, c.name), ` — ${c.issuer} `, h('span', { class: `pill ${c.status}` }, c.status.replace('-', ' ')), c.date ? ` ${c.date}` : ''))),
        )
      : null,
    contact(),
  );

  enhance(root);
  return root;
}

/* ------------------------------------------------------------------ */

function hero(): HTMLElement {
  const { links } = P.person;
  const tagline = h('span', { class: 'rv-typed' }, P.person.taglines?.[0] ?? '');
  const stats = P.person.stats ?? [];
  return h(
    'header',
    { class: 'rv-hero' },
    h(
      'div',
      { class: 'rv-hero-text' },
      h('p', { class: 'rv-pill reveal' }, h('span', { class: 'rv-dot', 'aria-hidden': 'true' }), icon('pin'), P.person.location),
      h('h1', { class: 'reveal', 'data-delay': '1' }, h('span', { class: 'rv-grad' }, P.person.name), h('span', { class: 'rv-handle' }, ` ${P.person.handle}`)),
      h(
        'p',
        { class: 'rv-roles reveal', 'data-delay': '2' },
        h('span', { class: 'sr-only' }, P.person.taglines?.join('. ') ?? ''),
        h('span', { 'aria-hidden': 'true' }, h('span', { class: 'rv-prompt' }, '> '), tagline, h('span', { class: 'rv-caret' }, '▌')),
      ),
      h(
        'div',
        { class: 'rv-cta reveal', 'data-delay': '3' },
        link(asset(P.person.resume), [icon('download'), 'Download résumé (PDF)'], { class: 'btn primary shine', download: '' }),
        link(`mailto:${links.email}`, [icon('mail'), 'Email me'], { class: 'btn' }),
        link(links.linkedin, [icon('linkedin'), 'LinkedIn'], { class: 'btn' }),
        link(links.github, [icon('github'), 'GitHub'], { class: 'btn' }),
      ),
      stats.length
        ? h(
            'dl',
            { class: 'rv-stats' },
            stats.map((s, n) =>
              h(
                'div',
                { class: 'rv-stat reveal', 'data-delay': String(n + 3) },
                h('dt', {}, s.label),
                h(
                  'dd',
                  {},
                  h('span', { class: 'count', 'data-to': String(s.value), 'data-dec': String(s.decimals ?? 0) }, reducedMotion() ? s.value.toFixed(s.decimals ?? 0) : '0'),
                  s.suffix ?? '',
                ),
              ),
            ),
          )
        : null,
    ),
    (P.person.recruiterPhoto || P.person.photo)
      ? h(
          'div',
          { class: 'rv-photo reveal', 'data-delay': '2' },
          h('span', { class: 'rv-ring', 'aria-hidden': 'true' }),
          h('img', {
            src: asset(rvPhoto()),
            // Smaller copy for the 380px circle; full size only for high-DPI screens
            srcset: `${asset(rvPhoto().replace(/(\.\w+)$/, '-sm$1'))} 520w, ${asset(rvPhoto())} 840w`,
            sizes: '(max-width: 900px) 260px, 380px',
            alt: `Portrait of ${P.person.name}`,
            width: '840',
            height: '840',
            decoding: 'async',
            fetchpriority: 'high',
          }),
          h('span', { class: 'rv-float f1', 'aria-hidden': 'true' }, 'AES-256-GCM'),
          h('span', { class: 'rv-float f2', 'aria-hidden': 'true' }, 'Ed25519'),
          h('span', { class: 'rv-float f3', 'aria-hidden': 'true' }, 'OWASP'),
        )
      : null,
  );
}

function projectCard(p: Project, n: number): HTMLElement {
  const more: [string, string[] | undefined][] = [
    ['Challenges & how I solved them', p.challenges],
    ['What I learned', p.learned],
  ];
  return h(
    'article',
    { class: 'rv-card tilt reveal', 'data-delay': String(n % 2) },
    h('span', { class: 'rv-card-glow', 'aria-hidden': 'true' }),
    h(
      'div',
      { class: 'rv-card-head' },
      h('span', { class: 'rv-card-ico' }, projectIcon(p.icon)),
      h('div', {}, h('h3', {}, p.title), p.role ? h('p', { class: 'muted' }, p.role) : h('p', { class: 'muted' }, p.kind)),
    ),
    h('p', { class: 'rv-problem' }, p.problem),
    h('h4', { class: 'rv-k' }, 'What I built'),
    h('ul', { class: 'rv-built' }, p.approach.map((a) => h('li', {}, a))),
    h('h4', { class: 'rv-k' }, 'Results'),
    h('ul', { class: 'rv-results' }, p.outcomes.map((o) => h('li', {}, o))),
    p.security?.length ? h('h4', { class: 'rv-k' }, 'Security angle') : null,
    p.security?.length ? h('ul', { class: 'rv-built rv-sec-list' }, p.security.map((x) => h('li', {}, x))) : null,
    h('h4', { class: 'rv-k' }, 'Tools'),
    h('ul', { class: 'tags small' }, p.tools.map((t) => h('li', {}, t))),
    h(
      'details',
      { class: 'rv-more' },
      h('summary', {}, h('span', { class: 'rv-more-label' }, 'Challenges & lessons learned'), h('span', { class: 'rv-more-chev', 'aria-hidden': 'true' }, '▾')),
      h(
        'div',
        { class: 'rv-more-body' },
        more.filter(([, items]) => items?.length).flatMap(([title, items]) => [h('h4', {}, title), h('ul', {}, items!.map((i) => h('li', {}, i)))]),
      ),
    ),
    h(
      'p',
      { class: 'rv-links' },
      p.links.github ? link(p.links.github, [icon('github'), 'GitHub ↗']) : null,
      p.links.writeup ? link(p.links.writeup, 'Write-up ↗') : null,
      p.links.demo ? link(p.links.demo, 'Demo ↗') : null,
    ),
  );
}

function jobItem(j: Job): HTMLElement {
  return h(
    'li',
    { class: 'rv-tl-item reveal' },
    h('span', { class: 'rv-tl-dot', 'aria-hidden': 'true' }),
    h(
      'article',
      { class: 'rv-tl-card' },
      h('div', { class: 'rv-job-head' }, h('h3', {}, j.title, h('span', { class: 'rv-org' }, ` · ${j.org}`)), h('span', { class: 'rv-date' }, `${j.start} – ${j.end}`)),
      h('p', { class: 'rv-loc' }, j.type ? h('span', { class: 'rv-type' }, j.type) : null, h('span', { class: 'muted' }, j.location)),
      h('h4', { class: 'rv-k' }, 'What I did'),
      h('ul', {}, j.bullets.map((b) => h('li', {}, b))),
      j.skills?.length ? h('h4', { class: 'rv-k' }, 'Skills used') : null,
      j.skills?.length ? h('ul', { class: 'tags small rv-jobtags' }, j.skills.map((t) => h('li', {}, t))) : null,
      j.takeaway ? h('p', { class: 'rv-takeaway' }, h('strong', {}, 'Why it matters for security: '), j.takeaway) : null,
    ),
  );
}

function eduCard(e: Education, n: number): HTMLElement {
  return h(
    'article',
    { class: 'rv-educard reveal', 'data-delay': String(n) },
    h('span', { class: 'rv-card-ico' }, icon('cap')),
    h(
      'div',
      {},
      h('h3', {}, e.degree),
      h('p', { class: 'rv-edu-school' }, [e.school, e.location].filter(Boolean).join(' · ')),
      h('p', { class: 'rv-date' }, [e.start, e.end].filter(Boolean).join(' – ')),
      h('ul', {}, e.details.map((d) => h('li', {}, d))),
    ),
  );
}

function contact(): HTMLElement {
  const { links } = P.person;
  const copy = h('button', { type: 'button', class: 'btn' }, icon('file'), 'Copy email');
  const status = h('span', { class: 'rv-copied', role: 'status' });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(links.email);
      status.textContent = 'Copied ✓';
    } catch {
      status.textContent = links.email;
    }
    window.setTimeout(() => (status.textContent = ''), 2500);
  });
  return h(
    'section',
    { class: 'rv-sec', id: 'rv-contact', 'aria-labelledby': 'rv-contact-h' },
    h(
      'div',
      { class: 'rv-contact-card reveal' },
      h('h2', { id: 'rv-contact-h' }, "Let's talk"),
      h('p', {}, `I'm based in ${P.person.location}. The fastest way to reach me is email.`),
      h(
        'div',
        { class: 'rv-cta' },
        link(`mailto:${links.email}`, [icon('mail'), links.email], { class: 'btn primary' }),
        copy,
        link(links.linkedin, [icon('linkedin'), 'LinkedIn'], { class: 'btn' }),
        link(links.github, [icon('github'), 'GitHub'], { class: 'btn' }),
        status,
      ),
    ),
  );
}

function section(id: string, title: string, ...children: (HTMLElement | null)[]): HTMLElement {
  return h(
    'section',
    { class: 'rv-sec', id: `rv-${id}`, 'aria-labelledby': `rv-${id}-h` },
    h('h2', { id: `rv-${id}-h`, class: 'reveal' }, title),
    ...children,
  );
}

/* --------------------------- motion layer --------------------------- */

function enhance(root: HTMLElement): void {
  const still = reducedMotion();
  root.classList.toggle('motion', !still);

  // Scroll reveal (+ count-up stats when they appear)
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.style.setProperty('--d', `${Number(el.dataset.delay ?? 0) * 90}ms`);
        el.classList.add('in');
        el.querySelectorAll<HTMLElement>('.count').forEach(countUp);
        io.unobserve(el);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
  );
  root.querySelectorAll('.reveal').forEach((el) => (still ? el.classList.add('in') : io.observe(el)));

  // Timeline line "draws" as it scrolls into view
  root.querySelectorAll<HTMLElement>('.rv-timeline').forEach((tl) => (still ? tl.classList.add('in') : io.observe(tl)));

  // Rotating tagline (typed)
  const typed = root.querySelector<HTMLElement>('.rv-typed');
  const lines = P.person.taglines ?? [];
  if (typed && lines.length > 1 && !still) void typeLoop(typed, lines);

  // Tilt on hover for project cards (pointer devices only)
  if (!still && matchMedia('(hover: hover)').matches) {
    root.querySelectorAll<HTMLElement>('.tilt').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
        card.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
        card.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // Scroll progress + scroll-spy for the top-bar links (wired once the page is attached)
  requestAnimationFrame(() => {
    const bar = root.querySelector<HTMLElement>('.rv-progress-bar');
    const onScroll = () => {
      if (!root.isConnected) return window.removeEventListener('scroll', onScroll);
      const max = document.documentElement.scrollHeight - innerHeight;
      bar?.style.setProperty('transform', `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const navLinks = [...document.querySelectorAll<HTMLAnchorElement>('.topbar .nav-link')];
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === `#${e.target.id}`));
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    root.querySelectorAll('.rv-sec').forEach((s) => spy.observe(s));
  });
}

function countUp(el: HTMLElement): void {
  const to = Number(el.dataset.to);
  const dec = Number(el.dataset.dec ?? 0);
  const start = performance.now();
  const dur = 1400;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (to * eased).toFixed(dec);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

async function typeLoop(el: HTMLElement, lines: string[]): Promise<void> {
  const sleep = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
  let i = 0;
  while (el.isConnected) {
    await sleep(2600);
    if (document.hidden) continue;
    for (let n = lines[i].length; n >= 0 && el.isConnected; n--) {
      el.textContent = lines[i].slice(0, n);
      await sleep(18);
    }
    i = (i + 1) % lines.length;
    for (let n = 1; n <= lines[i].length && el.isConnected; n++) {
      el.textContent = lines[i].slice(0, n);
      await sleep(38);
    }
  }
}
