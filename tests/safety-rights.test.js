const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const c={window:null,Date,document:{getElementById:()=>null}};c.window=c;vm.createContext(c);
for(const f of ['companion-safety.js','journey-rights.js','skills-source.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',f),'utf8'),c);
test('urgent cues work locally in both languages',()=>{for(const s of ['I want to die','I might hurt myself','אני רוצה להתאבד','אני רוצה לפגוע בעצמי'])assert.equal(c.MomentumSafety.urgent(s),true);assert.equal(c.MomentumSafety.urgent('Help me write a CV'),false);assert.match(c.MomentumSafety.reply('en'),/not contacted anyone/);});
test('rights sources are official and summaries expire',()=>{for(const r of c.MomentumRights.records){const u=new URL(r.source);assert.ok(['www.hachvana.mod.gov.il','www.btl.gov.il'].includes(u.hostname));for(const l of ['en','he']){assert.ok(r[l].title);assert.ok(r[l].steps.length);assert.ok(c.MomentumRights.draft(r,l).includes(r.source));}}assert.equal(c.MomentumRights.current(new Date('2026-11-22')),false);});
test('canonical 63 source entries and mapping dimensions are preserved',()=>{const s=c.MomentumSkillSource;assert.equal(s.skills.length,63);assert.equal(s.skills[62].original,s.skills[54].original);assert.equal(s.duplicate.sameAs,55);assert.equal(s.roles.length,15);for(const r of Object.values(s.opportunities))assert.equal(r.length,15);});
