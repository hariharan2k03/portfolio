/**
 * Readable "file viewer" blocks for the terminal: each entry is a card with a
 * heading, a meta line, proper bullet lists (wrapped lines stay indented),
 * skill tags and a highlighted takeaway. Plain text is kept for `read()`.
 */
import { h, link } from '../core/dom';

export interface DocEntry {
  title: string;
  meta?: string;
  text?: string;
  bullets?: string[];
  tags?: string[];
  note?: string;
  links?: [string, string][];
}

export interface DocSection {
  heading?: string;
  entries: DocEntry[];
}

export function renderDoc(file: string, sections: DocSection[]): HTMLElement {
  return h(
    'article',
    { class: 'tdoc', 'aria-label': file },
    h('div', { class: 'tdoc-file' }, `── ${file} `),
    sections.map((s) =>
      h(
        'section',
        { class: 'tdoc-sec' },
        s.heading ? h('h3', { class: 'tdoc-sh' }, s.heading) : null,
        s.entries.map((e) =>
          h(
            'div',
            { class: 'tdoc-entry' },
            h('div', { class: 'tdoc-h' }, e.title),
            e.meta ? h('div', { class: 'tdoc-meta' }, e.meta) : null,
            e.text ? h('p', { class: 'tdoc-text' }, e.text) : null,
            e.bullets?.length ? h('ul', { class: 'tdoc-ul' }, e.bullets.map((b) => h('li', {}, b))) : null,
            e.tags?.length ? h('ul', { class: 'tdoc-tags' }, e.tags.map((t) => h('li', {}, t))) : null,
            e.note ? h('p', { class: 'tdoc-note' }, e.note) : null,
            e.links?.length ? h('p', { class: 'tdoc-links' }, e.links.map(([label, url]) => link(url, `${label} ↗`))) : null,
          ),
        ),
      ),
    ),
  );
}
