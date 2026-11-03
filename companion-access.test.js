const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const url = 'https://momentum-proxy.onrender.com/api';
const script = fs.readFileSync(__dirname+'/companion-access.js','utf8');
for (const lang of ['en','he']) {
  test(lang+' challenge, retry, reuse, revocation and cancel',async () => {
    let status = 200, cancel = false, prompts = 0;
    const code = 'x'.repeat(43);
    const calls = [], elements = {};
    const document = {documentElement:{lang},body:{append(){}},createElement(tag) {
      const el = {append(){},focus(){},remove(){},addEventListener(_,fn){this.closed=fn;},
        showModal(){prompts++; queueMicrotask(() => {
          elements.input.value = code;
          this.returnValue = cancel ? 'cancel' : 'use';
          this.closed();
        });}};
      elements[tag] = el; return el;
    }};
    const send = vm.runInNewContext(script+'\ncompanionFetch',{document,fetch:async (_,opts) => {
      calls.push(opts.headers.Authorization);
      return {status:opts.headers.Authorization && !cancel ? 200 : status};
    }});
    const opts = {method:'POST',headers:{},body:'{}'};
    assert.equal((await send(url,opts)).status,200);
    assert.equal(prompts,0);
    status = 401;
    assert.equal((await send(url,opts)).status,200);
    assert.equal((await send(url,opts)).status,200);
    assert.deepEqual(calls,[undefined,undefined,'Bearer '+code,'Bearer '+code]);
    assert.equal(elements.input.type,'password');
    assert.equal(elements.dialog.dir,lang==='he'?'rtl':'ltr');
    cancel = true;
    assert.equal((await send(url,opts)).status,401);
    assert.equal(prompts,2);
    await assert.rejects(send('https://other.example/api',opts));
    assert.equal(calls.length,5);
  });
}
