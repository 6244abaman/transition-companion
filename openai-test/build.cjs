const fs = require('node:fs');
const path = require('node:path');
const {buildReview} = require('../scripts/build-review.cjs');
const {output} = buildReview();
for (const directory of ['app', 'companion-v2']) {
  for (const file of ['index.html', 'indexH.html', 'ai-consent.js']) {
    const target = path.join(output, directory, file);
    const original = fs.readFileSync(target, 'utf8');
    let updated = original;
    if (file === 'ai-consent.js') {
      updated = updated.replace("'Anthropic (Claude)'", "'OpenAI'");
    } else {
      updated = updated.replace('"https://momentum-proxy.onrender.com/api"', 'location.origin + "/api"')
        .replace('"claude-sonnet-4-6"', '"gpt-4.1-mini"')
        .replaceAll("Anthropic's usual content array", "the expected reply format")
        .replaceAll('Anthropic מחזירה בדרך כלל', 'האפליקציה מצפה לקבל')
        .replace('<header class="bar">','<header class="bar"><small lang="en" dir="ltr">OpenAI · Test</small>');
    }
    if (updated === original || updated.includes('https://momentum-proxy.onrender.com/api') ||
        (file === 'ai-consent.js' && updated.includes('Anthropic (Claude)'))) throw Error('Unexpected provider configuration: ' + file);
    fs.writeFileSync(target, updated);
  }
}
