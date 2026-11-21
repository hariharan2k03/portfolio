/**
 * The finale: an incident report of the visitor's own session,
 * built entirely from in-memory state. Printable via print.css.
 */
import { asset, clock, h, link } from '../core/dom';
import { session, type Alert, type Severity } from '../core/state';
import { portfolio } from '../data/portfolio';
import { icon } from '../ui/icons';

const SEV_ORDER: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

// One ID per page load, from the CSPRNG (no Math.random for IDs)
const incidentId = (() => {
  const b = new Uint8Array(3);
  crypto.getRandomValues(b);
  const d = session.start;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
  return `INC-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${hex}`;
})();

export function attackerProfile(): { title: string; blurb: string } {
  const a = session.alerts;
  const firstExploit = a.findIndex((x) => x.technique === 'T1190');
  const reconBefore = a.slice(0, firstExploit < 0 ? a.length : firstExploit).filter((x) => x.tactic === 'Discovery').length;
  const solved = a.filter((x) => x.technique === 'T1078').length;

  if (session.badges.has('Root wannabe') && session.compromised.size <= 1)
    return { title: 'Privilege-escalation enthusiast', blurb: 'Skipped the recon and went straight for root. Bold, effective, very loud in the logs.' };
  if (session.skips >= 2)
    return { title: 'Speedrunner', blurb: 'Found the skip button and used it with confidence. Efficient, if not stealthy.' };
  if (solved >= 3 && session.failures === 0)
    return { title: 'Surgical operator', blurb: 'Multiple compromises, zero failed attempts. Precise and quiet.' };
  if (reconBefore >= 4)
    return { title: 'Methodical recon specialist', blurb: 'Mapped the attack surface thoroughly before touching anything. Textbook kill chain.' };
  if (session.hintsUsed >= 3)
    return { title: 'Collaborative learner', blurb: 'Read the docs, took the hints, got there. The best analysts ask questions.' };
  if (a.length < 4)
    return { title: 'Passing reconnaissance', blurb: 'A light touch. Barely enough activity to open a ticket.' };
  return { title: 'Opportunistic explorer', blurb: 'Poked at whatever looked interesting. Curiosity is half of security.' };
}

function fmtDuration(ms: number): string {
  const s = Math.max(1, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return m ? `${m} min ${s % 60} s` : `${s} s`;
}

export function renderReport(onHire: () => void): HTMLElement[] {
  session.reportShown = true;
  const end = new Date();
  const alerts = session.alerts;
  const techniques = new Map<string, Alert>();
  alerts.forEach((a) => techniques.set(a.technique, a));
  const worst = SEV_ORDER.find((s) => alerts.some((a) => a.severity === s)) ?? 'info';
  const profile = attackerProfile();
  const totalSvc = portfolio.services.length;

  const hire = h('button', { type: 'button', class: 'btn primary' }, icon('briefcase'), 'Hire the defender');
  hire.addEventListener('click', onHire);
  const print = h('button', { type: 'button', class: 'btn ghost' }, icon('file'), 'Print / save as PDF');
  print.addEventListener('click', () => {
    document.body.classList.add('print-report');
    window.print();
  });

  const timeline = alerts.slice(-40);

  return [
    h(
      'header',
      { class: 'rp-head' },
      h('p', { class: 'rp-kicker' }, 'Security Incident Report · TLP:CLEAR'),
      h('h2', { id: 'rp-title' }, `Incident ${incidentId}`),
      h('p', { class: 'rp-sub' }, `Target: ${portfolio.person.handle} · Analyst on duty: ${portfolio.person.name}`),
    ),
    h(
      'dl',
      { class: 'rp-facts' },
      fact('Start', `${session.start.toLocaleDateString()} ${clock(session.start)}`),
      fact('End', clock(end)),
      fact('Duration', fmtDuration(end.getTime() - session.start.getTime())),
      fact('Source', '203.0.113.x (simulated)'),
      fact('Severity', worst.toUpperCase()),
      fact('Services compromised', `${session.compromised.size} / ${totalSvc}`),
    ),
    h(
      'section',
      { class: 'rp-sec' },
      h('h3', {}, 'Attacker profile'),
      h('p', { class: 'rp-verdict' }, profile.title),
      h('p', {}, profile.blurb),
      session.badges.size
        ? h('ul', { class: 'rp-badges', 'aria-label': 'Badges earned' }, [...session.badges].map((b) => h('li', {}, `🏅 ${b}`)))
        : null,
    ),
    h(
      'section',
      { class: 'rp-sec' },
      h('h3', {}, 'Techniques observed (MITRE ATT&CK)'),
      techniques.size
        ? h('ul', { class: 'tags ttp-tags' }, [...techniques.values()].map((a) => h('li', { class: `sev-border-${a.severity}` }, `${a.technique} · ${a.name}`)))
        : h('p', { class: 'muted' }, 'None yet. Go break something.'),
    ),
    h(
      'section',
      { class: 'rp-sec' },
      h('h3', {}, `Attack timeline${alerts.length > timeline.length ? ` (last ${timeline.length} of ${alerts.length})` : ''}`),
      timeline.length
        ? h(
            'ol',
            { class: 'rp-timeline' },
            timeline.map((a) =>
              h(
                'li',
                {},
                h('time', { datetime: a.time.toISOString() }, clock(a.time)),
                h('span', { class: `sev sev-${a.severity}` }, a.severity),
                h('code', {}, a.command),
                h('span', { class: 'muted' }, `${a.technique} — ${a.description}`),
              ),
            ),
          )
        : h('p', { class: 'muted' }, 'No activity recorded.'),
    ),
    h(
      'section',
      { class: 'rp-sec rp-evidence' },
      h('h3', {}, 'Evidence attached'),
      h(
        'div',
        { class: 'evidence-card' },
        icon('file', 'ico big'),
        h('div', {}, h('strong', {}, `${portfolio.person.name} — Résumé.pdf`), h('p', { class: 'muted' }, 'Exhibit A: the defender who detected all of the above.')),
        link(asset(portfolio.person.resume), [icon('download'), 'Download résumé'], { class: 'btn', download: '' }),
      ),
    ),
    h(
      'section',
      { class: 'rp-sec' },
      h('h3', {}, 'Recommended action'),
      h('p', {}, 'Retain the analyst who built the detection rules for this incident.'),
      h('div', { class: 'rp-actions' }, hire, print),
    ),
    h('p', { class: 'rp-foot muted' }, 'Generated entirely in your browser. No visitor data was collected, stored or sent anywhere.'),
  ];
}

function fact(k: string, v: string): HTMLElement {
  return h('div', {}, h('dt', {}, k), h('dd', {}, v));
}
