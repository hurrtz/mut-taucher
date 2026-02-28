import { createServer } from 'http';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, '..', 'dist');

const routes = [
  '/',
  '/ueber-mich',
  '/leistungen/einzeltherapie',
  '/leistungen/gruppentherapie',
  '/leistungen/erstgespraech',
  '/wissen/unser-nervensystem',
  '/wissen/adhs',
  '/wissen/alkohol-und-drogen',
  '/wissen/angst',
  '/wissen/depression',
  '/wissen/emotionsregulation',
  '/wissen/selbstwert',
  '/wissen/trauma',
  '/datenschutz',
  '/impressum',
  '/agb',
];

// Simple static file server for the dist folder
function startServer() {
  const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf-8');

  const server = createServer((req, res) => {
    const url = req.url.split('?')[0];
    const filePath = resolve(distDir, url === '/' ? 'index.html' : url.slice(1));

    try {
      const content = readFileSync(filePath);
      const ext = filePath.split('.').pop();
      const types = { html: 'text/html', js: 'application/javascript', css: 'text/css', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', svg: 'image/svg+xml', json: 'application/json', woff2: 'font/woff2' };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      res.end(content);
    } catch {
      // SPA fallback
      res.setHeader('Content-Type', 'text/html');
      res.end(indexHtml);
    }
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

async function prerender() {
  console.log('Starting prerender...');
  const { server, port } = await startServer();
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox'],
    channel: 'chrome',
  });

  for (const route of routes) {
    const page = await browser.newPage();
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });

    const html = await page.content();
    const filePath = route === '/'
      ? resolve(distDir, 'index.html')
      : resolve(distDir, route.slice(1), 'index.html');

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, `<!DOCTYPE html>${html.replace(/^<!DOCTYPE html>/i, '')}`);
    console.log(`  Prerendered: ${route}`);
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`Done! Prerendered ${routes.length} routes.`);
}

prerender().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
