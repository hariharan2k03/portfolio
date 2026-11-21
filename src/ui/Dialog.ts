/**
 * Thin wrapper around native <dialog>: focus trap, Esc to close and
 * focus restore come for free from the browser.
 */
import { asset, h, link } from '../core/dom';
import { portfolio } from '../data/portfolio';
import type { Project } from '../data/schema';
import { projectIcon } from './icons';

export function makeDialog(id: string, labelId: string, extraClass = ''): {
  dialog: HTMLDialogElement;
  body: HTMLElement;
  open: () => void;
} {
  const body = h('div', { class: 'dlg-body' });
  const close = h('button', { type: 'button', class: 'dlg-close', 'aria-label': 'Close' }, '✕');
  const dialog = h('dialog', { id, class: `dlg ${extraClass}`, 'aria-labelledby': labelId }, close, body);
  close.addEventListener('click', () => dialog.close());
  // Click on the backdrop closes
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  return {
    dialog,
    body,
    open: () => {
      if (!dialog.open) dialog.showModal();
      body.scrollTop = 0;
      close.focus();
    },
  };
}

export function caseStudy(pr: Project): HTMLElement[] {
  const linkEntries: [string, string | undefined][] = [
    ['GitHub', pr.links.github],
    ['Write-up', pr.links.writeup],
    ['Live demo', pr.links.demo],
  ];
  return [
    h('p', { class: 'ag-chip' }, '✓ ACCESS GRANTED'),
    h('div', { class: 'cs-head' }, projectIcon(pr.icon), h('div', {}, h('h2', { id: 'cs-title' }, pr.title), pr.role ? h('p', { class: 'cs-role' }, pr.role) : null)),
    h('h3', {}, 'Problem'),
    h('p', {}, pr.problem),
    h('h3', {}, 'My approach'),
    h('ul', {}, pr.approach.map((a) => h('li', {}, a))),
    h('h3', {}, 'Tools'),
    h('ul', { class: 'tags' }, pr.tools.map((t) => h('li', {}, t))),
    h('h3', {}, 'Outcome'),
    h('ul', { class: 'outcomes' }, pr.outcomes.map((o) => h('li', {}, o))),
    ...listSection('Challenges & how I solved them', pr.challenges),
    ...listSection('Security angle', pr.security),
    ...listSection('What I learned', pr.learned),
    pr.screenshots.length
      ? h(
          'div',
          { class: 'shots' },
          pr.screenshots.slice(0, 2).map((s) => h('img', { src: asset(s.src), alt: s.alt, loading: 'lazy', decoding: 'async', width: '640', height: '400' })),
        )
      : h('p', { class: 'muted' }, 'Screenshots coming soon.'),
    h(
      'div',
      { class: 'cs-links' },
      linkEntries.filter(([, u]) => u).map(([label, u]) => link(u!, `${label} ↗`, { class: 'btn' })),
      linkEntries.every(([, u]) => !u) ? h('span', { class: 'muted' }, `Ask me about it: ${portfolio.person.links.email}`) : null,
    ),
  ];
}

function listSection(title: string, items?: string[]): HTMLElement[] {
  if (!items?.length) return [];
  return [h('h3', {}, title), h('ul', {}, items.map((i) => h('li', {}, i)))];
}
