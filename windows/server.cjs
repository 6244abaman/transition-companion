'use strict';
// Local static app host: no external requests, credentials, accounts or sync service.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {randomBytes, timingSafeEqual} = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const PORT = 43127;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const TOKEN = randomBytes(32).toString('hex');
const STATE = path.join(ROOT, '.local', 'runtime.json');
const publicFiles = new Set([
  'index.html', 'indexH.html', 'my-journey.html', 'skills-business.html',
  'onboarding.css', 'onboarding.js', 'chat-history.js', 'companion-home.js', 'companion-home.css',
  'companion-plus.js', 'tools-plus.js', 'companion-plus.css', 'knowledge-base.js', 'knowledge-base-data.js', 'knowledge-base-full.json', 'journey-plus.js', 'journey-plus.css',
  'momentum-theme.css', 'benefits-updates.js', 'benefits-updates.css', 'benefits-updates.json',
  'ai-consent.js', 'response-schema.js', 'skills-source.js', 'companion-safety.js',
  'journey-store.js', 'journey-backup.js', 'journey-reminders.js', 'journey-rights.js',
  'journey-sync.js', 'journey-tools-ui.js', 'life-skills-ui.js', 'my-journey.js',
  'manifest.json', 'service-worker.js', 'apple-touch-icon.png', 'icon-192.png',
  'icon-512.png', 'companion-mentor.jpeg'
]);
const mime = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.txt':'text/plain', '.png':'image/png', '.jpeg':'image/jpeg', '.webmanifest':'application/manifest+json'};
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const send = (status, body, type='application/json; charset=utf-8') => {
    res.writeHead(status, {'Content-Type': type});
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };
  if (req.headers.host !== `127.0.0.1:${PORT}`) return send(403, {error:'Use the local address from Start.cmd.'});
  if (req.headers.origin && req.headers.origin !== ORIGIN) return send(403, {error:'Origin not allowed'});
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, ORIGIN).pathname); }
  catch { return send(400, {error:'Invalid path'}); }
  if (pathname === '/__local/health' && req.method === 'GET') {
    return send(200, {service:'transition-companion-local', version:1, pid:process.pid, root:ROOT});
  }
  if (pathname === '/__local/stop' && req.method === 'POST') {
    const provided = Buffer.from(req.headers['x-local-control'] || '');
    const expected = Buffer.from(TOKEN);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return send(403, {error:'Local control token required'});
    send(200, {stopping:true});
    shutdown();
    return;
  }
  if (!['GET','HEAD'].includes(req.method)) return send(405, {error:'Method not allowed'});
  const file = pathname === '/' ? 'indexH.html' : pathname === '/next/' ? 'next/index.html' : pathname.slice(1);
  const nextAsset = /^next\/(?:[a-zA-Z0-9_-]+\.(?:html|js|jpeg|webmanifest)|config\/system-prompt\.txt|data\/(?:[a-z-]+\.json|knowledge\/[a-z-]+\.json))$/.test(file);
  if ((!publicFiles.has(file) && !nextAsset) || file.includes('..') || file.includes('\\')) return send(404, {error:'Not found'});
  try {
    const bytes = await fs.promises.readFile(path.join(ROOT, file));
    const type = mime[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, {'Content-Type': type + (type.startsWith('text/') || type.includes('json') ? '; charset=utf-8' : ''), 'Content-Length':bytes.length});
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch { send(404, {error:'Not found'}); }
});
server.requestTimeout = 10000;
server.headersTimeout = 5000;
let stopping = false;
function shutdown() {
  if (stopping) return;
  stopping = true;
  server.close(() => {
    try { const state=JSON.parse(fs.readFileSync(STATE,'utf8')); if(state.pid===process.pid) fs.unlinkSync(STATE); } catch {}
    process.exit(0);
  });
  server.closeIdleConnections();
  setTimeout(() => server.closeAllConnections(), 1500).unref();
}
server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? 'Port 43127 is already in use. Stop the other application or Companion copy first.' : error.message); process.exitCode=1; });
server.listen(PORT, '127.0.0.1', () => {
  fs.mkdirSync(path.dirname(STATE), {recursive:true});
  fs.writeFileSync(STATE, JSON.stringify({pid:process.pid, token:TOKEN}), {mode:0o600});
  console.log(`Transition Companion ready at ${ORIGIN}/indexH.html`);
});
for (const signal of ['SIGINT','SIGTERM']) process.on(signal, shutdown);
