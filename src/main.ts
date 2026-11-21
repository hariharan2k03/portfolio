import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import '@fontsource/rajdhani/latin-600.css';
import '@fontsource/rajdhani/latin-700.css';
import './styles/main.css';
import './styles/recruiter.css';
import './styles/print.css';

import { h } from './core/dom';
import { bus, session } from './core/state';
import { prefs, type Mode } from './core/storage';
import { portfolio } from './data/portfolio';
import { Terminal } from './terminal/Terminal';
import { completer, refreshChips, runCommand, type Ctx } from './terminal/commands';
import { SocFeed } from './soc/SocFeed';
import { caseStudy, makeDialog } from './ui/Dialog';
import { footer, hero, projectsPanel, topBar } from './ui/hero';
import { renderReport } from './report/IncidentReport';
import { renderRecruiter } from './recruiter/RecruiterView';

const app = document.getElementById('app')!;
document.getElementById('noscript-fallback')?.remove();

/* ---------------- CRT mode (off by default, Konami toggles) ---------------- */
function setCrt(on: boolean): boolean {
  document.body.classList.toggle('crt', on);
  prefs.setCrt(on);
  return on;
}
setCrt(prefs.getCrt());

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let kIdx = 0;
window.addEventListener('keydown', (e) => {
  kIdx = e.key === KONAMI[kIdx] || e.key.toLowerCase() === KONAMI[kIdx] ? kIdx + 1 : e.key === KONAMI[0] ? 1 : 0;
  if (kIdx === KONAMI.length) {
    kIdx = 0;
    const on = setCrt(!document.body.classList.contains('crt'));
    hacker?.term.print(`↑↑↓↓←→←→BA — CRT mode ${on ? 'ON' : 'OFF'}. You have excellent taste.`, 'accent');
  }
});

/* ---------------- dialogs ---------------- */
const cs = makeDialog('case-study', 'cs-title', 'dlg-case');
const rp = makeDialog('report-dialog', 'rp-title', 'dlg-report');
rp.dialog.addEventListener('close', () => document.body.classList.remove('print-report'));
window.addEventListener('afterprint', () => document.body.classList.remove('print-report'));

function openCaseStudy(id: string): void {
  const pr = portfolio.projects.find((p) => p.id === id);
  if (!pr) return;
  cs.body.replaceChildren(...caseStudy(pr));
  cs.open();
}

function openReport(): void {
  rp.body.replaceChildren(
    ...renderReport(() => {
      rp.dialog.close();
      setMode('recruiter', 'rv-contact');
    }),
  );
  cs.dialog.close();
  rp.open();
}

/* ---------------- hacker mode ---------------- */
let hacker: { term: Terminal; ctx: Ctx } | null = null;

function buildHacker(): HTMLElement {
  const ctxRef: { ctx?: Ctx } = {};
  const term: Terminal = new Terminal((raw) => runCommand(raw, ctxRef.ctx!), (p): string[] => completer(term)(p));
  const ctx: Ctx = {
    term,
    openCaseStudy,
    openReport,
    toggleCrt: () => setCrt(!document.body.classList.contains('crt')),
    setMode: (m) => setMode(m),
  };
  ctxRef.ctx = ctx;
  hacker = { term, ctx };
  const soc = new SocFeed();

  const focusTerminal = () => {
    document.getElementById('ops')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    term.focus();
  };

  const projects = projectsPanel(
    (id, locked) => {
      if (locked) {
        focusTerminal();
        term.exec(`exploit 443 ${id}`);
      } else openCaseStudy(id);
    },
    () => setMode('recruiter', 'rv-projects'),
  );

  const main = h(
    'main',
    { id: 'main', tabindex: '-1' },
    hero(focusTerminal),
    h('div', { class: 'ops', id: 'ops' }, term.root, soc.root, projects),
  );

  const boot = [
    `Connecting to ${portfolio.person.handle}…`,
    'Resolving 203.0.113.10 (simulated)… ok',
    'TLS handshake… ok   ·   SOC sensor: ACTIVE',
    `Target acquired. Type 'help' or tap a command below.`,
  ];
  // Start boot when terminal scrolls into view (or immediately on desktop)
  // ?demo plays a short scripted session (used to capture og-image.png)
  const demo = new URLSearchParams(location.search).has('demo');
  queueMicrotask(() =>
    term.boot(boot, () => {
      refreshChips(ctx);
      if (demo) {
        ['whoami', 'scan', 'enum 443', 'cat /etc/passwd', 'sudo hire-me'].forEach((c) => term.exec(c));
        document.querySelector<HTMLElement>('.hero')!.hidden = true;
      }
    }),
  );
  return main;
}

/* ---------------- mode switching ---------------- */
let current: Mode = 'hacker';

function setMode(mode: Mode, anchor?: string): void {
  current = mode;
  prefs.setMode(mode);
  document.documentElement.dataset.mode = mode;
  const url = new URL(location.href);
  url.hash = mode === 'recruiter' ? 'recruiter' : '';
  history.replaceState(null, '', url.pathname + url.search + url.hash);
  render(anchor);
  bus.emit('mode', mode);
}

let hackerMain: HTMLElement | null = null;

function render(anchor?: string): void {
  const skip = h(
    'a',
    { class: 'skip-link', href: '#main' },
    current === 'hacker' ? 'Skip to recruiter view — plain résumé, recommended for screen readers' : 'Skip to main content',
  );
  skip.addEventListener('click', (e) => {
    if (current === 'hacker') {
      e.preventDefault();
      setMode('recruiter');
      document.getElementById('main')?.focus();
    }
  });
  const bar = topBar(() => setMode(current === 'hacker' ? 'recruiter' : 'hacker'), current);
  // Keep the hacker session alive across mode switches (terminal + SOC state)
  if (current === 'hacker') hackerMain ??= buildHacker();
  const body = current === 'hacker' ? [hackerMain!, footer()] : [renderRecruiter()];
  app.replaceChildren(skip, bar, ...body);
  document.title = current === 'hacker' ? portfolio.meta.siteTitle : `${portfolio.person.name} — Résumé · ${portfolio.person.targetRoles.slice(0, 2).join(' / ')}`;
  if (anchor) document.getElementById(anchor)?.scrollIntoView();
  else window.scrollTo(0, 0);
}

bus.on('badge', (b) => hacker?.term.print(`🏅 Badge unlocked: ${b}`, 'ok'));
bus.on('unlock', () => {
  if (session.compromised.size >= 3) document.body.classList.add('incident');
});

const initial: Mode = location.hash === '#recruiter' ? 'recruiter' : prefs.getMode() ?? 'hacker';
setMode(initial);
