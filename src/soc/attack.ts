/**
 * Command → MITRE ATT&CK mapping and the analyst notes shown when an alert
 * is expanded. Notes are written in first person (Hariharan's voice).
 * Edit freely — this is where the blue-team thinking lives.
 */
import type { Severity } from '../core/state';

export interface Detection {
  technique: string;
  name: string;
  tactic: string;
  severity: Severity;
  /** One-liner on the alert card. `{arg}` is replaced with the command argument. */
  description: string;
  note: string;
  query: string;
}

export type DetectionKey =
  | 'help' | 'whoami' | 'scan' | 'enum' | 'exploit' | 'solve' | 'fail' | 'skip'
  | 'cat' | 'passwd' | 'ls' | 'hidden' | 'cd' | 'hint' | 'sudo' | 'report'
  | 'clear' | 'history' | 'exit' | 'crt' | 'unknown' | 'flag';

export const detections: Record<DetectionKey, Detection> = {
  help: {
    technique: 'T1082', name: 'System Information Discovery', tactic: 'Discovery', severity: 'info',
    description: 'Interactive user listing available commands',
    note: 'On its own this is noise. I log it for context: it tells me the session is interactive and the user is new to the box, which matters when I build the timeline later.',
    query: 'index=linux sourcetype=bash_history cmd IN ("help","man *","--help")\n| stats count by user, host',
  },
  whoami: {
    technique: 'T1033', name: 'System Owner/User Discovery', tactic: 'Discovery', severity: 'info',
    description: 'Identity check — first thing an attacker runs after landing',
    note: 'whoami by itself is benign, but whoami from a web-server account (www-data, apache) is a strong sign of a webshell. I alert on the parent process, not the command.',
    query: 'title: whoami from web server\nlogsource: { category: process_creation, product: linux }\ndetection:\n  sel: { Image|endswith: /whoami, ParentImage|endswith: [/nginx, /apache2, /php-fpm] }\n  condition: sel\nlevel: high',
  },
  scan: {
    technique: 'T1046', name: 'Network Service Discovery', tactic: 'Discovery', severity: 'medium',
    description: 'Port sweep across 5 services from 203.0.113.x (simulated)',
    note: 'A port scan is reconnaissance, not compromise. I would correlate it: one source touching many ports in a short window, then watch that IP closely for the next hour.',
    query: 'index=firewall action=* \n| bin _time span=1m\n| stats dc(dest_port) AS ports BY src_ip, _time\n| where ports > 20',
  },
  enum: {
    technique: 'T1087', name: 'Account Discovery', tactic: 'Discovery', severity: 'low',
    description: 'Enumerating resources behind port {arg}',
    note: 'Enumeration after a scan means the attacker found something interesting. This is where I raise the priority on the source and start building a timeline.',
    query: 'index=web uri_path IN ("/api/users*","/admin*","/.git*") status IN (200,401,403)\n| stats count values(uri_path) BY src_ip',
  },
  exploit: {
    technique: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', severity: 'high',
    description: 'Exploit attempt against {arg}',
    note: 'Initial access on an internet-facing service. First response: check WAF/app logs for payload patterns (quotes, UNION, ../, ${jndi:), confirm whether the request got a 200, and isolate the host if it did.',
    query: 'index=web (uri_query="*UNION*SELECT*" OR uri_query="*\' OR *" OR uri_query="*../*")\n| table _time src_ip uri_path uri_query status',
  },
  solve: {
    technique: 'T1078', name: 'Valid Accounts', tactic: 'Persistence', severity: 'high',
    description: 'ACCESS GRANTED — {arg} compromised',
    note: 'The scariest alerts look like normal logins. After a successful exploit I look for a new session from the same IP using legitimate credentials, especially at odd hours or from new geographies.',
    query: 'index=auth action=success \n| iplocation src_ip\n| stats dc(Country) AS countries values(Country) BY user\n| where countries > 1',
  },
  fail: {
    technique: 'T1110', name: 'Brute Force', tactic: 'Credential Access', severity: 'low',
    description: 'Failed attempt against {arg}',
    note: 'One failure is a typo. I threshold on rate and count per source, and I alert hardest on a success that comes right after a burst of failures.',
    query: 'index=auth action=failure\n| stats count BY src_ip, user\n| where count > 10',
  },
  skip: {
    technique: 'T1211', name: 'Exploitation for Defense Evasion', tactic: 'Defense Evasion', severity: 'medium',
    description: 'Control bypassed on {arg} (skip used)',
    note: 'Skipping the challenge is the site equivalent of a logic flaw that skips an auth check. These do not trip signature rules, so I rely on "impossible sequence" detections: reaching step 3 without step 2.',
    query: 'index=web\n| transaction session_id\n| search NOT uri_path="/login" uri_path="/account*"',
  },
  cat: {
    technique: 'T1005', name: 'Data from Local System', tactic: 'Collection', severity: 'medium',
    description: 'File read: {arg}',
    note: 'Collection means the attacker is now after data. I watch for sensitive paths being read by unusual processes, and for reads followed by outbound connections (staging for exfil).',
    query: 'index=linux sourcetype=auditd type=PATH name IN ("/etc/*","/home/*/.ssh/*","*.env")\n| stats count BY exe, name',
  },
  passwd: {
    technique: 'T1003.008', name: 'OS Credential Dumping: /etc/passwd and /etc/shadow', tactic: 'Credential Access', severity: 'high',
    description: 'Credential file read: /etc/passwd',
    note: '/etc/passwd is world-readable, so the read alone is low value. /etc/shadow is the real target. I alert on any read of shadow outside of login, passwd and PAM.',
    query: 'title: Shadow file read\nlogsource: { product: linux, service: auditd }\ndetection:\n  sel: { type: PATH, name: /etc/shadow }\n  filter: { exe: [/usr/bin/passwd, /usr/sbin/unix_chkpwd] }\n  condition: sel and not filter\nlevel: high',
  },
  ls: {
    technique: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery', severity: 'low',
    description: 'Directory listing: {arg}',
    note: 'Low signal by itself. Useful as context in a timeline: what did they look at before they touched something?',
    query: 'index=linux sourcetype=bash_history cmd="ls*" | stats count BY user',
  },
  hidden: {
    technique: 'T1564.001', name: 'Hide Artifacts: Hidden Files and Directories', tactic: 'Defense Evasion', severity: 'medium',
    description: 'Hidden file discovered: .flag',
    note: 'Attackers drop dot-files to hide tools. In an investigation I list new hidden files in /tmp, /dev/shm and home directories created in the incident window.',
    query: 'find / -xdev -name ".*" -newermt "2026-11-21 09:00" \\( -path /tmp/* -o -path /dev/shm/* -o -path /home/* \\) 2>/dev/null',
  },
  flag: {
    technique: 'T1005', name: 'Data from Local System', tactic: 'Collection', severity: 'medium',
    description: 'Hidden flag file read',
    note: 'Curiosity is the best trait an analyst can have. Most real findings come from looking at the thing everyone else scrolled past.',
    query: 'index=linux sourcetype=auditd type=PATH name="*/.*" | stats count BY name, exe',
  },
  cd: {
    technique: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery', severity: 'info',
    description: 'Changed directory: {arg}',
    note: 'Navigation is context, not an alert. I keep it at info so it shows in the timeline without paging anyone.',
    query: 'index=linux sourcetype=bash_history cmd="cd *" | table _time user cmd',
  },
  hint: {
    technique: 'T1592', name: 'Gather Victim Host Information', tactic: 'Reconnaissance', severity: 'info',
    description: 'Attacker requested intel on current target',
    note: 'Attackers read your public docs, job ads and GitHub before they attack. Reducing what you leak (version banners, stack traces) raises their cost.',
    query: 'index=web status=500 | stats count BY uri_path | sort -count',
  },
  sudo: {
    technique: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', severity: 'critical',
    description: 'sudo invoked: {arg}',
    note: 'Privilege escalation is where I want the fastest response. I alert on sudo by users outside the admin group, on sudo -l right after login, and on any sudo run by a service account.',
    query: 'title: Sudo by non-admin\nlogsource: { product: linux, service: sudo }\ndetection:\n  sel: { USER|not: [root] }\n  filter: { user_groups|contains: wheel }\n  condition: sel and not filter\nlevel: critical',
  },
  report: {
    technique: 'T1213', name: 'Data from Information Repositories', tactic: 'Collection', severity: 'medium',
    description: 'Incident report generated',
    note: 'A good report is half the job. Timeline, scope, impact, and a clear recommendation, written so a manager can act on it in two minutes.',
    query: '| tstats count WHERE index=* BY _time span=1h, sourcetype',
  },
  clear: {
    technique: 'T1070.003', name: 'Indicator Removal: Clear Command History', tactic: 'Defense Evasion', severity: 'medium',
    description: 'Terminal cleared — attacker tidying up',
    note: 'Clearing a screen is harmless, but history -c, unset HISTFILE or truncating ~/.bash_history is not. Ship shell history to the SIEM in real time so there is nothing left to clear.',
    query: 'index=linux (cmd="history -c" OR cmd="*unset HISTFILE*" OR cmd="*> ~/.bash_history*")',
  },
  history: {
    technique: 'T1552.003', name: 'Unsecured Credentials: Shell History', tactic: 'Credential Access', severity: 'low',
    description: 'Shell history read',
    note: 'People paste passwords into terminals. I grep history files for secrets as part of hardening, before an attacker does.',
    query: 'index=linux sourcetype=bash_history (cmd="*password=*" OR cmd="*-p *" OR cmd="*token*")',
  },
  exit: {
    technique: 'T1070', name: 'Indicator Removal', tactic: 'Defense Evasion', severity: 'low',
    description: 'Attacker attempted to disconnect',
    note: 'An attacker leaving is not the end of the incident. I check for persistence: new cron jobs, SSH keys, systemd units and accounts created during the session.',
    query: 'index=linux (path="/etc/cron*" OR path="*/.ssh/authorized_keys" OR path="/etc/systemd/system/*") action=modified',
  },
  crt: {
    technique: 'T1036', name: 'Masquerading', tactic: 'Defense Evasion', severity: 'info',
    description: 'Display mode changed (CRT)',
    note: 'Cosmetic here. In the real world, masquerading is a process named svchost.exe running from the wrong folder. I check path and signer, not just the name.',
    query: 'index=win EventCode=4688 New_Process_Name="*svchost.exe" NOT New_Process_Name="C:\\\\Windows\\\\System32\\\\*"',
  },
  unknown: {
    technique: 'T1059.004', name: 'Command and Scripting Interpreter: Unix Shell', tactic: 'Execution', severity: 'low',
    description: 'Unrecognised command: {arg}',
    note: 'Typos and failed commands are useful: an attacker fumbling with tools that are not installed is visible in shell logs long before they succeed.',
    query: 'index=linux sourcetype=bash_history "command not found" | stats count BY user, host',
  },
};
