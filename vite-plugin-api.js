// Plugin Vite (dev uniquement) : sert les fonctions `api/*.js` sur /api/* avec la
// même signature Web (Request → Response) que Vercel. En production, Vercel les
// déploie lui-même ; ce plugin n'est jamais inclus dans le build.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export function apiPlugin() {
  return {
    name: 'local-api',
    apply: 'serve',
    config(_, { mode }) {
      // Charge .env / .env.local (toutes les variables, pas seulement VITE_*) dans process.env.
      const env = loadEnv(mode, process.cwd(), '');
      for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();
        const name = req.url.slice(5).split('?')[0].replace(/\/$/, '');
        if (!name || name.startsWith('_') || !existsSync(path.resolve('api', `${name}.js`))) return next();

        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`);
          const handler = mod[req.method] || mod.default;
          if (!handler) {
            res.statusCode = 405;
            return res.end('Method Not Allowed');
          }
          const body = ['GET', 'HEAD'].includes(req.method) ? undefined : await readBody(req);
          const headers = {};
          for (const [k, v] of Object.entries(req.headers)) headers[k] = Array.isArray(v) ? v.join(', ') : v;
          const request = new Request(new URL(req.url, `http://${req.headers.host || 'localhost'}`), {
            method: req.method,
            headers,
            body,
          });

          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          if (!response.body) return res.end();
          const reader = response.body.getReader();
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        } catch (e) {
          console.error(`[api] ${req.method} ${req.url}`, e);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify({ error: 'Erreur serveur (dev)', detail: String(e?.message || e) }));
        }
      });
    },
  };
}
