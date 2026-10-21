const fs=require('node:fs');
const path=require('node:path');
exports.prepare=win=>{
  win.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  win.fetch=async()=>{throw new Error('Network disabled in regression tests')};
  win.eval(fs.readFileSync(path.join(__dirname,'..','journey-store.js'),'utf8'));
  win.eval(fs.readFileSync(path.join(__dirname,'..','response-schema.js'),'utf8'));
};
