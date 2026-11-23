/**
 * ★ ALL SITE CONTENT LIVES HERE ★
 *
 * Edit this file to update projects, experience, certs, skills and challenges.
 * The shape is documented in ./schema.ts — if you make a typo, `npm run build`
 * tells you exactly where.
 *
 * Search for "TODO" to find placeholders that still need your input.
 */
import type { Portfolio } from './schema';

export const portfolio: Portfolio = {
  meta: {
    siteTitle: 'Breach Me — Hariharan (hari.sec) · Cybersecurity Portfolio',
    description:
      'Hariharan (hari.sec): cybersecurity student in Melbourne targeting SOC analyst and pentester roles. Hack the portfolio in a live terminal while a SOC dashboard detects you — or open the one-page recruiter view.',
    // Deployed site URL (no trailing slash).
    url: 'https://hariharan2k03.github.io/portfolio',
  },

  person: {
    name: 'Hariharan',
    handle: 'hari.sec',
    tagline:
      'A cybersecurity portfolio that thinks like an attacker, defends like a SOC analyst, and builds for the future.',
    level: 'Master of Cyber Security student',
    targetRoles: ['SOC Analyst', 'Penetration Tester', 'Computer Engineer'],
    location: 'Melbourne, Australia',
    summary:
      'Master of Cyber Security student at RMIT University with a background in Electronics and Computer Engineering (B.Tech, VIT Chennai). I build security into software from the start: hash-chained, signed audit logs, AES-256-GCM encrypted backups, and CI pipelines that catch vulnerable dependencies before they ship. I understand AI and machine learning well and want to grow where AI and security meet. Looking for SOC analyst and penetration testing roles where I can detect, investigate and break things responsibly.',
    // Numbers below come straight from the project outcomes.
    stats: [
      { value: 150, suffix: '+', label: 'security tests written (e-voting)' },
      { value: 146, label: 'automated Jest tests (MyOrbit)' },
      { value: 77.03, decimals: 2, suffix: '%', label: 'speaker-independent accuracy' },
      { value: 4, label: 'vulnerable dependencies caught in CI' },
    ],
    taglines: [
      'Master of Cyber Security @ RMIT University',
      'B.Tech Electronics & Computer Engineering @ VIT Chennai',
      'Builds tamper-evident, signed audit systems',
      'Applied cryptography · Secure SDLC · OWASP',
      'Privacy-first engineer: data stays on the device',
    ],
    interests: [
      'Security operations and detection engineering (Sigma, Splunk SPL)',
      'Penetration testing and web application security (OWASP Top 10)',
      'Applied cryptography and secure software design',
      'Privacy-first engineering: keeping personal data on the device',
    ],
    whoami: [
      'uid=1337(hari.sec) gid=1337(defenders) groups=1337(defenders),31337(red-team)',
      '',
      'Name ........ Hariharan',
      'Role ........ Cybersecurity student',
      'Base ........ Melbourne, Australia',
      'Study ....... Master of Cyber Security @ RMIT University',
      'Background .. B.Tech Electronics & Computer Engineering, VIT Chennai',
      'Currently ... building signed audit logs and encrypting things for fun',
      '',
      'Fun fact: I open and close a busy CBD store, so I already know',
      'that physical access control starts with locking the door.',
    ],
    links: {
      github: 'https://github.com/hariharan2k03',
      linkedin: 'https://www.linkedin.com/in/gvhariharan',
      email: 'gvhariharan03@gmail.com',
      // Phone intentionally not published: scrapers harvest numbers from
      // portfolios. It is on the résumé PDF. To show it, add
      // phone: '04xx xxx xxx' and set showPhone: true.
      showPhone: false,
    },
    resume: 'resume.pdf', // public/resume.pdf — replace the file to update it
    photo: 'profile-3.jpg', // in /public — swap the file to change your portrait
  },

  services: [
    { port: 22, proto: 'ssh', section: 'about', banner: 'OpenSSH 9.6 (hari.sec bio daemon)' },
    { port: 443, proto: 'https', section: 'projects', banner: 'nginx 1.27 — 4 vhosts' },
    {
      port: 3306,
      proto: 'mysql',
      section: 'experience',
      banner: 'MySQL 8.0 — employment_history',
      challenge: {
        type: 'logTriage',
        title: 'Auth log triage',
        prompt: 'The experience DB sits behind this auth log. Which line is the attacker?',
        lines: [
          'Nov 21 09:02:11 db01 sshd[2211]: Accepted publickey for hari from 10.0.4.12 port 51022',
          'Nov 21 09:15:40 db01 sudo: hari : TTY=pts/0 ; PWD=/home/hari ; COMMAND=/usr/bin/apt update',
          'Nov 21 09:31:07 db01 sshd[2390]: Failed password for invalid user admin from 198.51.100.23 port 40112 (attempt 47 in 60s)',
          'Nov 21 09:31:55 db01 CRON[2402]: (root) CMD (/usr/local/bin/backup.sh)',
          'Nov 21 09:40:18 db01 sshd[2455]: session closed for user hari',
        ],
        answer: 2,
        hints: [
          'Look for something that repeats far too fast for a human.',
          'An invalid username plus dozens of attempts per minute is a classic pattern.',
        ],
        explain:
          '47 failed logins in 60 s for a user that does not exist = password spraying / brute force (T1110). I would alert on >10 failures per source IP per minute.',
      },
    },
    {
      port: 8443,
      proto: 'tls',
      section: 'certifications',
      banner: 'Jetty 12 — /api/certs (JWT auth)',
      challenge: {
        type: 'decode',
        title: 'JWT payload decode',
        prompt: 'This token guards the certs API. Decode the payload: what is the "role" claim?',
        encoding: 'jwt',
        payload:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJoYXJpLnNlYyIsInJvbGUiOiJkZWZlbmRlciIsImNsZWFyYW5jZSI6ImJsdWUtdGVhbSIsImlhdCI6MTc2MzY4MzIwMH0.c2lnbmF0dXJlLW5vdC12ZXJpZmllZA',
        answer: 'defender',
        options: ['admin', 'defender', 'guest', 'root'],
        hints: [
          'A JWT is three base64url parts separated by dots. The middle one is the payload.',
          'Base64-decode the middle part and read the JSON.',
        ],
        explain:
          'JWT payloads are only encoded, not encrypted. Never put secrets in them, and always verify the signature server-side.',
      },
    },
    { port: 25, proto: 'smtp', section: 'contact', banner: 'Postfix — open relay to hari.sec (hiring only)' },
  ],

  projects: [
    {
      id: 'myorbit',
      title: 'MyOrbit: Privacy-First iOS App',
      kind: 'iOS App',
      icon: 'phone',
      role: 'Solo developer',
      problem:
        'Shift workers and students juggle shifts, pay, study and habits across many apps, and most of those apps send personal data to the cloud.',
      approach: [
        'Built an offline-first iPhone app for shifts, pay, study and habits.',
        'Encrypted backup and restore using AES-256-GCM with PBKDF2 key derivation.',
        'On-device AI assistant (Apple Foundation Models), so no personal data leaves the phone.',
        'SQLite schema with versioned migrations; native SwiftUI widgets and Siri actions.',
      ],
      tools: ['React Native', 'TypeScript', 'SQLite', 'SwiftUI', 'AES-256-GCM', 'PBKDF2', 'Jest'],
      outcomes: ['146 automated Jest tests', 'Zero personal data leaves the device', 'Encrypted, portable backups'],
      challenges: [
        'Offering an AI assistant without sending data to a server: used Apple Foundation Models so every prompt runs on the phone.',
        'Changing the database schema without losing anyone’s data: versioned SQLite migrations, each covered by automated tests.',
        'Reaching native iOS features from React Native: built SwiftUI home-screen widgets and Siri actions.',
      ],
      security: [
        'Backups use AES-256-GCM (authenticated encryption), so a tampered backup fails to decrypt instead of restoring bad data.',
        'The encryption key is derived from the user’s passphrase with PBKDF2 and is never stored.',
        'Offline-first by design: no server and no account means no cloud database to breach.',
      ],
      learned: [
        'Privacy is a design decision you make on day one, not a feature you bolt on later.',
        'Integrity matters as much as confidentiality: that is why GCM, not just encryption.',
      ],
      links: { github: 'https://github.com/hariharan2k03/MyOrbit' },
      screenshots: [], // TODO: add e.g. { src: 'projects/myorbit-1.webp', alt: 'MyOrbit home screen' }
      challenge: {
        type: 'decode',
        title: 'Base64 decode',
        prompt: 'A backup config leaked this string. Decode it: what is the access key?',
        encoding: 'base64',
        payload: 'YWNjZXNzX2tleT1QUklWQUNZ',
        answer: 'PRIVACY',
        options: ['SECRET', 'PRIVACY', 'BACKUP', 'ORBIT'],
        hints: [
          'Letters, digits and no padding problems: this is Base64.',
          'Decoded, it reads access_key=…',
        ],
        explain:
          'Base64 is encoding, not encryption. That is why MyOrbit backups use AES-256-GCM with a PBKDF2-derived key instead.',
      },
    },
    {
      id: 'evoting',
      title: 'Secure Electronic Voting Platform',
      kind: 'RMIT Project',
      icon: 'shield',
      role: 'Integrity & audit layer — RMIT, team of 5',
      problem:
        'An e-voting system must prove that no ballot or audit record was edited, deleted or reordered, and that no single admin can rig the result.',
      approach: [
        'Built a hash-chained, Ed25519-signed audit log that detects any edited, deleted or reordered entry.',
        'Dual-administrator signing workflow that locks the candidate list.',
        'Tamper-evident ballot ledger with anonymous hashed tracking codes.',
        'Signed results API that rebuilds the decryption key from 3 of 5 trustee key shares (Shamir).',
        'CI/CD security pipeline in GitHub Actions: pytest, Bandit, pip-audit; CSP and HSTS headers.',
      ],
      tools: ['Python', 'Flask', 'Ed25519', 'SHA-256', 'Shamir', 'Bandit', 'pip-audit', 'GitHub Actions'],
      outcomes: ['150+ security tests (tampering, forged signatures, malicious input)', 'CI caught 4 vulnerable dependencies', '3-of-5 threshold key recovery'],
      challenges: [
        'Detecting edited, deleted or reordered audit entries: every entry carries the hash of the previous one and an Ed25519 signature, so any change breaks the chain.',
        'Stopping a single rogue admin from changing the candidate list: two administrators must both sign before it locks.',
        'Publishing results without trusting one key holder: the decryption key is split with Shamir secret sharing, and any 3 of 5 trustees can rebuild it.',
      ],
      security: [
        'Threat model covered insider tampering, forged signatures, replayed or reordered records and malicious input.',
        'Shift-left pipeline: Bandit (SAST) and pip-audit (SCA) run on every push in GitHub Actions.',
        'Browser hardening with Content-Security-Policy and HSTS headers.',
        'Voter privacy through anonymous, hashed ballot tracking codes.',
      ],
      learned: [
        'Tamper-evidence is about detection: logs must be verifiable by someone other than the person who wrote them.',
        'Security tests (forged signatures, tampering) find bugs that ordinary functional tests never do.',
        'Working in a team of 5 meant agreeing on interfaces early, so the audit layer could plug into everyone else’s code.',
      ],
      links: { github: 'https://github.com/AbineshV/INTE2667-Assignment-3' },
      screenshots: [],
      challenge: {
        type: 'spotVuln',
        title: 'Spot the vuln',
        prompt: 'This Flask route looks up a voter. Click the vulnerable line.',
        language: 'python',
        code: [
          '@app.route("/voter")',
          'def voter():',
          '    code = request.args.get("code", "")',
          '    if not code.isascii():',
          '        abort(400)',
          '    sql = f"SELECT * FROM voters WHERE code = \'{code}\'"',
          '    row = db.execute(sql).fetchone()',
          '    return jsonify(dict(row)) if row else ("", 404)',
        ],
        answer: 5,
        hints: [
          'Follow the user input. Where does it meet the database?',
          'String formatting user input into SQL = injection. The fix is a parameterised query.',
        ],
        explain:
          "SQL injection: code=' OR '1'='1 dumps every voter. Fix: db.execute(\"... WHERE code = ?\", (code,)). Bandit flags this as B608.",
      },
    },
    {
      id: 'speech-emotion',
      title: 'Speech Emotion Recognition',
      kind: 'ML Project',
      icon: 'wave',
      role: 'B.Tech capstone — team of 3',
      problem:
        'Emotion classifiers often overfit to the speakers they were trained on and fail on new voices.',
      approach: [
        'Built an Xception-based CNN on multi-channel audio inputs (spectrogram, MFCCs, chroma).',
        'Applied data augmentation (noise, pitch shift, time stretch).',
        'Used GeM pooling to cope with varied acoustics.',
        'Evaluated speaker-independently with Leave-One-Speaker-Out.',
      ],
      tools: ['Python', 'Deep Learning', 'Xception CNN', 'MFCC', 'Data augmentation'],
      outcomes: ['77.03% speaker-independent accuracy (LOSO)', 'Above published baselines'],
      challenges: [
        'Models tend to memorise individual voices: evaluated with Leave-One-Speaker-Out, so every test speaker is completely unseen.',
        'Recordings vary in noise and pitch: added noise, pitch-shift and time-stretch augmentation, plus GeM pooling.',
        'Combining several audio views: fed spectrograms, MFCCs and chroma features to the CNN as separate input channels.',
      ],
      learned: [
        'An honest evaluation method matters more than a high headline number.',
        'The same discipline applies to security: tune a detection rule on one dataset, then test it on traffic it has never seen.',
      ],
      links: {}, // TODO: add github link if public
      screenshots: [],
      challenge: {
        type: 'hashId',
        title: 'Hash ID',
        prompt: 'The model weights ship with this checksum. What kind of hash is it?',
        hash: 'cc089620aab0f1d12d895c311629be63a44b5c4ad267077dc66f032a2a0a74de',
        options: ['MD5', 'SHA-1', 'SHA-256', 'bcrypt'],
        answer: 2,
        hints: [
          'Count the hex characters. Each one is 4 bits.',
          '64 hex chars × 4 bits = 256 bits.',
        ],
        explain:
          'MD5 = 32 hex chars, SHA-1 = 40, SHA-256 = 64, bcrypt starts with $2b$. Checksums like this let you detect tampered model files.',
      },
    },
    {
      id: 'eeg-bci',
      title: 'EEG Brain-Computer Interface',
      kind: 'Research',
      icon: 'brain',
      problem:
        'People with severe motor impairments need a non-invasive way to control a wheelchair.',
      approach: [
        'Designed a non-invasive BCI that classifies motor-imagery EEG signals to control a wheelchair.',
        'Preprocessed EEG with band-pass and notch filtering, wavelets and real-time ERP analysis.',
        'Built an ML pipeline on ERD/ERS band features with Random Forest.',
      ],
      tools: ['Python', 'MATLAB', 'Random Forest', 'Signal processing', 'Wavelets'],
      outcomes: ['76% task accuracy', 'Real-time ERP analysis'],
      challenges: [
        'EEG is noisy and full of artefacts (muscle movement, mains hum): band-pass and notch filters plus wavelet analysis cleaned the signal.',
        'Turning brain activity into commands: extracted ERD/ERS band-power features and classified them with a Random Forest.',
      ],
      learned: [
        'Separating real signal from noise is the core skill in signal processing, and the daily job of a SOC analyst.',
        'Human-in-the-loop systems need to fail safe: a wrong prediction must never move the wheelchair unexpectedly.',
      ],
      links: {}, // TODO: add github link if public
      screenshots: [],
      challenge: {
        type: 'phishOrLegit',
        title: 'Phish or legit?',
        prompt: 'The lab received this "dataset licence" email. Phish or legit?',
        headers: [
          ['From', '"EEG Data Portal" <noreply@eeg-data-portal.support-verify.ru>'],
          ['Reply-To', 'licence-team@gmail.com'],
          ['Return-Path', '<bounce@mailer-x91.biz>'],
          ['Subject', 'URGENT: dataset licence expires in 2 hours — re-enter credentials'],
          ['Authentication-Results', 'spf=fail; dkim=none; dmarc=fail'],
        ],
        answer: 'phish',
        hints: [
          'Check whether From, Reply-To and Return-Path agree.',
          'SPF fail + DMARC fail + urgency + a credential request = textbook phishing.',
        ],
        explain:
          'Mismatched From / Reply-To / Return-Path, failed SPF and DMARC, and an urgent credential request. Report it, block the sender domain, and hunt for anyone who clicked.',
      },
    },
  ],

  experience: [
    {
      org: 'Bharat Electronics Limited',
      title: 'Project Intern',
      location: 'Ghaziabad, India',
      start: 'Oct 2023',
      end: 'Dec 2023',
      bullets: [
        'Developed a dynamic desktop application in C++ and the Qt framework, with an improved user interface.',
        'Integrated multiple data sources using Qt frameworks so data flowed reliably through the application.',
        'Optimised the C++ code to improve performance and responsiveness.',
      ],
      skills: ['C++', 'Qt', 'Desktop applications', 'Data integration', 'Performance optimisation'],
      takeaway: 'Built software inside a defence electronics company, where reliability and careful handling of data are non-negotiable.',
    },
    {
      org: 'Infinigoal',
      title: 'IT and Digital Marketing Lead',
      location: 'Chennai, India',
      start: '2024',
      end: '2025',
      bullets: [
        'Worked on the IT side of the e-commerce platform, supporting the website and online systems.',
        'Led the digital marketing team: online campaigns, promotions and social media strategy.',
        'Worked with cross-functional teams to improve sales performance.',
      ],
      skills: ['E-commerce platforms', 'Website support', 'Digital marketing', 'Team leadership'],
      takeaway: 'Supporting a live e-commerce site showed me how online systems break in practice, and how to explain technical issues to non-technical teams.',
    },
    {
      // Part-time roles alongside the Master's, combined into one entry
      org: "Subway · Nando's",
      title: 'Part-time hospitality roles',
      location: 'Melbourne, VIC',
      start: 'Feb 2026',
      end: 'Present',
      secondary: true,
      bullets: [
        'Subway (Sandwich Artist, Exhibition St, Feb 2026 – Present): trusted to open and close the store, including cash reconciliation, securing the premises and following step-by-step procedures.',
        'Subway: communicate clearly with customers and teammates in a high-volume CBD store during peak hours.',
        "Nando's (Team Member, Caroline Springs, Oct 2026 – Present): work in a fast-paced, high-volume restaurant, staying calm under pressure and following food safety procedures.",
      ],
      skills: ['Opening & closing procedures', 'Cash reconciliation', 'Physical security', 'Working under pressure', 'Procedure compliance', 'Communication'],
      takeaway: 'Following a checklist exactly every time, and staying calm during a rush, is the same discipline as working through a SOC playbook during an incident.',
    },
  ],

  education: [
    {
      degree: 'Master of Cyber Security',
      school: 'RMIT University',
      location: 'Melbourne, VIC (City Campus)',
      start: '2026',
      end: 'Present',
      details: [
        'Two-year program. Focus areas: network and software security, cryptography, ethical hacking, penetration testing, risk management.',
        'Secure software development: built the integrity and audit layer of a secure e-voting platform (team of 5).',
        'Applied cryptography in practice: Ed25519 signatures, SHA-256 hash chains, Shamir secret sharing.',
      ],
    },
    {
      degree: 'B.Tech in Electronics and Computer Engineering',
      school: 'Vellore Institute of Technology (VIT)',
      location: 'Chennai, India',
      start: 'Sept 2021',
      end: 'July 2025',
      details: [
        'CGPA 7.70 / 10.',
        'Relevant coursework: networks, operating systems, data structures, embedded systems, signal processing, machine learning.',
        'Capstone: Speech Emotion Recognition with an Xception CNN, 77.03% speaker-independent accuracy (team of 3).',
        'Project: EEG brain-computer interface for wheelchair control, 76% task accuracy.',
      ],
    },
  ],

  // Add certifications here as you earn them, e.g.
  // { name: 'CompTIA Security+', issuer: 'CompTIA', status: 'in-progress' },
  certifications: [],

  skills: [
    {
      group: 'Security',
      items: ['Secure SDLC', 'Applied cryptography (Ed25519, SHA-256, AES-GCM, PBKDF2, Shamir)', 'SAST/SCA (Bandit, pip-audit)', 'OWASP (XSS, CSRF, SQL injection, CSP)'],
    },
    { group: 'Languages', items: ['Python', 'C', 'C++', 'Java', 'TypeScript', 'Swift', 'MATLAB', 'Embedded C', 'SQL'] },
    {
      group: 'Frameworks & Tools',
      items: ['Flask', 'SQLAlchemy', 'pytest', 'GitHub Actions', 'React Native', 'SwiftUI', 'Qt', 'SQLite', 'Jest', 'Git'],
    },
    { group: 'AI & Embedded', items: ['Machine learning', 'CNNs', 'Signal processing', 'Microcontrollers', 'Sensors', 'PCB design'] },
  ],

  easterEggs: {
    flag: 'flag{curiosity_is_a_security_control} — you looked where most people do not. Badge unlocked: Curious mind.',
    passwdJoke: [
      'root:x:0:0:nice try:/root:/bin/false',
      'hari:x:1337:1337:passwords live in a password manager, not here:/home/hari:/bin/zsh',
      'recruiter:x:1000:1000:the only account with hiring privileges:/home/recruiter:/bin/hire-me',
      '',
      '# /etc/shadow is where hashes would be. It is not readable. That is the point.',
    ],
  },
};
