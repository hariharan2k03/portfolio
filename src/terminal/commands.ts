/**
 * Command registry. Every command raises exactly one SOC alert (or more for
 * chained events like solving a challenge) with a MITRE ATT&CK technique.
 */
import { h, link } from '../core/dom';
import { bus, session } from '../core/state';
import { portfolio } from '../data/portfolio';
import type { Service, SectionId } from '../data/schema';
import { detect } from '../soc/detect';
import { files, resolve } from './filesystem';
import type { Chip, Terminal } from './Terminal';
import {
  accessGranted,
  canSkip,
  hasActiveChallenge,
  nextHint,
  skipActive,
  startChallenge,
} from '../challenges/ChallengeHost';

export interface Ctx {
  term: Terminal;
  openCaseStudy: (id: string) => void;
  openReport: () => void;
  toggleCrt: () => boolean;
  setMode: (m: 'recruiter') => void;
}

const P = portfolio;
const byPort = (port: number): Service | undefined => P.services.find((s) => s.port === port);
const project = (id: string) => P.projects.find((p) => p.id.toLowerCase() === id.toLowerCase());

export const COMMANDS = [
  'help', 'whoami', 'scan', 'enum', 'exploit', 'cat', 'ls', 'cd', 'open', 'hint', 'skip',
  'sudo', 'report', 'clear', 'history', 'exit', 'crt', 'recruiter',
] as const;

const HELP: [string, string][] = [
  ['help', 'list commands'],
  ['whoami', 'who runs this box'],
  ['scan', 'discover open ports (sections)'],
  ['enum <port>', 'list what is behind a port'],
  ['exploit <port> [item]', 'start a mini challenge to unlock it'],
  ['ls [-la] / cd <dir>', 'browse unlocked files'],
  ['cat <file>', 'read a file, e.g. cat projects/myorbit.md'],
  ['open <project>', 'open an unlocked project case study'],
  ['hint / skip', 'help with the current challenge'],
  ['report', 'generate the incident report'],
  ['sudo hire-me', '¯\\_(ツ)_/¯'],
  ['recruiter', 'switch to the one-page recruiter view'],
  ['crt', 'toggle CRT scanlines'],
  ['clear, history, exit', 'the usual'],
];

/* ------------------------------------------------------------------ */

export function runCommand(raw: string, ctx: Ctx): void {
  const input = raw.trim();
  session.commands.push({ time: new Date(), input: input || '(empty)' });
  if (!input) return;
  const [cmd0, ...args] = input.split(/\s+/);
  const cmd = cmd0.toLowerCase();
  const arg = args.join(' ');
  const t = ctx.term;

  switch (cmd) {
    case 'help':
      detect('help', input);
      t.print('Available commands:', 'accent');
      HELP.forEach(([c, d]) => t.print(`  ${c.padEnd(24)}${d}`));
      t.print('');
      t.print('No typing needed — tap the suggested commands below the prompt.', 'dim');
      break;

    case 'whoami':
      detect('whoami', input);
      t.print(P.person.whoami);
      break;

    case 'scan':
    case 'nmap':
      detect('scan', input);
      scan(t);
      break;

    case 'enum':
      enumPort(arg, input, ctx);
      break;

    case 'exploit':
      exploit(args, input, ctx);
      break;

    case 'ls':
    case 'dir':
      ls(args, input, t);
      break;

    case 'cd':
      cd(arg, input, t);
      break;

    case 'cat':
    case 'less':
    case 'more':
      cat(arg, input, ctx);
      break;

    case 'open': {
      const pr = project(arg);
      detect('cat', input, arg || '—');
      if (!pr) t.print(`open: no project "${arg}". Try: enum 443`, 'err');
      else if (!session.unlockedProjects.has(pr.id)) t.print(`open: ${pr.id} is locked. Run: exploit 443 ${pr.id}`, 'warn');
      else ctx.openCaseStudy(pr.id);
      break;
    }

    case 'hint': {
      detect('hint', input);
      const hint = nextHint();
      if (hint) t.print(`💡 ${hint}`, 'warn');
      else t.print(`💡 ${generalHint()}`, 'warn');
      break;
    }

    case 'skip':
      // A successful skip raises its own alert inside skipActive()
      if (!hasActiveChallenge()) {
        detect('skip', input, 'nothing');
        t.print('Nothing to skip.', 'dim');
      } else if (!skipActive()) {
        detect('skip', input, 'denied');
        t.print('Skip unlocks after 2 attempts. Try "hint" first.', 'warn');
      }
      break;

    case 'sudo':
      detect('sudo', input, arg || '(none)');
      sudo(arg, t, ctx);
      break;

    case 'su':
      detect('sudo', input, 'su');
      t.print('su: Authentication failure. Have you tried asking nicely? (sudo hire-me)', 'err');
      break;

    case 'report':
      detect('report', input);
      t.print('Compiling incident report…', 'accent');
      ctx.openReport();
      break;

    case 'clear':
    case 'cls':
      detect('clear', input);
      t.clear();
      break;

    case 'history':
      detect('history', input);
      t.commandHistory.forEach((c, i) => t.print(`${String(i + 1).padStart(4)}  ${c}`));
      break;

    case 'exit':
    case 'logout':
    case 'quit':
      detect('exit', input);
      t.print('Connection to hari.sec closed.', 'dim');
      t.print('…just kidding. The SOC saw everything. Type "report" to read what they wrote about you.', 'warn');
      break;

    case 'crt': {
      detect('crt', input);
      const on = ctx.toggleCrt();
      t.print(`CRT mode ${on ? 'ON' : 'OFF'}.`, 'dim');
      break;
    }

    case 'recruiter':
      detect('help', input);
      ctx.setMode('recruiter');
      break;

    case 'rm':
      detect('unknown', input, cmd);
      t.print('rm: Permission denied. Evidence is immutable here — hash-chained, like my audit logs.', 'err');
      break;

    default:
      detect('unknown', input, cmd);
      unknown(cmd, t);
  }
  refreshChips(ctx);
}

