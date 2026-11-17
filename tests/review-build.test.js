'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM} = require('jsdom');
const {buildReview, PUBLIC_FILES} = require('../scripts/build-review.cjs');
const root = path.resolve(__dirname, '..');
test('review build preserves app assets, resolves links and excludes private/server files', () => {
  const {output} = buildReview(root);
  const home = new JSDOM(fs.readFileSync(path.join(output, 'index.html'), 'utf8'));
  assert.equal(home.window.document.documentElement.lang, 'he');
  assert.equal(home.window.document.querySelector('meta[http-equiv="refresh"]').content, '0;url=./app/indexH.html');
  home.window.close();
  for (const file of PUBLIC_FILES) assert.deepEqual(fs.readFileSync(path.join(output, 'app', file)), fs.readFileSync(path.join(root, file)), file);
  for (const file of ['index.html','indexH.html','my-journey.html','skills-business.html']) {
    const dom = new JSDOM(fs.readFileSync(path.join(output, 'app', file), 'utf8'), {url:'https://review.example/app/'+file});
    try {
      for (const element of dom.window.document.querySelectorAll('script[src],img[src],link[href],a[href]')) {
        const value = element.getAttribute('src') || element.getAttribute('href');
        const url = new URL(value, dom.window.location.href);
        if (url.origin !== 'https://review.example' || (element.tagName === 'A' && !/\.html$/.test(url.pathname))) continue;
        assert.ok(fs.existsSync(path.join(output, url.pathname)), file+': '+value);
      }
    } finally { dom.window.close(); }
  }
  const worker = fs.readFileSync(path.join(output, 'app/service-worker.js'), 'utf8');
  const cached = vm.runInNewContext(worker+'\nAPP_FILES', {URL, self:{location:{href:'https://review.example/app/service-worker.js'}, addEventListener(){}}});
  for (const relative of cached) {
    const url = new URL(relative, 'https://review.example/app/service-worker.js');
    assert.ok(fs.existsSync(path.join(output, url.pathname)), 'Offline asset: '+relative);
  }
  const list = fs.readdirSync(output, {recursive:true}).map(file=>String(file).replaceAll('\\','/'));
  assert.deepEqual(list.filter(file=>/(^|\/)(?:\.local|\.git|\.env|node_modules|server|sync-service|windows)(\/|$)/.test(file)), []);
  assert.equal(list.some(file=>/\.(?:cmd|ps1|sqlite|lnk)$/.test(file)), false);
  const info = JSON.parse(fs.readFileSync(path.join(output, 'build-info.json'), 'utf8'));
  assert.equal(info.app, 'transition-companion-review');
});
test('owner links, Render settings and AI target stay consistent with shared metadata', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'app-deployment.json'), 'utf8'));
  assert.equal(config.review.serviceType, 'static_site');
  assert.equal(config.review.publishPath, 'dist');
  assert.equal(new URL(config.review.url).protocol, 'https:');
  assert.ok(config.review.dashboardUrl.endsWith('/'+config.review.serviceId));
  for (const file of ['README.md','HOSTING.txt','LIVE-APPS.md']) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(text.includes(config.review.url), file+': public app URL');
    assert.ok(text.includes(config.review.dashboardUrl), file+': owner dashboard');
  }
  assert.ok(fs.readFileSync(path.join(root, 'HOSTING.txt'),'utf8').includes(config.deploymentBranch));
  for (const file of ['index.html','indexH.html']) {
    const dom = new JSDOM(fs.readFileSync(path.join(root, file), 'utf8'));
    const source = dom.window.document.getElementById('config').textContent;
    const actual = vm.runInNewContext(source+'; CONFIG');
    assert.equal(actual.API_URL, config.llm.apiUrl);
    assert.equal(actual.MODEL, config.llm.model);
    dom.window.close();
  }
  assert.match(fs.readFileSync(path.join(root, 'CLAUDE.md'),'utf8'), /@APP-OPERATIONS\.md/);
});

test('fresh V2 address includes the full app outside the old worker scope', () => {
  const {output}=buildReview(root);
  for(const file of PUBLIC_FILES) assert.ok(fs.existsSync(path.join(output,'companion-v2',file)),file);
  for(const file of ['index.html','indexH.html','ai-consent.js']) assert.deepEqual(fs.readFileSync(path.join(output,'companion-v2',file)),fs.readFileSync(path.join(root,file)));
  const manifest=JSON.parse(fs.readFileSync(path.join(output,'companion-v2/manifest.json'),'utf8'));
  assert.equal(manifest.name,'Transition Companion V2');assert.equal(manifest.start_url,'./indexH.html');
  const worker=fs.readFileSync(path.join(output,'companion-v2/service-worker.js'),'utf8');
  assert.ok(worker.includes('tc-companion-v2-v2'));assert.ok(worker.includes('k.startsWith("tc-companion-v2-")'));
});
