'use strict';
const fs = require('node:fs');
const path = require('node:path');
const PUBLIC_FILES = [
  'index.html', 'indexH.html', 'my-journey.html', 'skills-business.html',
  'onboarding.css', 'onboarding.js', 'chat-history.js', 'benefits-updates.js', 'benefits-updates.css', 'benefits-updates.json',
  'ai-consent.js', 'response-schema.js', 'skills-source.js', 'companion-safety.js',
  'journey-store.js', 'journey-backup.js', 'journey-reminders.js', 'journey-rights.js',
  'journey-sync.js', 'journey-tools-ui.js', 'life-skills-ui.js', 'my-journey.js',
  'manifest.json', 'service-worker.js', 'apple-touch-icon.png', 'icon-192.png',
  'icon-512.png', 'companion-mentor.jpeg'
];
function buildReview(root = path.resolve(__dirname, '..')) {
  root = fs.realpathSync(root);
  const output = path.resolve(root, 'dist');
  // Delete only the generated dist directory inside this repository. Never follow a link.
  if (path.relative(root, output) !== 'dist' || (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink())) {
    throw new Error('Refusing to replace an unexpected build directory');
  }
  fs.rmSync(output, {recursive:true, force:true});
  fs.mkdirSync(path.join(output, 'app'), {recursive:true});
  for (const file of PUBLIC_FILES) fs.copyFileSync(path.join(root, file), path.join(output, 'app', file));
  // A new directory gives every page and asset a fresh URL, outside the old /app/ worker scope.
  const fresh = path.join(output, 'companion-v2');
  fs.mkdirSync(fresh, {recursive:true});
  for (const file of PUBLIC_FILES) fs.copyFileSync(path.join(root, file), path.join(fresh, file));
  const revision = process.env.RENDER_GIT_COMMIT || '';
  const version = /^[a-f0-9]{40}$/.test(revision) ? revision.slice(0, 8) : 'local';
  for (const [directory, prefix] of [['app', 'tc-review-app-'], ['companion-v2', 'tc-companion-v2-']]) {
    const dir = path.join(output, directory);
    const workerPath = path.join(dir, 'service-worker.js');
    const worker = fs.readFileSync(workerPath, 'utf8')
      .replace('tc-v14-compact-chat', prefix + version)
      .replace('k.startsWith("tc-")', directory === 'app'
        ? '(k.startsWith("tc-review-app-") || /^tc-v[0-9]/.test(k))'
        : 'k.startsWith("tc-companion-v2-")');
    fs.writeFileSync(workerPath, worker);
    for (const [file, label] of [['index.html', 'Version'], ['indexH.html', 'גרסה']]) {
      const entry = path.join(dir, file);
      const html = fs.readFileSync(entry, 'utf8');
      const footer = `<footer data-build="${version}" style="text-align:center;padding:4px;font-size:.8rem">${label} <bdi>${version}</bdi></footer>`;
      fs.writeFileSync(entry, html.replaceAll('</main>', footer + '</main>'));
    }
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(fresh, 'manifest.json'), 'utf8'));
  manifest.name = 'Transition Companion V2';
  manifest.short_name = 'Companion V2';
  manifest.start_url = './indexH.html';
  fs.writeFileSync(path.join(fresh, 'manifest.json'), JSON.stringify(manifest, null, 2)+'\n');
  // Preserve every app entry point and relative link under /app/. Start new visits in Hebrew.
  fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta http-equiv="refresh" content="0;url=./app/indexH.html">
<title>Transition Companion</title></head><body>
<p><a href="./app/indexH.html">פתיחת המלווה בעברית</a></p><p><a href="./app/index.html" lang="en" dir="ltr">Open in English</a></p>
<script>location.replace(new URL('./app/indexH.html',location.href).href);</script></body></html>\n`, 'utf8');
  const info = {app:'transition-companion-review', commit:/^[a-f0-9]{40}$/.test(revision) ? revision : null, builtAt:new Date().toISOString()};
  fs.writeFileSync(path.join(output, 'build-info.json'), JSON.stringify(info, null, 2)+'\n');
  return {output, files:PUBLIC_FILES.length, info};
}
if (require.main === module) {
  const result = buildReview();
  console.log(`Built ${result.files} public app assets in dist/app, a Hebrew entry page and build-info.json.`);
}
module.exports = {buildReview, PUBLIC_FILES};
