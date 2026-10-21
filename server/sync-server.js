'use strict';
// Ciphertext-only vault service. Node 24+, one persistent SQLite database.
const http = require('node:http');
const { createHash } = require('node:crypto');
const { mkdirSync } = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const MAX_BYTES = 2 * 1024 * 1024;
function validEnvelope(v) {
  return v && Object.keys(v).sort().join(',') === 'algorithm,ciphertext,format,iterations,iv,kdf,salt,version' &&
    v.format === 'momentum-journey-encrypted-v1' && v.version === 1 &&
    v.algorithm === 'AES-256-GCM' && v.kdf === 'PBKDF2-SHA256' && v.iterations === 250000 &&
    typeof v.salt === 'string' && /^[A-Za-z0-9+/]{22}==$/.test(v.salt) &&
    typeof v.iv === 'string' && /^[A-Za-z0-9+/]{16}$/.test(v.iv) &&
    typeof v.ciphertext === 'string' && v.ciphertext.length >= 24 &&
    v.ciphertext.length <= 1500000 && /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v.ciphertext);
}
function createService({ database = ':memory:', origins = [], maxVaults = 1000, rateLimit = 120, enrollmentCode = '', clock = Date.now } = {}) {
  const db = new DatabaseSync(database);
  db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS vaults (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, envelope TEXT NOT NULL, updated TEXT NOT NULL);');
  const read = db.prepare('SELECT revision, envelope, updated FROM vaults WHERE id = ?');
  const rates = new Map();
  function send(res, status, data) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(data)); }
  const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    // Never log request headers, capability tokens, bodies or vault IDs.
    const origin = req.headers.origin;
    if (origin && !origins.includes(origin)) return send(res, 403, {error:'Origin not allowed'});
    if (origin) { res.setHeader('Access-Control-Allow-Origin',origin); res.setHeader('Vary','Origin'); }
    res.setHeader('Access-Control-Expose-Headers','ETag');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods','GET,PUT,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type,If-Match,X-Enrollment-Code');
      res.writeHead(204); return res.end();
    }
    if (req.url === '/healthz' && req.method === 'GET') return send(res,200,{ok:true,service:'momentum-encrypted-sync',version:1});
    const now = clock(), ip = req.socket.remoteAddress;
    if (rates.size > 10000) { for (const [k,v] of rates) if (now-v.start >= 60000) rates.delete(k); }
    const rate = rates.get(ip);
    if (rate && now-rate.start < 60000) { if (++rate.count > rateLimit) return send(res,429,{error:'Try again later'}); }
    else rates.set(ip,{start:now,count:1});
    if (req.url !== '/v1/vault') return send(res,404,{error:'Not found'});
    const match = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
    if (!match) return send(res,401,{error:'A valid private connection code is required'});
    const id = createHash('sha256').update(match[1]).digest('hex');
    try {
      const current = read.get(id);
      const revision = current ? current.revision : 0;
      res.setHeader('ETag', '"'+revision+'"');
      if (req.method === 'GET') return current ? send(res,200,{revision,envelope:JSON.parse(current.envelope),updatedAt:current.updated}) : send(res,404,{error:'No saved profile'});
      if (!['PUT','DELETE'].includes(req.method)) return send(res,405,{error:'Method not allowed'});
      if (req.headers['if-match'] !== '"'+revision+'"') return send(res,409,{error:'Another device changed this profile. Download and review before saving.',revision});
      if (req.method === 'DELETE') {
        // Keep a revisioned tombstone so an older device cannot recreate deleted data.
        if (!current) return send(res,404,{error:'No saved profile'});
        db.prepare('UPDATE vaults SET revision = revision + 1, envelope = ?, updated = ? WHERE id = ? AND revision = ?').run('null',new Date(now).toISOString(),id,revision);
        res.setHeader('ETag','"'+(revision+1)+'"'); return send(res,200,{revision:revision+1,deleted:true});
      }
      if(!current && enrollmentCode && req.headers['x-enrollment-code']!==enrollmentCode) return send(res,403,{error:'A Momentum invitation is required to create an online copy'});
      if (!(req.headers['content-type']||'').startsWith('application/json')) return send(res,415,{error:'JSON required'});
      let size=0, chunks=[];
      for await (const chunk of req) { size += chunk.length; if(size>MAX_BYTES) { send(res,413,{error:'Profile too large'}); req.resume(); return; } chunks.push(chunk); }
      let value; try { value=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(res,400,{error:'Invalid JSON'}); }
      if (!validEnvelope(value)) return send(res,400,{error:'Only a valid encrypted profile is accepted'});
      const updated = new Date(now).toISOString();
      // Compare again at the write, after streaming the body. SQLite CAS is atomic.
      if (current) {
        const result = db.prepare('UPDATE vaults SET revision = revision + 1, envelope = ?, updated = ? WHERE id = ? AND revision = ?').run(JSON.stringify(value),updated,id,revision);
        if (!result.changes) return send(res,409,{error:'Profile changed during upload'});
      } else {
        if (db.prepare('SELECT COUNT(*) AS count FROM vaults').get().count >= maxVaults) return send(res,503,{error:'Service capacity reached'});
        const result=db.prepare('INSERT OR IGNORE INTO vaults VALUES (?,1,?,?)').run(id,JSON.stringify(value),updated);
        if(!result.changes) return send(res,409,{error:'Profile already created on another device'});
      }
      res.setHeader('ETag','"'+(revision+1)+'"'); send(res,200,{revision:revision+1,updatedAt:updated});
    } catch { if (!res.headersSent) send(res,500,{error:'Storage unavailable'}); else res.end(); }
  });
  server.requestTimeout=30000; server.headersTimeout=15000;
  server.on('close',()=>db.close());
  return server;
}
if(require.main===module) {
  const directory = process.env.SYNC_DATA_DIR || path.join(__dirname,'..','sync-data');
  mkdirSync(directory,{recursive:true,mode:0o700});
  const origins=(process.env.ALLOWED_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(!origins.length) throw new Error('Set ALLOWED_ORIGINS to the exact frontend origin(s) before starting');
  const enrollmentCode=process.env.SYNC_ENROLLMENT_CODE||'';
  if(enrollmentCode.length<24)throw new Error('Set a private SYNC_ENROLLMENT_CODE of at least 24 characters');
  const server=createService({database:path.join(directory,'vaults.sqlite'),origins,enrollmentCode});
  server.listen(Number(process.env.PORT)||3000,'0.0.0.0',()=>process.stdout.write('Encrypted sync service listening\n'));
  for(const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
}
module.exports={createService,validEnvelope};
