// Per-person access codes stay in this tab's memory and are sent only to Momentum.
const companionFetch = (() => {
  let token = '';
  let pending;
  function requestCode() {
    if (pending) return pending;
    const he = document.documentElement.lang.startsWith('he');
    const dialog = document.createElement('dialog');
    dialog.dir = he ? 'rtl' : 'ltr';
    const form = document.createElement('form');
    form.method = 'dialog';
    const label = document.createElement('label');
    label.textContent = he ? 'הזינו קוד גישה אישי שקיבלתם ממומנטום' : 'Enter your personal access code from Momentum';
    const field = document.createElement('input');
    field.type = 'password';
    field.autocomplete = 'off';
    label.append(field);
    const submit = document.createElement('button');
    submit.value = 'use';
    submit.textContent = he ? 'המשך' : 'Continue';
    const cancel = document.createElement('button');
    cancel.value = 'cancel';
    cancel.textContent = he ? 'ביטול' : 'Cancel';
    form.append(label, submit, cancel);
    dialog.append(form);
    document.body.append(dialog);
    pending = new Promise(resolve => dialog.addEventListener('close', () => {
      const code = dialog.returnValue === 'use' ? field.value.trim() : '';
      dialog.remove();
      pending = undefined;
      resolve(/^[A-Za-z0-9_-]{43}$/.test(code) ? code : '');
    }, {once:true}));
    dialog.showModal();
    field.focus();
    return pending;
  }
  return async (url, options) => {
    if (url !== 'https://momentum-proxy.onrender.com/api') throw Error('Unexpected proxy URL');
    const send = code => fetch(url, {...options, redirect:'error',
      headers:{...options.headers, ...(code ? {Authorization:'Bearer '+code} : {})}});
    const response = await send(token);
    if (response.status !== 401) return response;
    token = '';
    const code = await requestCode();
    if (!code) return response;
    const retry = await send(code);
    if (retry.status !== 401 && retry.status !== 403) token = code;
    return retry;
  };
})();