/* ------------------------------------------------------------------ */

function scan(t: Terminal): void {
  session.scanned = true;
  t.print(`Starting Nmap 7.95 ( https://nmap.org ) against ${P.person.handle} (203.0.113.10 — simulated)`, 'dim');
  t.print('Host is up (0.0013s latency).', 'dim');
  t.print('PORT       STATE  SERVICE  SECTION          VERSION', 'accent');
  for (const s of P.services) {
    const extra = s.section === 'projects' ? ` [${P.projects.length}]` : '';
    const state = session.compromised.has(s.section) ? 'owned' : 'open ';
    t.print(
      `${`${s.port}/tcp`.padEnd(11)}${state}  ${s.proto.padEnd(9)}${(s.section + extra).padEnd(17)}${s.banner}`,
      session.compromised.has(s.section) ? 'ok' : 'out',
    );
  }
  t.print('');
  t.print('Nmap done: 1 IP address (1 host up). Next: enum <port>', 'dim');
}

function parsePort(arg: string): Service | undefined {
  const n = Number(arg.replace(/\/.*$/, ''));
  if (Number.isFinite(n)) return byPort(n);
  return P.services.find((s) => s.proto === arg.toLowerCase() || s.section === arg.toLowerCase());
}

function compromise(section: SectionId): void {
  if (session.compromised.has(section)) return;
  session.compromised.add(section);
  bus.emit('unlock', { section });
}

function enumPort(arg: string, input: string, ctx: Ctx): void {
  const t = ctx.term;
  const s = parsePort(arg);
  detect('enum', input, s ? `${s.port}/${s.proto}` : arg || '—');
  if (!s) {
    t.print(`enum: usage: enum <port>. Open ports: ${P.services.map((x) => x.port).join(', ')}`, 'err');
    return;
  }
  session.enumerated.add(s.port);
  t.print(`[+] Enumerating ${s.port}/${s.proto} (${s.section})…`, 'accent');
  switch (s.section) {
    case 'about':
      t.print('    Anonymous login allowed. Banner says:', 'dim');
      t.print(`    "${P.person.tagline}"`);
      t.print('    [+] about.txt is readable → cat about.txt', 'ok');
      compromise('about');
      break;
    case 'contact':
      t.print('    250-hari.sec ESMTP ready. VRFY enabled (oops).', 'dim');
      t.print(`    VRFY hari → 250 ${P.person.links.email}`);
      t.print('    [+] contact.txt is readable → cat contact.txt', 'ok');
      compromise('contact');
      break;
    case 'projects':
      t.print(`    ${P.projects.length} virtual hosts found:`, 'dim');
      P.projects.forEach((p) => {
        const owned = session.unlockedProjects.has(p.id);
        t.print(`    ${owned ? '[owned]' : '[locked]'} ${p.id.padEnd(16)} ${p.title}`, owned ? 'ok' : 'out');
      });
      t.print('    Next: exploit 443 <name>', 'dim');
      break;
    default:
      t.print(`    Service fingerprint: ${s.banner}`, 'dim');
      t.print(
        session.compromised.has(s.section)
          ? `    [owned] ${s.section} already unlocked.`
          : `    [locked] ${s.section} — protected. Next: exploit ${s.port}`,
        session.compromised.has(s.section) ? 'ok' : 'warn',
      );
  }
}

