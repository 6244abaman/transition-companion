"use strict";
/* Run with: node tests/journey.test.js
   Tests the shipped Journey store and encrypted backup without network calls. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const root = path.join(__dirname, "..");
const data = new Map();
global.localStorage = {
  getItem(key) { return data.has(key) ? data.get(key) : null; },
  setItem(key, value) { data.set(key, String(value)); },
  removeItem(key) { data.delete(key); }
};
Object.defineProperty(globalThis, "crypto", { configurable: true, value: webcrypto });
global.window = global;
global.btoa = s => Buffer.from(s, "binary").toString("base64");
global.atob = s => Buffer.from(s, "base64").toString("binary");

const Store = require("../journey-store.js");
require("../journey-backup.js");
const Backup = global.MomentumJourneyBackup;

let count = 0;
function check(name, fn) {
  fn();
  console.log("PASS " + name);
  count++;
}
function fresh() { data.clear(); }

check("new profiles do not share data with AI", () => {
  fresh(); assert.equal(Store.read().privacy.shareWithAI, false);
  assert.equal(Store.aiContext(Store.read(), "en"), "");
});
check("new goals and action items persist across reads", () => {
  const p=Store.upsert("goals",{title:"Start college",category:"education",status:"active",targetDate:"2027-07-01"});
  const id=p.goals[0].id;
  Store.upsert("actions",{title:"Request transcript",goalId:id,status:"todo",dueDate:"2027-02-01"});
  assert.equal(Store.read().actions[0].goalId,id);
  assert.equal(Store.read().goals[0].title,"Start college");
});
check("education plans are connected to goals", () => {
  const id=Store.read().goals[0].id;
  Store.upsert("education",{title:"Engineering course",goalId:id,status:"preparing",field:"Engineering"});
  assert.equal(Store.read().education[0].goalId,id);
});
check("CVs remain editable and contain draft bullets", () => {
  const saved=Store.upsert("cvs",{title:"Job CV",summary:"First",bullets:["One","Two"],language:"en"});
  Store.upsert("cvs",{...saved.cvs[0],summary:"Revised"});
  assert.equal(Store.read().cvs.length,1);
  assert.deepEqual(Store.read().cvs[0].bullets,["One","Two"]);
  assert.equal(Store.read().cvs[0].summary,"Revised");
});
check("skill labels and ratings import without assuming proficiency", () => {
  fresh();
  data.set("momentum-business-skills-v1",JSON.stringify({answers:{
    1:{rating:7,evidence:"Completed an assignment",confirmed:true},
    2:{rating:6,evidence:"",confirmed:false}
  }}));
  const profile=Store.read();
  assert.equal(profile.skills.length,2);
  assert.equal(profile.skills[0].confirmed,true);
  assert.equal(profile.skills[1].confirmed,false);
  assert.equal(profile.skills[0].en,"Finishing the Job");
});
check("unconfirmed skill examples are not shared", () => {
  Store.updatePrivacy({shareWithAI:true,shareSkills:true});
  const context=Store.aiContext(Store.read(),"en");
  assert.match(context,/Completed an assignment/);
  assert.doesNotMatch(context,/Working Under Pressure/);
});
check("selected sharing controls respect disabled categories", () => {
  Store.upsert("goals",{title:"Find a job",status:"active"});
  Store.updatePrivacy({shareGoals:false,shareActions:false,shareEducation:false,shareCVs:false});
  const c=Store.aiContext(Store.read(),"en");
  assert.doesNotMatch(c,/Find a job/);
});
check("portable export and import work, with sharing disabled", () => {
  const profile=JSON.parse(Store.exportData());
  profile.privacy.shareWithAI=true;
  fresh();
  Store.importData(profile,"replace");
  assert.equal(Store.read().privacy.shareWithAI,false);
  assert.equal(Store.read().goals[0].title,"Find a job");
});
check("merging a backup does not silently enable AI sharing", () => {
  Store.updatePrivacy({shareWithAI:false});
  const profile=JSON.parse(Store.exportData());
  profile.privacy.shareWithAI=true;
  Store.importData(profile,"merge");
  assert.equal(Store.read().privacy.shareWithAI,false);
});
check("unrecognized backups are rejected", () => {
  assert.throws(()=>Store.importData({schema:"wrong",version:1},"replace"));
});
check("partial deletion does not silently restore old assessment", () => {
  Store.erase({});
  assert.equal(Store.read().skills.length,0);
  assert.equal(Store.read().goals.length,0);
});
check("full deletion erases Companion, assessment and Journey keys", () => {
  data.set("gtc_v2_state","{}"); data.set("gtc_H_state","{}");
  Store.erase({assessment:true,companion:true});
  assert.equal(data.has("gtc_v2_state"),false);
  assert.equal(data.has("gtc_H_state"),false);
  assert.equal(data.has("momentum-business-skills-v1"),false);
  assert.equal(data.has(Store.KEY),false);
});
check("HTML uses valid inline JS and references shipped assets", () => {
  ["index.html","indexH.html","skills-business.html","my-journey.html"].forEach(file=>{
    const html=fs.readFileSync(path.join(root,file),"utf8");
    for(const match of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))
      new vm.Script(match[1],{filename:file});
  });
  ["journey-store.js","journey-backup.js","my-journey.js"].forEach(file=>{
    new vm.Script(fs.readFileSync(path.join(root,file),"utf8"),{filename:file});
  });
});
async function encryptedBackupTest() {
  const original=Store.blank();
  original.goals.push({title:"Private training plan",id:"g1",status:"active"});
  const secured=await Backup.encrypt(original,"passphrase-not-stored");
  assert.equal(secured.format,"momentum-journey-encrypted-v1");
  const restored=await Backup.decrypt(secured,"passphrase-not-stored");
  assert.equal(restored.goals[0].title,"Private training plan");
  await assert.rejects(()=>Backup.decrypt(secured,"incorrect-password"));
  console.log("PASS encrypted backup round-trip and wrong-password rejection");
  console.log("Journey tests passed: "+(count+1));
}
encryptedBackupTest().catch(error=>{console.error(error);process.exitCode=1});
