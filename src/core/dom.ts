/**
 * Safe DOM builder. Text is always set with textContent — never innerHTML —
 * so nothing from portfolio data or user input can inject markup.
 */
type Attrs = Record<string, string | number | boolean | undefined | null>;
type Child = Node | string | number | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Child | Child[])[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  append(el, children);
  return el;
}

export function append(el: Element, children: (Child | Child[])[]): void {
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function svg(tag: string, attrs: Attrs = {}, ...children: Node[]): SVGElement {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    el.setAttribute(k, String(v));
  }
  children.forEach((c) => el.append(c));
  return el;
}

/** Only allow http(s), mailto and tel links from data. Anything else becomes "#". */
export function safeUrl(url: string): string {
  try {
    const u = new URL(url, location.href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(u.protocol) ? u.href : '#';
  } catch {
    return '#';
  }
}

export function link(href: string, text: Child | Child[], extra: Attrs = {}): HTMLAnchorElement {
  const safe = safeUrl(href);
  const external = /^https?:/.test(safe) && !safe.startsWith(location.origin);
  return h(
    'a',
    { href: safe, ...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {}), ...extra },
    ...(Array.isArray(text) ? text : [text]),
  );
}

/** Resolve a /public asset against the deploy base path. */
export function asset(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}

export const reducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const pad = (n: number, w = 2): string => String(n).padStart(w, '0');
export const clock = (d: Date): string => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
