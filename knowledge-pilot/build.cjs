const fs = require('node:fs');
const path = require('node:path');
const {buildReview} = require('../scripts/build-review.cjs');
const {output} = buildReview();
const feed = require('../benefits-updates.json');
const extra = require('./resources.json');
const approved = extra.filter(i=>i.status==='published');
const items = [...feed.items.map(i=>({...i,collection:'rights',nextReviewDue:new Date(Math.min(Date.parse(feed.nextReviewDue),Date.parse(i.checkedAt)+3*86400000)).toISOString()})), ...approved];
const ids = new Set();
for(const i of [...feed.items,...extra]) {
  if(ids.has(i.id) || !i.id || !i.he?.title || !i.en?.title || !i.he?.nextStep || !i.en?.nextStep ||
     !i.he?.summary || !i.en?.summary || !Number.isFinite(Date.parse(i.checkedAt)) ||
     !(/^https:\/\//.test(i.sourceUrl) || ['./skills-business.html','./my-journey.html'].includes(i.sourceUrl))) throw Error('Invalid knowledge entry '+i.id);
  ids.add(i.id);
}
fs.writeFileSync(path.join(output,'knowledge.json'), JSON.stringify({schemaVersion:1,reviewedAt:feed.reviewedAt,items}));
function replace(s,a,b){if(!s.includes(a)) throw Error('Missing build anchor: '+a); return s.replace(a,b);}
for(const dir of ['app','companion-v2']){
  const base=path.join(output,dir);
  for(const f of ['search.js','reader.js','catalog.html','editor.html','resources.json']) fs.copyFileSync(path.join(__dirname,f),path.join(base,f));
  const alter=(file,fn)=>{const target=path.join(base,file);fs.writeFileSync(target,fn(fs.readFileSync(target,'utf8')))};
  alter('service-worker.js',s=>replace(s,'const APP_FILES = [','const APP_FILES = ["../knowledge.json","./reader.js","./search.js","./catalog.html","./editor.html",'));
  alter('onboarding.js',s=>replace(s,"local('Welcome to Momentum','ברוכים הבאים למומנטום')","local('Momentum Knowledge Companion','מלווה הידע של מומנטום')"));
  for(const [file,he] of [['index.html',false],['indexH.html',true]]){
    alter(file,s=>{
      s=replace(s,'<button class="go" id="btnStart"',`<p><a href="./catalog.html?lang=${he?'he':'en'}" data-en="Browse the knowledge base" data-he="עיון במאגר הידע">${he?'עיון במאגר הידע':'Browse the knowledge base'}</a></p><button class="go" id="btnStart"`);
      s=replace(s,'<script src="./onboarding.js">','<script src="./search.js"></script><script src="./reader.js"></script><script src="./onboarding.js">');
      const start=s.indexOf('  if(window.MomentumBenefits &&',s.indexOf('async function askModel('));
      const end=s.indexOf('  DIAG.source',start);if(start<0||end<start)throw Error('Missing chat lookup');
      s=s.slice(0,start)+`  sys += "\\n"+await Knowledge.context(hist.at(-1)?.content || "", S.lang, S.activeTopic);
`+s.slice(end);
      if(dir==='companion-v2')s=replace(replace(s,'"https://momentum-proxy.onrender.com/api"','location.origin + "/api"'),'"claude-sonnet-4-6"','"gpt-4.1-mini"');
      return s;
    });
  }
  if(dir==='companion-v2')alter('ai-consent.js',s=>replace(s,"'Anthropic (Claude)'","'OpenAI'"));
}