function exploit(args: string[], input: string, ctx: Ctx): void {
  const t = ctx.term;
  const s = parsePort(args[0] ?? '');
  if (!s) {
    detect('exploit', input, args[0] || '—');
    t.print('exploit: usage: exploit <port> [item]. Run scan to see ports.', 'err');
    return;
  }
  if (s.section === 'projects') {
    const id = args[1];
    if (!id) {
      detect('exploit', input, '443/https');
      t.print('exploit 443: pick a target vhost:', 'warn');
      P.projects.forEach((p) => t.print(`    exploit 443 ${p.id}`, 'dim'));
      return;
    }
    const pr = project(id);
    if (!pr) {
      detect('exploit', input, `443/${id}`);
      t.print(`exploit: no vhost "${id}". Try: enum 443`, 'err');
      return;
    }
    detect('exploit', input, `443/${pr.id}`);
    if (session.unlockedProjects.has(pr.id)) {
      t.print(`${pr.id} is already owned. Opening case study…`, 'ok');
      ctx.openCaseStudy(pr.id);
      return;
    }
    t.print(`[*] Launching exploit against ${pr.id}…`, 'accent');
    t.printNode(
      startChallenge(pr.challenge, `443/${pr.id}`, async (skipped) => {
        if (!skipped) detect('solve', 'exploit', pr.title);
        session.unlockedProjects.add(pr.id);
        compromise('projects');
        bus.emit('unlock', { section: 'projects', projectId: pr.id });
        await accessGranted(t.root, pr.title);
        t.print(`[+] ${pr.title} unlocked → projects/${pr.id}.md`, 'ok');
        refreshChips(ctx);
        ctx.openCaseStudy(pr.id);
        checkThreshold(ctx);
      }),
      true,
    );
    return;
  }

  detect('exploit', input, `${s.port}/${s.proto}`);
  if (session.compromised.has(s.section)) {
    t.print(`${s.section} is already owned.`, 'ok');
    return;
  }
  if (!s.challenge) {
    t.print(`${s.port}/${s.proto} is wide open — no exploit needed. Try: enum ${s.port}`, 'warn');
    return;
  }
  t.print(`[*] Launching exploit against ${s.port}/${s.proto}…`, 'accent');
  t.printNode(
    startChallenge(s.challenge, `${s.port}/${s.section}`, async (skipped) => {
      if (!skipped) detect('solve', 'exploit', s.section);
      compromise(s.section);
      await accessGranted(t.root, s.section);
      const file = s.section === 'experience' ? 'experience.log' : 'certs.txt';
      t.print(`[+] ${s.section} unlocked. Dumping ${file}:`, 'ok');
      const f = files().find((x) => x.path === file);
      if (f) t.print(f.read());
      refreshChips(ctx);
      checkThreshold(ctx);
    }),
    true,
  );
}

function checkThreshold(ctx: Ctx): void {
  if (session.compromised.size >= 3 && !session.reportShown) {
    ctx.term.print('');
    ctx.term.print('⚠ 3+ services compromised. The SOC has escalated this to an incident.', 'warn');
    ctx.term.print('  Type "report" (or tap it below) to read the incident report.', 'warn');
  }
}

