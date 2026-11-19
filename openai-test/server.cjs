const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const {PUBLIC_FILES} = require('../scripts/build-review.cjs');
const allowed = new Set(['/index.html','/build-info.json', ...['app','companion-v2'].flatMap(d => PUBLIC_FILES.map(f => '/' + d + '/' + f))]);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpeg':'image/jpeg','.png':'image/png'};
function createServer({env = process.env, send = fetch} = {}) {
  let start = Date.now(), count = 0;
  return http.createServer(async (req,res) => {
    function reply(status, body, type = 'text/plain; charset=utf-8') {
      res.writeHead(status, {'Content-Type':type, 'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(body);
    }
    try {
      const route = new URL(req.url,'http://local').pathname;
      if (route === '/healthz') return reply(200,'OK');
      // Once a paid key is configured, protect both the interface and provider calls.
      if (env.OPENAI_API_KEY && !env.TEST_PASSWORD) return reply(503,'Set TEST_PASSWORD in Render to enable this private test.');
      if (env.TEST_PASSWORD) {
        const expected = Buffer.from('Basic ' + Buffer.from('tester:' + env.TEST_PASSWORD).toString('base64'));
        const actual = Buffer.from(req.headers.authorization || '');
        if (expected.length !== actual.length || !crypto.timingSafeEqual(expected,actual)) {
          res.setHeader('WWW-Authenticate','Basic realm="Momentum OpenAI test"');
          return reply(401,'Tester sign-in required');
        }
      }
      if (route === '/api' && req.method === 'POST') {
        if (!env.OPENAI_API_KEY) return reply(503,'OpenAI key has not been configured.');
        if (req.headers['sec-fetch-site'] === 'cross-site' || req.headers['content-type']?.split(';')[0] !== 'application/json') return reply(403,'Unsupported request');
        const parts = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 256000) return reply(413,'Conversation too large');
          parts.push(chunk);
        }
        let input;
        try { input = JSON.parse(Buffer.concat(parts)); } catch { return reply(400,'Invalid JSON'); }
        if (!Array.isArray(input?.messages) || !input.messages.length || input.messages.length > 100 ||
            input.messages.some(m => !m || !['user','assistant'].includes(m.role) || typeof m.content !== 'string') ||
            (input.system != null && typeof input.system !== 'string')) return reply(400,'Invalid conversation');
        if (Date.now() - start >= 60000) {start = Date.now(); count = 0;}
        if (++count > 30) return reply(429,'Please retry shortly');
        const payload = {model:'gpt-4.1-mini', store:false, messages:[...(input.system ? [{role:'system',content:input.system}] : []), ...input.messages],
          max_completion_tokens:Math.min(1600, Math.max(16, Number(input.max_tokens) || 900))};
        if (input.output_config) payload.response_format = {type:'json_object'};
        const upstream = await send('https://api.openai.com/v1/chat/completions', {
          method:'POST', headers:{Authorization:'Bearer ' + env.OPENAI_API_KEY,'Content-Type':'application/json'},
          body:JSON.stringify(payload), signal:AbortSignal.timeout(22000)
        });
        if (!upstream.ok) return reply(upstream.status === 429 ? 429 : 502,'OpenAI request failed');
        const data = await upstream.json(), choice = data.choices?.[0];
        if (typeof choice?.message?.content !== 'string') return reply(502,'Empty provider reply');
        return reply(200,JSON.stringify({content:[{type:'text',text:choice.message.content}],stop_reason:choice.finish_reason === 'length' ? 'max_tokens':'end_turn',
          usage:{input_tokens:data.usage?.prompt_tokens,output_tokens:data.usage?.completion_tokens}}),'application/json');
      }
      const file = route.endsWith('/') ? route + 'index.html' : route;
      if (!allowed.has(file) || !['GET','HEAD'].includes(req.method)) return reply(404,'Not found');
      reply(200, await fs.readFile(path.join(__dirname,'../dist',file)),types[path.extname(file)]);
    } catch { if (!res.headersSent) reply(502,'Service temporarily unavailable'); }
  });
}
if (require.main === module) createServer().listen(Number(process.env.PORT || 8080),'0.0.0.0');
module.exports = {createServer};
