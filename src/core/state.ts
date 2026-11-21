/**
 * In-memory session state + a tiny typed event bus.
 * Nothing here leaves the browser tab or survives a reload.
 */
import type { SectionId } from '../data/schema';

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: number;
  time: Date;
  command: string;
  technique: string;
  name: string;
  tactic: string;
  severity: Severity;
  description: string;
  note: string;
  query: string;
}

export interface CommandRecord {
  time: Date;
  input: string;
}

type Events = {
  alert: Alert;
  unlock: { section: SectionId; projectId?: string };
  report: void;
  mode: 'hacker' | 'recruiter';
  badge: string;
  caseStudy: string;
  runCommand: string;
};

type Handler<T> = (payload: T) => void;
const handlers: Record<string, Handler<unknown>[]> = {};

export const bus = {
  on<K extends keyof Events>(ev: K, fn: Handler<Events[K]>): void {
    (handlers[ev] ??= []).push(fn as Handler<unknown>);
  },
  emit<K extends keyof Events>(ev: K, payload: Events[K]): void {
    handlers[ev]?.forEach((fn) => fn(payload));
  },
};

export const session = {
  start: new Date(),
  commands: [] as CommandRecord[],
  alerts: [] as Alert[],
  /** Sections whose port has been "compromised". */
  compromised: new Set<SectionId>(),
  /** Ports enumerated so far (needed before exploit). */
  enumerated: new Set<number>(),
  scanned: false,
  unlockedProjects: new Set<string>(),
  badges: new Set<string>(),
  skips: 0,
  failures: 0,
  hintsUsed: 0,
  reportShown: false,
};
