const {test} = require('node:test');
const assert = require('node:assert/strict');
const {createServer} = require('./server.cjs');
test('private test uses OpenAI and preserves Hebrew conversation context', async () => {
  const env = {OPENAI_API_KEY:'test-only',TEST_PASSWORD:'example'};
  let calls = 0;
  const messages = [{role:'user',content:'הייתי חובש'},{role:'assistant',content:'ספר לי עוד'},{role:'user',content:'איך לכתוב את זה בקורות החיים?'}];
  const server = createServer({env,send:async(url, options) => {
    calls++; assert.equal(new URL(url).hostname,'api.openai.com');
    const payload = JSON.parse(options.body);
    assert.deepEqual(payload.messages.slice(1),messages); assert.equal(payload.store,false);
    return Response.json({choices:[{message:{content:'{"reply":"תאר את הניסיון שלך"}'},finish_reason:'stop'}]});
  }});
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  try {
    const root = 'http://127.0.0.1:'+server.address().port;
    const headers = {authorization:'Basic '+Buffer.from('tester:example').toString('base64'),'Content-Type':'application/json'};
    const post = () => fetch(root+'/api',{method:'POST',headers,body:JSON.stringify({messages,system:'Respond in JSON',output_config:{}})});
    assert.equal((await fetch(root+'/api',{method:'POST'})).status,401);
    for (const file of ['index.html','indexH.html','ai-consent.js']) {
      const page = await (await fetch(root+'/app/'+file,{headers})).text();
      assert.match(page,/OpenAI/); assert.doesNotMatch(page,/momentum-proxy\.onrender\.com\/api/);
    }
    assert.match((await (await post()).json()).content[0].text,/הניסיון/);
    delete env.OPENAI_API_KEY; assert.equal((await post()).status,503); assert.equal(calls,1);
  } finally {await new Promise(resolve => server.close(resolve));}
});
