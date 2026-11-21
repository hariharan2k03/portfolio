/**
 * Virtual filesystem generated from portfolio data.
 * Files unlock as the visitor compromises services.
 */
import { portfolio } from '../data/portfolio';
import { session } from '../core/state';
import type { Project } from '../data/schema';

export interface VFile {
  path: string; // relative to ~, e.g. "projects/myorbit.md"
  hidden?: boolean;
  unlocked: () => boolean;
  lockedHint: string;
  read: () => string[];
}

const p = portfolio;

export function projectMarkdown(pr: Project): string[] {
  const out = [`# ${pr.title}`];
  if (pr.role) out.push(`_${pr.role}_`);
  out.push('', '## Problem', pr.problem, '', '## Approach', ...pr.approach.map((a) => `- ${a}`));
  out.push('', '## Tools', pr.tools.join(' · '), '', '## Outcome', ...pr.outcomes.map((o) => `- ${o}`));
  const extra: [string, string[] | undefined][] = [
    ['Challenges', pr.challenges],
    ['Security angle', pr.security],
    ['What I learned', pr.learned],
  ];
  for (const [title, items] of extra) if (items?.length) out.push('', `## ${title}`, ...items.map((i) => `- ${i}`));
  const links = Object.entries(pr.links).filter(([, v]) => v);
  if (links.length) out.push('', '## Links', ...links.map(([k, v]) => `${k}: ${v}`));
  out.push('', `Tip: run "open ${pr.id}" for the full case study.`);
  return out;
}

export function files(): VFile[] {
  const list: VFile[] = [
    {
      path: 'README.txt',
      unlocked: () => true,
      lockedHint: '',
      read: () => [
        `Welcome to ${p.person.handle}. This box is deliberately vulnerable.`,
        'Recon first: scan → enum <port> → exploit <port> [item].',
        'Every move you make is logged by the SOC on the right. Have fun.',
      ],
    },
    {
      path: 'about.txt',
      unlocked: () => session.compromised.has('about'),
      lockedHint: 'enum 22',
      read: () => [
        p.person.summary,
        '',
        `Target roles: ${p.person.targetRoles.join(', ')}`,
        `Location: ${p.person.location}`,
        '',
        'Focus areas:',
        ...p.person.interests.map((i) => `  · ${i}`),
        '',
        'Education:',
        ...p.education.flatMap((e) => [
          `  ${e.degree}${e.school ? ` — ${e.school}` : ''}${e.end ? ` (${[e.start, e.end].filter(Boolean).join(' – ')})` : ''}`,
          ...e.details.map((d) => `    · ${d}`),
        ]),
      ],
    },
    {
      path: 'experience.log',
      unlocked: () => session.compromised.has('experience'),
      lockedHint: 'exploit 3306',
      read: () =>
        p.experience.flatMap((j) => [
          `[${j.start} – ${j.end}] ${j.title} @ ${j.org} (${j.location})`,
          ...j.bullets.map((b) => `    · ${b}`),
          ...(j.skills?.length ? [`    skills: ${j.skills.join(', ')}`] : []),
          ...(j.takeaway ? [`    ↳ ${j.takeaway}`] : []),
          '',
        ]),
    },
    {
      path: 'certs.txt',
      unlocked: () => session.compromised.has('certifications'),
      lockedHint: 'exploit 8443',
      read: () => [
        ...(p.certifications.length ? [] : ['No certifications listed yet — the Master of Cyber Security comes first.']),
        ...p.certifications.map((c) => `${c.status.toUpperCase().padEnd(12)} ${c.name} — ${c.issuer}${c.date ? ` (${c.date})` : ''}${c.todo ? '  [TODO]' : ''}`),
        '',
        'Skills:',
        ...p.skills.map((s) => `  ${s.group}: ${s.items.join(', ')}`),
      ],
    },
    {
      path: 'contact.txt',
      unlocked: () => session.compromised.has('contact'),
      lockedHint: 'enum 25',
      read: () => [
        `email:    ${p.person.links.email}`,
        `linkedin: ${p.person.links.linkedin}`,
        `github:   ${p.person.links.github}`,
        ...(p.person.links.showPhone && p.person.links.phone ? [`phone:    ${p.person.links.phone}`] : []),
        '',
        'Or just run: sudo hire-me',
      ],
    },
    {
      path: '.flag',
      hidden: true,
      unlocked: () => true,
      lockedHint: '',
      read: () => [p.easterEggs.flag],
    },
  ];
  for (const pr of p.projects) {
    list.push({
      path: `projects/${pr.id}.md`,
      unlocked: () => session.unlockedProjects.has(pr.id),
      lockedHint: `exploit 443 ${pr.id}`,
      read: () => projectMarkdown(pr),
    });
  }
  return list;
}

/** Normalise a user path relative to cwd ("~" or "~/projects"). */
export function resolve(cwd: string, input: string): string {
  let path = input.trim();
  if (path.startsWith('/home/hari.sec/')) path = path.slice('/home/hari.sec/'.length);
  if (path.startsWith('~/')) path = path.slice(2);
  else if (cwd === '~/projects' && !path.startsWith('projects/') && !path.startsWith('../')) path = `projects/${path}`;
  if (path.startsWith('../')) path = path.slice(3);
  if (path.startsWith('./')) path = path.slice(2);
  return path;
}
