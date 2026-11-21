/**
 * The ONLY things persisted: the chosen view mode and the CRT preference.
 * Every access is wrapped in try/catch (private mode, blocked storage, etc.).
 * No visitor activity is ever stored.
 */
export type Mode = 'hacker' | 'recruiter';

function get(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function set(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — preference just won't persist */
  }
}

export const prefs = {
  getMode: (): Mode | null => {
    const v = get('breachme.mode');
    return v === 'hacker' || v === 'recruiter' ? v : null;
  },
  setMode: (m: Mode) => set('breachme.mode', m),
  getCrt: (): boolean => get('breachme.crt') === '1',
  setCrt: (on: boolean) => set('breachme.crt', on ? '1' : '0'),
};
