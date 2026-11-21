import { defineConfig, loadEnv, type Plugin } from 'vite';
import { sri } from './scripts/vite-plugin-sri';
import { portfolio } from './src/data/portfolio';

/**
 * Strict CSP, injected only into the production build. Everything is
 * self-hosted, so 'self' is all we need. No 'unsafe-inline', no 'unsafe-eval'.
 * frame-ancestors / HSTS cannot be set from a meta tag — see vercel.json.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function csp(): Plugin {
  return {
    name: 'breachme-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
    },
  };
}

function siteUrl(url: string): Plugin {
  return {
    name: 'breachme-site-url',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', url),
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    // GitHub Pages project sites live under /<repo>/ — set BASE_PATH=/breach-me/ there.
    base: env.BASE_PATH || '/',
    plugins: [csp(), siteUrl(env.SITE_URL || portfolio.meta.url), sri()],
    build: {
      target: 'es2022',
      cssCodeSplit: false,
      modulePreload: { polyfill: false },
      assetsInlineLimit: 0, // keep fonts as files (CSP font-src 'self', cacheable)
    },
  };
});
