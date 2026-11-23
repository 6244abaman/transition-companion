'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const engine=require('../adaptive-skills-engine.js');
const raw=fs.readFileSync(path.join(__dirname,'../skills-source.js'),'utf8');
const context={window:{}};
vm.runInNewContext(raw,context);
const skills=context.window.MomentumSkillSource;

test('full source retained; duplicate entry 63 not asked',()=>{
 assert.equal(skills.skills.length,63);
 assert.equal(skills.roles.length,15);
 const chosen=engine.choose(skills,{role:0,rank:0,count:7});
 assert.equal(chosen.length,7);
 assert.equal(new Set(chosen.map(x=>x.id)).size,7);
 assert.ok(chosen.every(x=>x.id!==63));
});
test('shortlist responds to work performed, role, and responsibility',()=>{
 const combat=engine.choose(skills,{role:0,rank:0,count:7});
 const technical=engine.choose(skills,{role:7,rank:0,activities:['technical','analyze'],count:7});
 assert.notDeepEqual(combat.map(x=>x.id),technical.map(x=>x.id));
 const alone=engine.choose(skills,{role:3,rank:0,count:7});
 const teaches=engine.choose(skills,{role:3,rank:0,activities:['teach','lead'],count:7});
 assert.notDeepEqual(alone.map(x=>x.id),teaches.map(x=>x.id));
 assert.equal(teaches.length,7);
});
test('avoid distress assumptions and avoid domain monoculture',()=>{
 const chosen=engine.choose(skills,{role:0,rank:0,count:7});
 assert.ok(chosen.every(x=>![27,28,29,32,33,34,35,36,37].includes(x.id)));
 assert.ok(new Set(chosen.map(x=>x.domain)).size>=3);
});
test('no skill level without soldier-confirmed example',()=>{
 assert.equal(engine.evidenceLevel({practice:'repeated',autonomy:'guided',result:true}),0);
 assert.equal(engine.evidenceLevel({practice:'repeated',autonomy:'guided',result:true,confirmed:true,evidence:'I organized an exercise with a clear result.'}),4);
 assert.equal(engine.evidenceLevel({practice:'once',autonomy:'assisted',result:false,confirmed:true,evidence:'I helped with scheduling.'}),1);
});
test('separate skills page has bilingual, browser-local controls',()=>{
 const text=fs.readFileSync(path.join(__dirname,'../adaptive-skills.html'),'utf8');
 for(const v of ['lang="en"','adaptive-skills-engine.js','journey-store.js','מומנטום','id="lang"','id="export"','id="confirm"','id="skip"','id="more"'])assert.ok(text.includes(v),v);
 assert.ok(!text.includes('100% Privacy'));
});

test('mobile-friendly assessment flows through evidence, skip, results and Hebrew switch',()=>{
 const {JSDOM}=require('jsdom');
 const path=require('node:path');
 const root=path.join(__dirname,'..');
 let page=fs.readFileSync(path.join(root,'adaptive-skills.html'),'utf8');
 page=page.replace(/<script src="\.\/(skills-source\.js|adaptive-skills-engine\.js|journey-store\.js)"><\/script>/g,(_,name)=>{
   const js=fs.readFileSync(path.join(root,name),'utf8').replace(/<\/script/gi,'<\\/script');
   return '<script>'+js+'</script>';
 });
 const dom=new JSDOM(page,{runScripts:'dangerously',url:'https://example.test/adaptive-skills.html',beforeParse(win){win.scrollTo=()=>{};}});
 const doc=dom.window.document;
 assert.equal(doc.getElementById('role').options.length,15);
 const acts=doc.querySelectorAll('#activities input');
 assert.ok(acts.length>=6);acts[2].checked=true;
 doc.getElementById('role').value='7';
 doc.getElementById('begin').click();
 assert.equal(doc.getElementById('setup').hidden,true);
 assert.equal(doc.getElementById('question').hidden,false);
 doc.querySelector('#practice button').click(); // repeated experience
 assert.equal(doc.getElementById('evidenceFields').hidden,false);
 doc.getElementById('evidence').value='I coordinated a non-sensitive task and recorded a useful result.';
 doc.getElementById('autonomy').value='independent';
 doc.getElementById('result').checked=true;
 doc.getElementById('confirm').checked=true;
 doc.getElementById('next').click();
 assert.equal(dom.window.MomentumJourney.read().lifeSkills.length,1);
 for(let i=1;i<7;i++)doc.getElementById('skip').click();
 assert.equal(doc.getElementById('results').hidden,false);
 assert.ok(doc.getElementById('resultList').textContent.length>0);
 doc.getElementById('lang').click();
 assert.equal(doc.documentElement.dir,'rtl');
 assert.equal(doc.getElementById('jLink').href.includes('lang=he'),true);
 dom.window.close();
});
