/**
 * Renders a mini challenge inline in the terminal.
 * Every challenge is answerable by clicking (no typing needed).
 * Wrong answer → next hint. After 2 wrong answers → Skip appears.
 */
import { h, reducedMotion } from '../core/dom';
import { session } from '../core/state';
import { detect } from '../soc/detect';
import type { Challenge } from '../data/schema';

interface Active {
  challenge: Challenge;
  label: string;
  attempts: number;
  hintIdx: number;
  feedback: HTMLElement;
  skipBtn: HTMLButtonElement;
  root: HTMLElement;
  done: (skipped: boolean) => void;
}

let active: Active | null = null;

export const hasActiveChallenge = (): boolean => active !== null;

/** Used by the `hint` command. */
export function nextHint(): string | null {
  if (!active) return null;
  const { hints } = active.challenge;
  const hint = hints[Math.min(active.hintIdx, hints.length - 1)];
  active.hintIdx++;
  session.hintsUsed++;
  return hint;
}

export function skipActive(): boolean {
  if (!active || active.attempts < 2) return false;
  finish(true);
  return true;
}

export function canSkip(): boolean {
  return !!active && active.attempts >= 2;
}

export function startChallenge(
  challenge: Challenge,
  label: string,
  onDone: (skipped: boolean) => void,
): HTMLElement {
  // Abandon any previous challenge quietly.
  if (active) active.root.classList.add('abandoned');

  const feedback = h('p', { class: 'ch-feedback', role: 'status' });
  const skipBtn = h('button', { type: 'button', class: 'btn ghost ch-skip', hidden: true }, 'Skip challenge →');
  const body = renderBody(challenge);
  const root = h(
    'div',
    { class: 'challenge', role: 'group', 'aria-label': `Challenge: ${challenge.title}` },
    h('div', { class: 'ch-head' }, h('span', { class: 'ch-tag' }, `CHALLENGE · ${challenge.title}`), h('span', { class: 'ch-target' }, label)),
    h('p', { class: 'ch-prompt' }, challenge.prompt),
    body,
    feedback,
    h('div', { class: 'ch-actions' }, skipBtn),
  );

  active = { challenge, label, attempts: 0, hintIdx: 0, feedback, skipBtn, root, done: onDone };
  skipBtn.addEventListener('click', () => skipActive());

  queueMicrotask(() => root.querySelector<HTMLElement>('button, input')?.focus({ preventScroll: true }));
  return root;
}

function answer(correct: boolean, picked?: HTMLElement): void {
  if (!active) return;
  if (correct) {
    picked?.classList.add('correct');
    finish(false);
    return;
  }
  picked?.classList.add('wrong');
  active.attempts++;
  session.failures++;
  detect('fail', 'challenge', active.label);
  const hint = nextHint();
  active.feedback.className = 'ch-feedback bad';
  active.feedback.textContent = `✗ Access denied. Hint: ${hint ?? 'look closer.'}`;
  if (active.attempts >= 2) {
    active.skipBtn.hidden = false;
  }
}

function finish(skipped: boolean): void {
  if (!active) return;
  const a = active;
  active = null;
  a.root.classList.add('solved');
  a.root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button, input').forEach((b) => (b.disabled = true));
  a.feedback.className = 'ch-feedback good';
  a.feedback.textContent = skipped ? `Skipped. ${a.challenge.explain}` : `✓ ${a.challenge.explain}`;
  if (skipped) {
    session.skips++;
    detect('skip', 'skip', a.label);
  }
  a.done(skipped);
}

/* --------------------------- renderers --------------------------- */

function optionButton(text: string, correct: boolean, cls = 'ch-option'): HTMLButtonElement {
  const b = h('button', { type: 'button', class: cls }, text);
  b.addEventListener('click', () => answer(correct, b));
  return b;
}

function renderBody(c: Challenge): HTMLElement {
  switch (c.type) {
    case 'logTriage':
      return h(
        'div',
        { class: 'ch-list mono' },
        c.lines.map((l, i) => optionButton(l, i === c.answer, 'ch-option ch-line')),
      );
    case 'spotVuln':
      return h(
        'div',
        { class: 'ch-code mono', 'aria-label': `${c.language} code. Each line is a button.` },
        c.code.map((l, i) => {
          const b = optionButton('', i === c.answer, 'ch-option ch-codeline');
          b.append(h('span', { class: 'ln', 'aria-hidden': 'true' }, String(i + 1).padStart(2, ' ')), h('code', {}, l || ' '));
          b.setAttribute('aria-label', `Line ${i + 1}: ${l}`);
          return b;
        }),
      );
    case 'decode': {
      const input = h('input', { type: 'text', class: 'ch-input', 'aria-label': 'Your decoded answer', autocomplete: 'off', spellcheck: 'false' });
      const form = h('form', { class: 'ch-form' }, input, h('button', { type: 'submit', class: 'btn' }, 'Submit'));
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        answer(input.value.trim().toLowerCase() === c.answer.toLowerCase(), input);
      });
      return h(
        'div',
        {},
        h('div', { class: 'ch-payload mono' }, h('span', { class: 'dim' }, `${c.encoding.toUpperCase()}  `), c.payload),
        h('p', { class: 'ch-sub' }, 'Pick the answer, or decode it yourself and type it:'),
        h('div', { class: 'ch-grid' }, c.options.map((o) => optionButton(o, o.toLowerCase() === c.answer.toLowerCase()))),
        form,
      );
    }
    case 'phishOrLegit':
      return h(
        'div',
        {},
        h(
          'dl',
          { class: 'ch-headers mono' },
          c.headers.flatMap(([k, v]) => [h('dt', {}, `${k}:`), h('dd', {}, v)]),
        ),
        h(
          'div',
          { class: 'ch-grid two' },
          optionButton('🎣 Phish', c.answer === 'phish', 'ch-option big'),
          optionButton('✅ Legit', c.answer === 'legit', 'ch-option big'),
        ),
      );
    case 'hashId':
      return h(
        'div',
        {},
        h('div', { class: 'ch-payload mono' }, c.hash),
        h('div', { class: 'ch-grid' }, c.options.map((o, i) => optionButton(o, i === c.answer))),
      );
  }
}

/** Full-panel ACCESS GRANTED flash. */
export function accessGranted(container: HTMLElement, label: string): Promise<void> {
  const el = h(
    'div',
    { class: 'access-granted', 'aria-hidden': 'true' },
    h('div', { class: 'ag-text', 'data-text': 'ACCESS GRANTED' }, 'ACCESS GRANTED'),
    h('div', { class: 'ag-sub' }, label),
  );
  container.append(el);
  const ms = reducedMotion() ? 700 : 1400;
  return new Promise((resolve) =>
    window.setTimeout(() => {
      el.remove();
      resolve();
    }, ms),
  );
}
