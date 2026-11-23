/**
 * Content schema for Breach Me.
 *
 * You never need to edit this file to change content — edit `portfolio.ts`.
 * This file only describes the shape so TypeScript can catch mistakes at build
 * time (a typo in a field name fails `npm run build` instead of breaking the site).
 *
 * All strings are rendered with textContent, never innerHTML, so it is safe to
 * put any characters (including < > &) in them.
 */

export type SectionId = 'about' | 'projects' | 'experience' | 'certifications' | 'contact';

export interface Portfolio {
  meta: {
    siteTitle: string;
    description: string;
    /** Canonical URL of the deployed site, no trailing slash. Used for OG/JSON-LD. */
    url: string;
  };
  person: Person;
  /** The five "ports" shown by `scan`. Order = display order. */
  services: Service[];
  projects: Project[];
  experience: Job[];
  education: Education[];
  certifications: Cert[];
  skills: SkillGroup[];
  easterEggs: {
    /** Shown by `cat .flag` after `ls -la`. */
    flag: string;
    /** Shown by `cat /etc/passwd`. */
    passwdJoke: string[];
  };
}

export interface Person {
  name: string;
  handle: string;
  /** One line under the big title. */
  tagline: string;
  level: string;
  targetRoles: string[];
  location: string;
  /** Recruiter-view summary paragraph. */
  summary: string;
  /** Headline numbers animated in recruiter view (count up on scroll). */
  stats?: { value: number; decimals?: number; suffix?: string; label: string }[];
  /** Phrases that rotate under your name in recruiter view. */
  taglines?: string[];
  /** Short "what I'm focused on / learning" list for About. */
  interests: string[];
  /** Lines printed by `whoami`. */
  whoami: string[];
  links: {
    github: string;
    linkedin: string;
    email: string;
    /** Optional. Only displayed when showPhone is true. */
    phone?: string;
    showPhone: boolean;
  };
  /** Path relative to /public, e.g. "resume.pdf". */
  resume: string;
  /** Path relative to /public. Leave empty to show the placeholder avatar. */
  photo: string;
  /** Optional separate (square) photo for the light recruiter view. A "-sm" copy is used on small screens. */
  recruiterPhoto?: string;
}

export interface Service {
  port: number;
  proto: string;
  section: SectionId;
  /** The nmap "VERSION" column. */
  banner: string;
  /**
   * Optional gate. If omitted the port is open after `enum`.
   * The projects port (443) never has one — each project has its own.
   */
  challenge?: Challenge;
}

export interface Project {
  /** Short id used in commands: `exploit 443 myorbit`, `cat projects/myorbit.md`. */
  id: string;
  title: string;
  /** Short label for the project card, e.g. "iOS App". */
  kind: string;
  /** Icon key for the card: phone | shield | wave | brain | code */
  icon: 'phone' | 'shield' | 'wave' | 'brain' | 'code';
  role?: string;
  problem: string;
  approach: string[];
  tools: string[];
  outcomes: string[];
  /** Hard parts and how they were solved. */
  challenges?: string[];
  /** The security angle: threats considered, controls built. */
  security?: string[];
  /** What I learned / would do next. */
  learned?: string[];
  links: { github?: string; writeup?: string; demo?: string };
  /** 0–2 screenshots. src is relative to /public. */
  screenshots: { src: string; alt: string }[];
  challenge: Challenge;
}

export interface Job {
  org: string;
  title: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
  /** Short label such as "Internship" or "Part-time", shown as a badge. */
  type?: string;
  /** Skills used, shown as tags. */
  skills?: string[];
  /** One line on why this role matters for security work. */
  takeaway?: string;
  /** true = listed under "Other experience" in recruiter view. */
  secondary?: boolean;
}

export interface Education {
  degree: string;
  school?: string;
  location?: string;
  start?: string;
  end?: string;
  details: string[];
}

export interface Cert {
  name: string;
  issuer: string;
  status: 'earned' | 'in-progress' | 'planned';
  date?: string;
  /** Placeholder entries: shown in the terminal as TODO, hidden from recruiter view. */
  todo?: boolean;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

/* ------------------------------------------------------------------ */
/* Challenges — a discriminated union on `type`.                        */
/* To add a challenge: add one object of one of these shapes to a        */
/* project's or service's `challenge` field. No component changes.       */
/* Every challenge: `prompt` (question), `hints` (shown one per wrong    */
/* answer and by the `hint` command), `explain` (shown after solving).   */
/* ------------------------------------------------------------------ */

interface ChallengeBase {
  title: string;
  prompt: string;
  hints: string[];
  explain: string;
}

/** Pick the malicious line. `answer` = 0-based index into `lines`. */
export interface LogTriageChallenge extends ChallengeBase {
  type: 'logTriage';
  lines: string[];
  answer: number;
}

/** Click the vulnerable line. `answer` = 0-based index into `code`. */
export interface SpotVulnChallenge extends ChallengeBase {
  type: 'spotVuln';
  language: string;
  code: string[];
  answer: number;
}

/** Decode `payload` and type the keyword. Answer compared case-insensitively. */
export interface DecodeChallenge extends ChallengeBase {
  type: 'decode';
  encoding: 'base64' | 'rot13' | 'jwt';
  payload: string;
  answer: string;
  /** Multiple-choice options so mobile users never have to type. Must include answer. */
  options: string[];
}

/** Judge an email header. */
export interface PhishChallenge extends ChallengeBase {
  type: 'phishOrLegit';
  headers: [string, string][];
  answer: 'phish' | 'legit';
}

/** Identify a hash type. `answer` = 0-based index into `options`. */
export interface HashIdChallenge extends ChallengeBase {
  type: 'hashId';
  hash: string;
  options: string[];
  answer: number;
}

export type Challenge =
  | LogTriageChallenge
  | SpotVulnChallenge
  | DecodeChallenge
  | PhishChallenge
  | HashIdChallenge;
