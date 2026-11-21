# Breach Me — hari.sec

An interactive cybersecurity portfolio. The site is a live "target server": you attack it from a terminal while a SOC dashboard detects you in real time and maps every move to MITRE ATT&CK. When you're done it writes an incident report of your visit, with my résumé attached as evidence.

Recruiters can skip all of that: **Recruiter view →** (top right, on every screen) opens a clean one-page résumé.

- Vite + vanilla TypeScript. No framework, no terminal library, no backend.
- ~27 KB gzipped JS, fonts self-hosted, zero third-party requests.
- Lighthouse 99–100 across performance, accessibility, best practices and SEO.
- Strict CSP (no `unsafe-inline`, no `eval`), SRI on every script and stylesheet, `security.txt`.
- No visitor data is collected. The "attacker IP" is always `203.0.113.x (simulated)`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173 (hot reload, no CSP)
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ at http://localhost:4173 (with CSP + SRI)
```

Requires Node 20.19+ (22 recommended).

## Edit content

**Everything lives in [`src/data/portfolio.ts`](src/data/portfolio.ts).** Projects, experience, certifications, skills, challenges, links and easter-egg text. The shape is documented in [`src/data/schema.ts`](src/data/schema.ts). If you mistype a field, `npm run build` fails and tells you where.

Search the file for `TODO` to find the remaining placeholders.

| What | Where |
| --- | --- |
| Résumé | Replace `public/resume.pdf` |
| Your photo (optional) | Add e.g. `public/profile.webp`, set `person.photo: 'profile.webp'` |
| Project screenshots | Add to `public/projects/`, list them in the project's `screenshots` |
| Phone number | Add `links.phone` and set `showPhone: true` (off by default on purpose) |
| Certifications | Edit `certifications`. Entries with `todo: true` are hidden from recruiter view |
| SOC analyst notes / ATT&CK mappings | [`src/soc/attack.ts`](src/soc/attack.ts) |
| Site URL (canonical, OG, JSON-LD) | `meta.url` in `portfolio.ts`, plus `public/robots.txt`, `public/sitemap.xml`, `public/.well-known/security.txt` |

### Add a project

Add an object to `projects` with a unique `id` (used in `exploit 443 <id>`, `cat projects/<id>.md`, `open <id>`) and a `challenge`. It appears automatically in `scan`, `enum 443`, chips, tab completion and the recruiter view.

### Add or change a challenge

A challenge is plain data. Pick one of the five types and fill in the fields:

```ts
challenge: {
  type: 'hashId',                 // logTriage | spotVuln | decode | phishOrLegit | hashId
  title: 'Hash ID',
  prompt: 'What kind of hash is this?',
  hash: '5f4dcc3b5aa765d61d8327deb882cf99',
  options: ['MD5', 'SHA-1', 'SHA-256', 'bcrypt'],
  answer: 0,                      // index into options
  hints: ['Count the hex characters.', '32 hex chars × 4 bits = 128 bits.'],
  explain: 'MD5 = 32 hex chars. Shown after solving.',
}
```

| Type | Extra fields | `answer` |
| --- | --- | --- |
| `logTriage` | `lines: string[]` | index of the malicious line |
| `spotVuln` | `language`, `code: string[]` | index of the vulnerable line |
| `decode` | `encoding: 'base64' \| 'rot13' \| 'jwt'`, `payload`, `options` | the keyword (case-insensitive; must be in `options`) |
| `phishOrLegit` | `headers: [name, value][]` | `'phish'` or `'legit'` |
| `hashId` | `hash`, `options` | index into `options` |

Every challenge can be answered by clicking, so mobile users never have to type. A wrong answer shows the next hint, and after 2 wrong answers a Skip button appears.

To generate a payload: `node -e "console.log(Buffer.from('secret=WORD').toString('base64'))"`.

To add a **new challenge type**: add an interface to the `Challenge` union in `schema.ts`, then a `case` in `renderBody()` in [`src/challenges/ChallengeHost.ts`](src/challenges/ChallengeHost.ts). TypeScript will flag the switch until you do.

## Project structure

```
src/
  data/        portfolio.ts (content) · schema.ts (types)
  core/        dom.ts (safe element builder) · state.ts (session + event bus) · storage.ts (localStorage wrapper)
  terminal/    Terminal.ts (input, history, tab-complete, boot) · commands.ts · filesystem.ts
  soc/         SocFeed.ts · attack.ts (ATT&CK + analyst notes) · detect.ts · worldmap.ts
  challenges/  ChallengeHost.ts (all 5 challenge types)
  report/      IncidentReport.ts
  recruiter/   RecruiterView.ts
  ui/          hero.ts (top bar, hero, footer) · Dialog.ts · icons.ts
  styles/      main.css · recruiter.css · print.css
scripts/       vite-plugin-sri.ts
public/        resume.pdf · og-image.png · favicon.svg · robots.txt · sitemap.xml · .well-known/security.txt
```

## Deploy

### Vercel (recommended: real security headers)

1. Push this folder to a GitHub repo.
2. In Vercel, choose **Add New → Project**, import the repo, and keep the defaults. `vercel.json` already sets the build command, output folder and headers.
3. Set `meta.url` in `portfolio.ts` (or a `SITE_URL` env var in Vercel) to your Vercel URL / custom domain.

`vercel.json` adds the headers a `<meta>` tag cannot: `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, and long-cache for hashed assets.

### GitHub Pages

1. Push to a repo named `portfolio` (any name works).
2. In the repo, go to **Settings → Pages → Source: GitHub Actions**.
3. Push to `main`. [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs `npm audit`, builds with `BASE_PATH=/<repo>/`, and deploys.

GitHub Pages cannot set custom response headers, so the site relies on the CSP `<meta>` tag. Clickjacking protection (`frame-ancestors`) and HSTS are only available on Vercel or behind a CDN.

### Build settings

| Env var | Default | Purpose |
| --- | --- | --- |
| `BASE_PATH` | `/` | URL prefix (`/portfolio/` for a GitHub project site) |
| `SITE_URL` | `meta.url` | Canonical / OG / JSON-LD URL |

## Regenerate the Open Graph image

`/?demo` plays a short scripted session and hides the hero. Capture it at 1600×840 and scale to 1200×630:

```bash
npm run build && npm run preview &
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --hide-scrollbars \
  --window-size=1600,840 --virtual-time-budget=6000 --screenshot=og-raw.png "http://localhost:4173/?demo"
sips -z 630 1200 og-raw.png --out public/og-image.png
```

## Security notes (practising what I preach)

- **CSP**: `default-src 'self'`, no `unsafe-inline`, no `unsafe-eval`. It's injected only into the production build, because the Vite dev server needs inline styles for hot reload.
- **No `innerHTML`** anywhere. All content goes through `h()` in `core/dom.ts`, which uses `textContent`. Links from data pass through `safeUrl()` (http, https, mailto and tel only).
- **SRI**: `scripts/vite-plugin-sri.ts` adds `sha384` integrity to every built script and stylesheet.
- **No tracking**: the only things stored are the view mode and the CRT preference, in `localStorage`, wrapped in try/catch.
- **Supply chain**: two runtime deps (font files only). CI fails on `npm audit` high-severity issues.

## Easter eggs

`ls -la` · `cat .flag` · `cat /etc/passwd` · `sudo hire-me` · `rm -rf /` · the Konami code (↑↑↓↓←→←→BA) toggles CRT mode.
