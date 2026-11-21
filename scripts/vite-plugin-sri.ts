/**
 * Adds Subresource Integrity (sha384) to every built <script src> and
 * <link rel="stylesheet|modulepreload"> in index.html.
 */
import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

export function sri(): Plugin {
  return {
    name: 'breachme-sri',
    apply: 'build',
    enforce: 'post',
    generateBundle(_opts, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let src = String(html.source);
      const integrityOf = (url: string): string | null => {
        const file = url.replace(/^.*?assets\//, 'assets/');
        const chunk = bundle[file];
        if (!chunk) return null;
        const content = chunk.type === 'chunk' ? chunk.code : chunk.source;
        return 'sha384-' + createHash('sha384').update(content).digest('base64');
      };
      src = src.replace(/<(script|link)\b([^>]*?)\s(src|href)="([^"]+)"([^>]*)>/g, (tag, el, pre, attr, url, post) => {
        if (el === 'link' && !/rel="(stylesheet|modulepreload)"/.test(tag)) return tag;
        if (!url.includes('assets/') || tag.includes('integrity=')) return tag;
        const integrity = integrityOf(url);
        if (!integrity) return tag;
        const cross = tag.includes('crossorigin') ? '' : ' crossorigin="anonymous"';
        return `<${el}${pre} ${attr}="${url}" integrity="${integrity}"${cross}${post}>`;
      });
      html.source = src;
    },
  };
}
