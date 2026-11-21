/**
 * Recruiter view: a clean, light, single-page résumé readable in < 60 s.
 * Everything unlocked, no terminal knowledge needed.
 */
import { asset, h, link } from '../core/dom';
import { portfolio as P } from '../data/portfolio';
import type { Job } from '../data/schema';
import { icon, projectIcon } from '../ui/icons';

export function renderRecruiter(): HTMLElement {
  const { links } = P.person;
  const certs = P.certifications.filter((c) => !c.todo);
  const main = P.experience.filter((j) => !j.secondary);
  const other = P.experience.filter((j) => j.secondary);

  return h(
    'main',
    { class: 'rv', id: 'main', tabindex: '-1' },
    h(
      'header',
      { class: 'rv-hero' },
      h(
        'div',
        {},
        h('p', { class: 'rv-kicker' }, `${P.person.level} · ${P.person.location}`),
        h('h1', {}, P.person.name, h('span', { class: 'rv-handle' }, ` (${P.person.handle})`)),
        h('p', { class: 'rv-roles' }, P.person.targetRoles.join(' · ')),
      ),
      h(
        'div',
        { class: 'rv-cta' },
        link(asset(P.person.resume), [icon('download'), 'Download résumé (PDF)'], { class: 'btn primary', download: '' }),
        link(`mailto:${links.email}`, [icon('mail'), 'Email me'], { class: 'btn' }),
        link(links.linkedin, [icon('linkedin'), 'LinkedIn'], { class: 'btn' }),
        link(links.github, [icon('github'), 'GitHub'], { class: 'btn' }),
      ),
    ),
    section(
      'summary',
      'Summary',
      h('p', { class: 'rv-summary' }, P.person.summary),
      h('h3', { class: 'rv-sub' }, 'Focus areas'),
      h('ul', { class: 'rv-interests' }, P.person.interests.map((i) => h('li', {}, i))),
    ),
    section(
      'skills',
      'Skills',
      h(
        'dl',
        { class: 'rv-skills' },
        P.skills.map((s) => h('div', {}, h('dt', {}, s.group), h('dd', {}, h('ul', { class: 'tags' }, s.items.map((i) => h('li', {}, i)))))),
      ),
    ),
    section(
      'projects',
      'Projects',
      h(
        'div',
        { class: 'rv-projects' },
        P.projects.map((p) =>
          h(
            'article',
            { class: 'rv-card' },
            h('div', { class: 'rv-card-head' }, projectIcon(p.icon), h('div', {}, h('h3', {}, p.title), p.role ? h('p', { class: 'muted' }, p.role) : null)),
            h('p', { class: 'rv-problem' }, p.problem),
            h('ul', {}, p.approach.map((a) => h('li', {}, a))),
            h('p', { class: 'rv-k' }, 'Results'),
            h('ul', { class: 'rv-outcomes' }, p.outcomes.map((o) => h('li', {}, o))),
            p.security?.length ? h('p', { class: 'rv-k' }, 'Security angle') : null,
            p.security?.length ? h('ul', {}, p.security.map((x) => h('li', {}, x))) : null,
            h('ul', { class: 'tags small' }, p.tools.map((t) => h('li', {}, t))),
            h(
              'p',
              { class: 'rv-links' },
              p.links.github ? link(p.links.github, 'GitHub ↗') : null,
              p.links.writeup ? link(p.links.writeup, 'Write-up ↗') : null,
              p.links.demo ? link(p.links.demo, 'Demo ↗') : null,
            ),
          ),
        ),
      ),
    ),
    section(
      'experience',
      'Experience',
      h('div', {}, main.map(job)),
      other.length ? h('h3', { class: 'rv-sub' }, 'Other experience') : null,
      h('div', {}, other.map(job)),
    ),
    section(
      'education',
      'Education',
      h(
        'div',
        {},
        P.education.map((e) =>
          h(
            'article',
            { class: 'rv-job' },
            h(
              'div',
              { class: 'rv-job-head' },
              h('h3', {}, [e.degree, e.school].filter(Boolean).join(' · ')),
              h('span', { class: 'muted' }, [[e.start, e.end].filter(Boolean).join(' – '), e.location].filter(Boolean).join(' · ')),
            ),
            h('ul', {}, e.details.map((d) => h('li', {}, d))),
          ),
        ),
      ),
    ),
    certs.length
      ? section(
          'certifications',
          'Certifications',
          h('ul', { class: 'rv-certs' }, certs.map((c) => h('li', {}, h('strong', {}, c.name), ` — ${c.issuer} `, h('span', { class: `pill ${c.status}` }, c.status.replace('-', ' ')), c.date ? ` ${c.date}` : ''))),
        )
      : null,
    section(
      'contact',
      'Contact',
      h(
        'ul',
        { class: 'rv-contact' },
        h('li', {}, icon('mail'), link(`mailto:${links.email}`, links.email)),
        h('li', {}, icon('linkedin'), link(links.linkedin, links.linkedin.replace(/^https?:\/\/(www\.)?/, ''))),
        h('li', {}, icon('github'), link(links.github, links.github.replace(/^https?:\/\//, ''))),
        links.showPhone && links.phone ? h('li', {}, icon('phone'), link(`tel:${links.phone.replace(/\s/g, '')}`, links.phone)) : null,
        h('li', {}, icon('pin'), P.person.location),
      ),
    ),
  );
}

function section(id: string, title: string, ...children: (HTMLElement | null)[]): HTMLElement {
  return h('section', { class: 'rv-sec', id: `rv-${id}`, 'aria-labelledby': `rv-${id}-h` }, h('h2', { id: `rv-${id}-h` }, title), ...children);
}

function job(j: Job): HTMLElement {
  return h(
    'article',
    { class: 'rv-job' },
    h('div', { class: 'rv-job-head' }, h('h3', {}, `${j.title} · ${j.org}`), h('span', { class: 'muted' }, `${j.start} – ${j.end} · ${j.location}`)),
    h('ul', {}, j.bullets.map((b) => h('li', {}, b))),
    j.skills?.length ? h('ul', { class: 'tags small rv-jobtags' }, j.skills.map((t) => h('li', {}, t))) : null,
    j.takeaway ? h('p', { class: 'rv-takeaway' }, j.takeaway) : null,
  );
}
