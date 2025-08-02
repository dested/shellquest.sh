import express from 'express';
import * as fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {apiRouter} from './server/apiRouter';
import {auth} from './server/auth';
import {toNodeHandler} from 'better-auth/node';
import {env} from './server/env';

const __dirname: string = path.dirname(fileURLToPath(import.meta.url));
const isTest = env.VITEST;
const isProd = env.NODE_ENV === 'production';
const root: string = process.cwd();

const resolve = (_path: string) => path.resolve(__dirname, _path);

const indexProd: string = isProd
  ? fs.readFileSync(resolve('../app/client/index.html'), 'utf-8')
  : '';

const createServer = async () => {
  const app = express();
  const server = http.createServer(app);

  /*const wss = new WebSocketServer({server, clientTracking: true});
  setupWebSocketHandlers(wss);*/

  let vite: any;

  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      root,
      logLevel: isTest ? 'error' : 'info',
      server: {
        middlewareMode: true,
        watch: {
          usePolling: true,
          interval: 100,
        },
      },
      appType: 'custom',
    });

    app.use(vite.middlewares);
  }

  if (isProd) {
    app.use((await import('compression')).default());

    app.use(
      (await import('serve-static')).default(resolve('../app/client/'), {
        index: false,
      }),
    );
  }

  // Mount Better Auth routes
  app.all('/api/auth/*', toNodeHandler(auth));

  // api routes - mount the tRPC router
  app.use('/api', apiRouter);


  app.get('/health', async (req, res) => {
    res.status(200).send();
  });
  // Add CORS headers for WebSocket connections
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;

      let template, render;

      if (!isProd) {
        template = fs.readFileSync(resolve('index.html'), 'utf8');
        template = await vite.transformIndexHtml(url, template);

        render = (await vite.ssrLoadModule('/src/entry-server.tsx')).default.render;
      } else {
        template = indexProd;

        render = (await import('./src/entry-server')).default.render;
      }

      const context: any = {};
      const appHtml = await render(req);
      const {helmet} = appHtml;

      if (context.url) return res.redirect(301, context.url);

      let html = template.replace('<!--app-html-->', appHtml.html);

      const helmetData = `
                ${helmet.title.toString()}
                ${helmet.meta.toString()}
                ${helmet.link.toString()}
                ${helmet.style.toString()}
            `;

      html = html.replace('<!--app-head-->', helmetData);
      html = html.replace('<!--app-scripts-->', helmet.script.toString());

      res.status(200).set({'Content-Type': 'text/html'}).end(html);
    } catch (e: any) {
      !isProd && vite.ssrFixStacktrace(e);
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return {app, server, vite};
};

if (!isTest) {
  createServer().then(({app, server}) => {
    const port = env.PORT;
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
}
