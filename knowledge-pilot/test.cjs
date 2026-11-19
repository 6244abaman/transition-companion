const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom');
const search=require('./search.js');
const items=require('../dist/knowledge.json').items;
test('shared catalog serves both builds and matches Hebrew and English locally',()=>{
 for(const d of ['app','companion-v2'])for(const l of ['index.html','indexH.html']){
 const html=fs.readFileSync('dist/'+d+'/'+l,'utf8');assert.match(html,/Knowledge.context/);assert.match(html,/catalog.html/);
 }
 const tool=items.find(i=>i.id==='study-compare');
 for(const [lang,q] of [['en','evening course'],['he','מסלול לימודים']])assert.ok(search(items,q,'tools',lang).includes(tool));
 for(const changed of [{status:'retired'},{deadline:'2020-01-01'},{nextReviewDue:'2020-01-01'}])assert.deepEqual(search([{...tool,...changed}],'','', 'en'),[]);
});
test('public lookup contains no query or identity; offline uses saved public catalog',async()=>{
 const dom=new JSDOM('',{url:'https://pilot.test/app/',runScripts:'outside-only'}),w=dom.window;
 w.AbortSignal=AbortSignal;
 for(const f of ['search','reader'])w.eval(fs.readFileSync('knowledge-pilot/'+f+'.js','utf8'));
 let revision=0;
 w.fetch=async(url,opt)=>{assert.equal(url,'/knowledge.json');assert.equal(opt.credentials,'omit');assert.ok(!opt.body);if(revision===2)throw Error();const row=structuredClone(items.find(i=>i.id==='study-compare'));if(revision)row.en.title='Corrected course checklist';return {ok:true,json:async()=>({items:[row]})}};
 assert.match(await w.Knowledge.context('course','en','education'),/Compare two study options/);revision++;
 assert.match(await w.Knowledge.context('course','en','education'),/Corrected course/);revision++;
 assert.match(await w.Knowledge.context('course','en','education'),/Corrected course/);dom.window.close();
});
