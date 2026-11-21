/**
 * Live SOC dashboard (blue-team side).
 * Stat tiles, threat meter, alert-rate sparkline, simulated geo map and the
 * alert feed. On < 1024px it becomes a collapsible bottom sheet.
 *
 * PRIVACY: no real IP or location is ever read. All geo data is decorative
 * and labelled "simulated".
 */
import { clock, h, svg } from '../core/dom';
import { bus, session, type Alert, type Severity } from '../core/state';
import { worldMap, pingAt } from './worldmap';

const WEIGHT: Record<Severity, number> = { info: 1, low: 3, medium: 6, high: 12, critical: 25 };
const LEVELS = ['LOW', 'GUARDED', 'ELEVATED', 'HIGH', 'SEVERE'];

export class SocFeed {
  readonly root: HTMLElement;
  private list: HTMLElement;
  private live: HTMLElement;
  private tiles: Record<'crit' | 'warn' | 'info', HTMLElement>;
  private total: HTMLElement;
  private meterFill: HTMLElement;
  private meterLabel: HTMLElement;
  private meter: HTMLElement;
  private spark: SVGElement;
  private map: SVGSVGElement;
  private sheetBtn: HTMLButtonElement;
  private badge: HTMLElement;
  private unread = 0;
  private empty: HTMLElement;

