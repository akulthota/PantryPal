import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev-plugin',
    configureServer(server) {
      // Inject all .env variables into process.env for local API functions
      const env = loadEnv('development', process.cwd(), '');
      Object.assign(process.env, env);

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) {
          return next();
        }

        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const endpointName = urlObj.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
          const filePath = path.resolve(process.cwd(), 'api', `${endpointName}.js`);

          if (!fs.existsSync(filePath)) {
            return next();
          }

          // Parse incoming request body for POST/PUT/PATCH
          let body = {};
          if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
            const chunks = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            const rawBody = Buffer.concat(chunks).toString('utf-8');
            if (rawBody) {
              try {
                body = JSON.parse(rawBody);
              } catch {
                body = rawBody;
              }
            }
          }

          req.body = body;
          req.query = Object.fromEntries(urlObj.searchParams.entries());

          // Decorate res with Vercel/Express helper functions
          res.status = function (statusCode) {
            res.statusCode = statusCode;
            return res;
          };
          res.json = function (data) {
            if (!res.getHeader('Content-Type')) {
              res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
            return res;
          };

          const fileUrl = pathToFileURL(filePath).href;
          const mod = await import(`${fileUrl}?t=${Date.now()}`);
          const handler = mod.default || mod;
          await handler(req, res);
        } catch (err) {
          console.error(`Error handling ${req.url}:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), vercelApiDevPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true
  }
});

