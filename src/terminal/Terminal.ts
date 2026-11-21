/**
 * Hand-built terminal: no xterm.js, no dependencies.
 * Features: command history (↑/↓), Tab autocomplete, Ctrl+L clear,
 * clickable suggestion chips, skippable boot sequence.
 */
import { h, reducedMotion } from '../core/dom';
import { portfolio } from '../data/portfolio';

export interface Chip {
  label: string;
  command: string;
}

export type LineKind = 'out' | 'cmd' | 'ok' | 'warn' | 'err' | 'dim' | 'accent';

export class Terminal {
  readonly root: HTMLElement;
  private output: HTMLElement;
  private input: HTMLInputElement;
  private promptEl: HTMLElement;
  private chipsEl: HTMLElement;
  private history: string[] = [];
  private histIdx = -1;
  private draft = '';
  private booting = false;
  private skipBoot: (() => void) | null = null;
  cwd = '~';

  constructor(
    private onCommand: (raw: string) => void,
    private complete: (partial: string) => string[],
  ) {
    const handle = portfolio.person.handle;
    this.output = h('div', {
      class: 'term-output',
      role: 'log',
      'aria-live': 'polite',
      'aria-label': 'Terminal output',
      tabindex: '-1',
    });
    this.promptEl = h('span', { class: 'prompt', 'aria-hidden': 'true' });
    this.input = h('input', {
      class: 'term-input',
      type: 'text',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: 'false',
      enterkeyhint: 'send',
      'aria-label': `Terminal command for ${handle}. Type help, or use the suggested command buttons below.`,
    });
    const form = h('form', { class: 'term-inputline' }, this.promptEl, this.input);
    this.chipsEl = h('div', { class: 'chips', role: 'group', 'aria-label': 'Suggested commands' });

    this.root = h(
      'section',
      { class: 'panel terminal', id: 'terminal', 'aria-labelledby': 'term-title' },
      h(
        'header',
        { class: 'panel-head' },
        h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
        h('h2', { id: 'term-title', class: 'panel-title' }, 'Live Terminal'),
        h('span', { class: 'status ok' }, h('span', { class: 'pulse', 'aria-hidden': 'true' }), 'Online'),
      ),
      h('div', { class: 'term-body' }, this.output, form),
      this.chipsEl,
    );

    this.updatePrompt();
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const raw = this.input.value;
      this.input.value = '';
      this.histIdx = -1;
      if (raw.trim()) {
        this.history.push(raw);
      }
      this.run(raw);
    });
    this.input.addEventListener('keydown', (e) => this.onKey(e));
    // Clicking anywhere in the body focuses the input (unless selecting text / clicking a button)
    this.output.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button, a, input')) return;
      if (window.getSelection()?.toString()) return;
      this.focus();
    });
  }

  get commandHistory(): readonly string[] {
    return this.history;
  }

  focus(): void {
    this.input.focus({ preventScroll: true });
  }

  updatePrompt(): void {
    this.promptEl.replaceChildren(
      h('span', { class: 'p-user' }, `${portfolio.person.handle}@breachme`),
      ':',
      h('span', { class: 'p-path' }, this.cwd),
      '$ ',
    );
  }

  /** Run a command as if typed (used by chips and project cards). */
  run(raw: string): void {
    if (this.booting) this.skipBoot?.();
    this.echo(raw);
    this.onCommand(raw);
    this.scroll();
  }

  /** Programmatic run that also records history. */
  exec(raw: string): void {
    this.history.push(raw);
    this.run(raw);
  }

  echo(raw: string): void {
    const line = h('div', { class: 'line cmd' }, this.promptEl.cloneNode(true), raw);
    this.output.append(line);
  }

  print(lines: string | string[], kind: LineKind = 'out'): void {
    const arr = Array.isArray(lines) ? lines : [lines];
    for (const l of arr) this.output.append(h('div', { class: `line ${kind}` }, l || ' '));
    this.scroll();
  }

  /** alignTop: scroll so the node's top is visible (used for challenges). */
  printNode(node: HTMLElement, alignTop = false): void {
    this.output.append(node);
    if (alignTop) this.output.scrollTop = Math.max(0, node.offsetTop - this.output.offsetTop - 8);
    else this.scroll();
  }

  clear(): void {
    this.output.replaceChildren();
  }

  scroll(): void {
    this.output.scrollTop = this.output.scrollHeight;
  }

  setChips(chips: Chip[]): void {
    this.chipsEl.replaceChildren(
      ...chips.map((c) => {
        const b = h('button', { type: 'button', class: 'chip', title: `Run: ${c.command}` }, c.label);
        b.addEventListener('click', () => {
          this.exec(c.command);
        });
        return b;
      }),
    );
  }

  private onKey(e: KeyboardEvent): void {
    if (e.key === 'ArrowUp') {
      if (!this.history.length) return;
      e.preventDefault();
      if (this.histIdx === -1) {
        this.draft = this.input.value;
        this.histIdx = this.history.length - 1;
      } else if (this.histIdx > 0) this.histIdx--;
      this.input.value = this.history[this.histIdx];
      this.caretEnd();
    } else if (e.key === 'ArrowDown') {
      if (this.histIdx === -1) return;
      e.preventDefault();
      if (this.histIdx < this.history.length - 1) {
        this.histIdx++;
        this.input.value = this.history[this.histIdx];
      } else {
        this.histIdx = -1;
        this.input.value = this.draft;
      }
      this.caretEnd();
    } else if (e.key === 'Tab' && this.input.value.trim()) {
      // Only hijack Tab when there is something to complete, so keyboard
      // users can still Tab out of an empty prompt.
      const matches = this.complete(this.input.value);
      if (matches.length === 1) {
        e.preventDefault();
        this.input.value = matches[0];
      } else if (matches.length > 1) {
        e.preventDefault();
        const prefix = commonPrefix(matches);
        if (prefix.length > this.input.value.length) this.input.value = prefix;
        else {
          this.echo(this.input.value);
          this.print(matches.map((m) => m.split(' ').pop() ?? m).join('   '), 'dim');
        }
      }
    } else if (e.key.toLowerCase() === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.clear();
    } else if (e.key === 'c' && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      this.echo(this.input.value + '^C');
      this.input.value = '';
    }
  }

  private caretEnd(): void {
    const n = this.input.value.length;
    requestAnimationFrame(() => this.input.setSelectionRange(n, n));
  }

  /** ~2 s boot sequence. Any key, click or the Skip button finishes it instantly. */
  boot(lines: string[], done: () => void): void {
    const instant = reducedMotion();
    this.booting = true;
    const skip = h('button', { type: 'button', class: 'chip skip-boot' }, 'Skip intro ⏭');
    this.chipsEl.replaceChildren(skip);
    let i = 0;
    let timer = 0;
    const finish = () => {
      if (!this.booting) return;
      this.booting = false;
      window.clearTimeout(timer);
      while (i < lines.length) this.print(lines[i++], i === lines.length ? 'accent' : 'dim');
      window.removeEventListener('keydown', finish);
      done();
    };
    this.skipBoot = finish;
    skip.addEventListener('click', () => {
      finish();
      this.focus();
    });
    window.addEventListener('keydown', finish, { once: true });
    if (instant) return finish();
    const step = () => {
      if (!this.booting) return;
      this.print(lines[i++], i === lines.length ? 'accent' : 'dim');
      if (i >= lines.length) finish();
      else timer = window.setTimeout(step, 2000 / lines.length);
    };
    step();
  }
}

function commonPrefix(items: string[]): string {
  let p = items[0];
  for (const s of items) while (!s.startsWith(p)) p = p.slice(0, -1);
  return p;
}
