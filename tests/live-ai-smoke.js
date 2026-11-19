/* Explicit opt-in network check using invented scenarios, no soldier data.
   npm run test:live (uses the configured provider and a small number of tokens). */
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 for(const lang of ['en','he']){
  const html=fs.readFileSync(path.join(__dirname,'..',lang==='he'?'indexH.html':'index.html'),'utf8');
  const dom=new JSDOM(html,{url:'https://6244abaman.github.io/transition-companion/',runScripts:'dangerously',virtualConsole:new VirtualConsole(),beforeParse(w){require('./browser-env').prepare(w);w.AbortController=AbortController;
   w.fetch=async(url,options)=>{const res=await fetch(url,{...options,headers:{...options.headers,Origin:'https://6244abaman.github.io'}});const cors=res.headers.get('access-control-allow-origin');assert.ok(cors==='*'||cors==='https://6244abaman.github.io','Proxy must allow the frontend origin');return res;};
  }});
  try{
   dom.window.eval('S.lang='+JSON.stringify(lang)+';S.messages=[{role:"user",text:'+JSON.stringify(lang==='he'?'סיימתי שירות סדיר ואני מתלבט בין עבודה ללימודים. עזרי לי לבחור צעד קטן להתחלה.':'I finished regular service and feel unsure whether to work or study. Help me choose a small first step.')+'}];');
   const reply=await dom.window.eval('askModel()');assert.ok(typeof reply.reply==='string'&&reply.reply.length>20);if(!dom.window.eval('DIAG.parsedOK'))console.log('Provider reply diagnostic:',dom.window.eval('DIAG.raw').slice(0,700));assert.equal(dom.window.eval('DIAG.parsedOK'),true);
   if(lang==='he')assert.match(reply.reply,/[א-ת]/);else assert.match(reply.reply,/[a-z]{4}/i);
   console.log('PASS live '+lang+': HTTP success, browser-origin CORS, structured JSON reply and language text');
  }finally{dom.window.close();}
 }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