  constructor() {
    const tile = (cls: string, label: string) => {
      const n = h('span', { class: 'tile-n' }, '0');
      const el = h('div', { class: `tile ${cls}` }, h('span', { class: 'tile-ico', 'aria-hidden': 'true' }), n, h('span', { class: 'tile-l' }, label));
      return { el, n };
    };
    const crit = tile('crit', 'High / Critical');
    const warn = tile('warn', 'Med / Low');
    const info = tile('info', 'Info');
    this.tiles = { crit: crit.n, warn: warn.n, info: info.n };

    this.spark = svg('svg', { viewBox: '0 0 120 40', preserveAspectRatio: 'none', class: 'spark', 'aria-hidden': 'true' });
    this.meterFill = h('span', { class: 'meter-fill' });
    this.meterLabel = h('span', { class: 'meter-label' }, 'LOW');
    this.meter = h('div', {
      class: 'meter',
      role: 'meter',
      'aria-label': 'Threat level',
      'aria-valuemin': '0',
      'aria-valuemax': '100',
      'aria-valuenow': '0',
      'aria-valuetext': 'Low',
    }, h('span', { class: 'meter-track' }, this.meterFill));
    this.total = h('span', { class: 'total' }, '0 alerts');

    this.map = worldMap();
    this.empty = h('li', { class: 'alert-empty' }, 'No activity yet. Every command you run in the terminal will appear here.');
    this.list = h('ol', { class: 'alerts', 'aria-label': 'Alerts, newest first' }, this.empty);
    this.live = h('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });

    this.badge = h('span', { class: 'badge', hidden: true }, '0');
    this.sheetBtn = h(
      'button',
      { type: 'button', class: 'sheet-toggle', 'aria-expanded': 'false', 'aria-controls': 'soc-body' },
      h('span', { class: 'sheet-grip', 'aria-hidden': 'true' }),
      h('span', {}, 'SOC feed'),
      this.badge,
    );
    this.sheetBtn.addEventListener('click', () => this.toggleSheet());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.root.classList.contains('open')) {
        this.toggleSheet(false);
        this.sheetBtn.focus();
      }
    });

    this.root = h(
      'section',
      { class: 'panel soc', id: 'soc', 'aria-labelledby': 'soc-title' },
      this.sheetBtn,
      h(
        'div',
        { class: 'soc-body', id: 'soc-body' },
        h(
          'header',
          { class: 'panel-head' },
          h('span', { class: 'ico-shield', 'aria-hidden': 'true' }),
          h('h2', { id: 'soc-title', class: 'panel-title' }, 'Live SOC Dashboard'),
          h('span', { class: 'status ok' }, h('span', { class: 'pulse', 'aria-hidden': 'true' }), 'Monitoring…'),
        ),
        h('div', { class: 'tiles' }, crit.el, warn.el, info.el, h('div', { class: 'tile sparkwrap' }, this.spark)),
        h(
          'div',
          { class: 'threat' },
          h('span', { class: 'threat-k' }, 'Threat level'),
          this.meter,
          this.meterLabel,
          this.total,
        ),
        h(
          'div',
          { class: 'soc-split' },
          h(
            'figure',
            { class: 'map' },
            this.map,
            h('figcaption', {}, 'Source: 203.0.113.x (simulated) · geo is decorative — no visitor data is collected'),
          ),
          h('div', { class: 'feed' }, this.list),
        ),
      ),
      this.live,
    );

    bus.on('alert', (a) => this.add(a));
    this.renderSpark();
    window.setInterval(() => this.renderSpark(), 5000);
  }

  private toggleSheet(force?: boolean): void {
    const open = force ?? !this.root.classList.contains('open');
    this.root.classList.toggle('open', open);
    this.sheetBtn.setAttribute('aria-expanded', String(open));
    if (open) {
      this.unread = 0;
      this.badge.hidden = true;
    }
  }

  private add(a: Alert): void {
    this.empty.remove();
    const detail = h(
      'div',
      { class: 'alert-detail', id: `alert-d-${a.id}`, hidden: true },
      h('p', { class: 'an-label' }, 'Analyst note — how I would detect / respond'),
      h('p', { class: 'an-note' }, a.note),
      h('pre', { class: 'an-query', tabindex: '0', 'aria-label': 'Sample detection query' }, h('code', {}, a.query)),
      h('p', { class: 'an-meta' }, `Tactic: ${a.tactic} · Trigger: ${a.command}`),
    );
    const btn = h(
      'button',
      { type: 'button', class: 'alert-btn', 'aria-expanded': 'false', 'aria-controls': `alert-d-${a.id}` },
      h('time', { datetime: a.time.toISOString() }, clock(a.time)),
      h('span', { class: `sev sev-${a.severity}` }, a.severity),
      h('span', { class: 'alert-main' }, h('span', { class: 'ttp' }, `${a.technique} ${a.name}`), h('span', { class: 'desc' }, a.description)),
    );
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      detail.hidden = !open;
    });
    const li = h('li', { class: `alert sev-border-${a.severity}` }, btn, detail);
    this.list.prepend(li);
    // Keep the DOM bounded on long sessions
    while (this.list.children.length > 60) this.list.lastElementChild?.remove();

    this.updateStats();
    pingAt(this.map, a);
    this.live.textContent = `New ${a.severity} alert: ${a.technique} ${a.name}. ${a.description}`;

    if (!this.root.classList.contains('open')) {
      this.unread++;
      this.badge.textContent = String(this.unread);
      this.badge.hidden = false;
      this.badge.setAttribute('aria-label', `${this.unread} unread alerts`);
    }
  }

  private updateStats(): void {
    const c = { crit: 0, warn: 0, info: 0 };
    let score = 0;
    for (const a of session.alerts) {
      if (a.severity === 'high' || a.severity === 'critical') c.crit++;
      else if (a.severity === 'info') c.info++;
      else c.warn++;
      score += WEIGHT[a.severity];
    }
    this.tiles.crit.textContent = String(c.crit);
    this.tiles.warn.textContent = String(c.warn);
    this.tiles.info.textContent = String(c.info);
    this.total.textContent = `${session.alerts.length} alert${session.alerts.length === 1 ? '' : 's'}`;
    const pct = Math.min(100, Math.round(score / 2));
    const level = LEVELS[Math.min(4, Math.floor(pct / 20.01))];
    this.meterFill.style.width = `${pct}%`;
    this.meterFill.dataset.level = level;
    this.meterLabel.textContent = level;
    this.meterLabel.dataset.level = level;
    this.meter.setAttribute('aria-valuenow', String(pct));
    this.meter.setAttribute('aria-valuetext', level);
    this.renderSpark();
  }

  /** Alerts per 10 s bucket over the last 2 minutes. */
  private renderSpark(): void {
    const now = Date.now();
    const buckets = new Array(12).fill(0);
    for (const a of session.alerts) {
      const age = (now - a.time.getTime()) / 10000;
      if (age < 12) buckets[11 - Math.floor(age)] += WEIGHT[a.severity];
    }
    const max = Math.max(8, ...buckets);
    const pts = buckets.map((v, i) => `${(i / 11) * 120},${38 - (v / max) * 34}`).join(' ');
    this.spark.replaceChildren(
      svg('polyline', { points: `0,40 ${pts} 120,40`, class: 'spark-area' }),
      svg('polyline', { points: pts, class: 'spark-line' }),
    );
  }
}