function ls(args: string[], input: string, t: Terminal): void {
  const all = args.includes('-la') || args.includes('-a') || args.includes('-al');
  const target = args.find((a) => !a.startsWith('-'));
  if (all) detect('hidden', input);
  else detect('ls', input, target ?? t.cwd);
  const inProjects = t.cwd === '~/projects' || target?.replace(/\/$/, '') === 'projects';
  const list = files().filter((f) => (inProjects ? f.path.startsWith('projects/') : !f.path.includes('/')));
  if (!inProjects) t.print(`drwxr-xr-x  projects/   (${session.unlockedProjects.size}/${P.projects.length} unlocked)`, 'accent');
  if (all) t.print('drwxr-xr-x  ./  ../', 'dim');
  for (const f of list) {
    if (f.hidden && !all) continue;
    const name = f.path.replace(/^projects\//, '');
    if (f.unlocked()) t.print(`-rw-r--r--  ${name}`, f.hidden ? 'warn' : 'ok');
    else t.print(`----------  ${name.padEnd(22)} 🔒 locked → ${f.lockedHint}`, 'dim');
  }
  if (all) session.badges.add('Curious mind');
}

function cd(arg: string, input: string, t: Terminal): void {
  detect('cd', input, arg || '~');
  const a = arg.replace(/\/$/, '');
  if (!a || a === '~' || a === '..' || a === '/home/hari.sec') t.cwd = '~';
  else if (a === 'projects' || a === '~/projects') t.cwd = '~/projects';
  else if (a === '/' || a === '/etc' || a === '/root') {
    t.print(`cd: ${a}: Permission denied (nice try — this is a jail)`, 'err');
    return;
  } else {
    t.print(`cd: ${a}: No such directory`, 'err');
    return;
  }
  t.updatePrompt();
}

function cat(arg: string, input: string, ctx: Ctx): void {
  const t = ctx.term;
  if (!arg) {
    detect('cat', input);
    t.print('cat: missing file. Try: ls', 'err');
    return;
  }
  if (arg === '/etc/passwd') {
    detect('passwd', input);
    t.print(P.easterEggs.passwdJoke);
    return;
  }
  if (arg === '/etc/shadow') {
    detect('passwd', input);
    t.print('cat: /etc/shadow: Permission denied. (Good. That is how it should be.)', 'err');
    return;
  }
  const path = resolve(t.cwd, arg);
  const f = files().find((x) => x.path === path);
  if (path === '.flag') {
    detect('flag', input);
    session.badges.add('Curious mind');
    bus.emit('badge', 'Curious mind');
  } else detect('cat', input, path);
  if (!f) {
    t.print(`cat: ${arg}: No such file. Try: ls`, 'err');
    return;
  }
  if (!f.unlocked()) {
    t.print(`cat: ${arg}: Permission denied 🔒 — unlock it with: ${f.lockedHint}`, 'warn');
    return;
  }
  t.print(f.read());
}

function sudo(arg: string, t: Terminal, ctx: Ctx): void {
  if (arg.replace(/\s+/g, '') === 'hire-me' || arg === 'hire me') {
    session.badges.add('Root wannabe');
    compromise('contact');
    t.print('[sudo] password for visitor: ********', 'dim');
    t.print('✔ Privilege escalated to HIRING MANAGER. Opening secure channel…', 'ok');
    const { email, linkedin, github } = P.person.links;
    t.printNode(
      h(
        'div',
        { class: 'contact-card' },
        h('strong', {}, `Let's talk — ${P.person.name}`),
        h('div', {}, '✉ ', link(`mailto:${email}`, email)),
        h('div', {}, 'in ', link(linkedin, 'LinkedIn')),
        h('div', {}, '⌥ ', link(github, 'GitHub')),
        h('div', {}, '📄 ', link(import.meta.env.BASE_URL + P.person.resume, 'Download résumé (PDF)', { download: '' })),
      ),
    );
    void ctx;
    return;
  }
  t.print(`visitor is not in the sudoers file. This incident will be reported.`, 'err');
  t.print('(It already has been. Look right →) Psst: try "sudo hire-me".', 'dim');
}

const SUGGEST: Record<string, string> = {
  nmap: 'scan', ifconfig: 'whoami', id: 'whoami', pwd: 'ls', dir: 'ls', vim: 'cat', nano: 'cat',
  ssh: 'enum 22', mysql: 'exploit 3306', curl: 'enum 443', wget: 'enum 443', hack: 'scan', hire: 'sudo hire-me',
};

function unknown(cmd: string, t: Terminal): void {
  const quips = [
    `${cmd}: command not found. Bold move though.`,
    `${cmd}: command not found. The SOC logged that typo, by the way.`,
    `${cmd}: not installed on this box. Living off the land is harder than it looks.`,
  ];
  t.print(quips[cmd.length % quips.length], 'err');
  const guess = SUGGEST[cmd] ?? closest(cmd);
  t.print(guess ? `Did you mean "${guess}"? Or type "help".` : 'Type "help" or tap a suggestion below.', 'dim');
}

function closest(cmd: string): string | null {
  let best: string | null = null;
  let bestD = 3;
  for (const c of COMMANDS) {
    const d = lev(cmd, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function lev(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

function generalHint(): string {
  if (!session.scanned) return 'Start with recon: run "scan".';
  const notEnum = P.services.find((s) => !session.enumerated.has(s.port));
  if (notEnum) return `Port ${notEnum.port} has not been enumerated yet: "enum ${notEnum.port}".`;
  const locked = P.projects.find((p) => !session.unlockedProjects.has(p.id));
  if (locked) return `A project is still locked: "exploit 443 ${locked.id}".`;
  const svc = P.services.find((s) => s.challenge && !session.compromised.has(s.section));
  if (svc) return `Try "exploit ${svc.port}".`;
  return 'You have owned everything. Run "report", or look for hidden files with "ls -la".';
}

/* ---------------------- suggestion chips ---------------------- */

export function refreshChips(ctx: Ctx): void {
  const chips: Chip[] = [];
  const add = (command: string, label = command) => chips.push({ label, command });

  if (hasActiveChallenge()) {
    add('hint');
    if (canSkip()) add('skip');
  }
  if (!session.scanned && session.enumerated.size === 0) {
    add('help');
    add('whoami');
    add('scan');
  } else {
    // Report first once the incident threshold is hit
    if (session.compromised.size >= 3) add('report', '📋 report');
    // Next-best actions first: exploit what's been enumerated, then enumerate the rest
    if (session.enumerated.has(443))
      for (const p of P.projects) if (!session.unlockedProjects.has(p.id)) add(`exploit 443 ${p.id}`);
    for (const s of P.services)
      if (s.challenge && session.enumerated.has(s.port) && !session.compromised.has(s.section)) add(`exploit ${s.port}`, `exploit ${s.port} (${s.section})`);
    for (const s of P.services) if (!session.enumerated.has(s.port)) add(`enum ${s.port}`, `enum ${s.port} (${s.section})`);
    if (session.compromised.has('about')) add('cat about.txt');
    for (const p of P.projects) if (session.unlockedProjects.has(p.id)) add(`open ${p.id}`);
  }
  if (session.compromised.size >= 1) add('report');
  if (session.scanned) add('sudo hire-me');
  if (chips.length < 4) add('ls -la');
  // De-dupe and cap so the row stays scannable
  const seen = new Set<string>();
  ctx.term.setChips(chips.filter((c) => !seen.has(c.command) && seen.add(c.command)).slice(0, 7));
}

/* ---------------------- tab completion ---------------------- */

export function completer(term: Terminal) {
  return (partial: string): string[] => {
    const parts = partial.replace(/^\s+/, '').split(/\s+/);
    if (parts.length === 1) return COMMANDS.filter((c) => c.startsWith(parts[0].toLowerCase()));
    const [cmd, ...rest] = parts;
    const last = rest[rest.length - 1] ?? '';
    const base = [cmd, ...rest.slice(0, -1)].join(' ') + ' ';
    let pool: string[] = [];
    if (cmd === 'enum' || (cmd === 'exploit' && rest.length === 1)) pool = P.services.map((s) => String(s.port));
    else if (cmd === 'exploit' && rest.length === 2) pool = P.projects.map((p) => p.id);
    else if (cmd === 'open') pool = P.projects.map((p) => p.id);
    else if (cmd === 'cat')
      pool = files()
        .map((f) => (term.cwd === '~/projects' ? f.path.replace(/^projects\//, '') : f.path))
        .concat(['/etc/passwd']);
    else if (cmd === 'cd') pool = ['projects', '..', '~'];
    else if (cmd === 'sudo') pool = ['hire-me'];
    return pool.filter((x) => x.startsWith(last)).map((x) => base + x);
  };
}
