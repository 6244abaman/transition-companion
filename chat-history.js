// Conversations stay inside the existing language-specific state and its erase path.
const ChatHistory = (() => {
  const fields = ['messages', 'activeTopic', 'phase', 'practiceStep', 'practice', 'ack', 'shift', 'updatedAt'];
  const blank = () => ({messages: [], activeTopic: null, phase: 'opening', practiceStep: 0,
    practice: false, ack: false, shift: false, updatedAt: null});
  function current(state) {
    return Object.fromEntries(fields.map(key => [key, state[key] ?? blank()[key]]));
  }
  function chats(state) {
    return [current(state), ...(state.savedChats || [])];
  }
  function select(state, index) {
    const archived = [...(state.savedChats || [])];
    const next = index === -1 ? blank() : archived.splice(index, 1)[0];
    if (!next) throw Error('Unknown conversation');
    if (state.messages.length) archived.unshift(current(state));
    return {...state, ...next, savedChats: archived, started: true};
  }
  function transcript(chat) {
    return chat.messages.map(({role,text}) => {
      if (!['user','assistant','system'].includes(role) || typeof text !== 'string') throw Error('Invalid message');
      return {role,text};
    });
  }
  function backup(state) {
    return {format:'companion-chat-text-v1', chats:chats(state).filter(c => c.messages.length).map(transcript)};
  }
  function restore(state, file) {
    if (file?.format !== 'companion-chat-text-v1' || !Array.isArray(file.chats)) throw Error('Invalid backup');
    const seen = new Set(chats(state).map(c => JSON.stringify(transcript(c))));
    const additions = [];
    for (const messages of file.chats) {
      if (!Array.isArray(messages) || !messages.length) throw Error('Invalid conversation');
      const clean = transcript({messages});
      const key = JSON.stringify(clean);
      if (!seen.has(key)) additions.push({...blank(), phase:'open', messages:clean});
      seen.add(key);
    }
    return {...state, savedChats:[...(state.savedChats || []), ...additions]};
  }
  // Delete one conversation. index 0 is the current chat; i > 0 is savedChats[i - 1].
  function remove(state, index) {
    if (index === 0) return {...state, ...blank()};
    const archived = [...(state.savedChats || [])];
    if (!archived[index - 1]) throw Error('Unknown conversation');
    archived.splice(index - 1, 1);
    return {...state, savedChats: archived};
  }
  // Indexes (as in chats()) of conversations whose text contains every word of the query.
  function search(state, query) {
    const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    return chats(state).map((chat, i) => ({chat, i})).filter(({chat}) => {
      if (!chat.messages.length) return false;
      const text = chat.messages.map(m => String(m.text || '')).join(' ').toLowerCase();
      return words.every(w => text.includes(w));
    }).map(({i}) => i);
  }
  function summary(chat) {
    const users = chat.messages.filter(m => m.role === 'user').length;
    const last = [...chat.messages].reverse().find(m => m.role === 'assistant');
    return {users, last: last ? String(last.text).replace(/\s+/g, ' ').slice(0, 90) : ''};
  }
  return {chats, select, backup, restore, remove, search, summary};
})();
if (typeof module !== 'undefined') module.exports = ChatHistory;

if (typeof document !== 'undefined') {
  const panel = document.getElementById('chatHistory');
  const body = panel.querySelector('div');
  const desktop = window.matchMedia('(min-width:1100px)');
  const label = (en,he) => S.lang === 'he' ? he : en;
  function add(tag, text) {
    const node = document.createElement(tag);
    node.textContent = text;
    body.append(node);
    return node;
  }
  function button(text, fn) {
    const node = add('button',text);
    node.type = 'button';
    node.className = 'chip';
    node.onclick = fn;
    return node;
  }
  function commit(next) {
    if (sendingUserMessage || document.getElementById('thinking')) {
      alert(label('Please wait for the reply.', 'נא להמתין לסיום התשובה.'));
      return false;
    }
    if (!writeChatState(next)) return false;
    S = next;
    return true;
  }
  function resume(next) {
    if (!commit(next)) return;
    stopSpeaking();
    panel.open = false;
    enterChat();
    if (!S.messages.length) openConversation();
    paintTopicPanel();
    draw();
    document.getElementById('input').focus({preventScroll:true});
    scrollDown();
  }
  let query = '';
  function draw() {
    panel.querySelector('summary').textContent = label('Previous conversations','שיחות קודמות');
    body.replaceChildren();
    button(label('Close chats ✕','סגירת שיחות ✕'), () => {
      panel.open = false;
      panel.querySelector('summary').focus();
    }).classList.add('close-chats');
    button(label('+ New chat','+ שיחה חדשה'), () => resume(ChatHistory.select(S,-1))).classList.add('new-chat');
    const find = add('input','');
    find.type = 'search';
    find.className = 'chat-search';
    find.placeholder = label('Search conversations…','חיפוש בשיחות…');
    find.setAttribute('aria-label',label('Search conversations','חיפוש בשיחות'));
    find.value = query;
    const list = add('nav','');
    list.className = 'chat-list';
    list.setAttribute('aria-label',label('Saved conversations','שיחות שמורות'));
    const records = ChatHistory.chats(S);
    const paintList = () => {
      query = find.value;
      const matches = new Set(ChatHistory.search(S, query));
      list.replaceChildren();
      records.forEach((chat,i) => {
        if (!chat.messages.length || !matches.has(i)) return;
        const first = chat.messages.find(m => m.role === 'user') || chat.messages[0];
        const date = chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString(S.lang) : '';
        const info = ChatHistory.summary(chat);
        const title = [i === 0 ? label('Current','נוכחית') : '', date, first.text.slice(0,72)].filter(Boolean).join(', ');
        const row = document.createElement('div');
        row.className = 'chat-row';
        const item = document.createElement('button');
        item.type = 'button'; item.className = 'chip chat-item';
        item.textContent = title;
        if (info.last) { const small = document.createElement('small'); small.textContent = label(info.users + ' messages, ', info.users + ' הודעות, ') + info.last; item.append(document.createElement('br'), small); }
        item.onclick = () => resume(i ? ChatHistory.select(S,i-1) : {...S,started:true});
        item.setAttribute('aria-current',String(i === 0));
        const del = document.createElement('button');
        del.type = 'button'; del.className = 'chip chat-delete';
        del.textContent = label('Delete','מחיקה');
        del.setAttribute('aria-label', label('Delete this conversation: ','מחיקת השיחה: ') + first.text.slice(0,40));
        del.onclick = () => {
          if (!confirm(label('Delete this conversation from this device? This cannot be undone.','למחוק את השיחה הזאת מהמכשיר? אי אפשר לבטל.'))) return;
          if (commit(ChatHistory.remove(S,i))) { if (i === 0) { renderThread(); paintTopicPanel(); } draw(); }
        };
        row.append(item, del);
        list.append(row);
      });
      if (!list.children.length && query) { const p = document.createElement('p'); p.textContent = label('No conversations match.','לא נמצאו שיחות מתאימות.'); list.append(p); }
    };
    find.oninput = paintList;
    paintList();
    if (!records.some(c => c.messages.length)) add('p',label('No saved chats in this edition yet.','עדיין אין שיחות שמורות בגרסה זו.'));
    const tools = add('details','');
    tools.className = 'chat-tools';
    const summary = document.createElement('summary');
    summary.textContent = label('Chat backups and privacy','גיבוי שיחות ופרטיות');
    tools.append(summary);
    const toolsStart = body.children.length;
    const other = KEY === 'gtc_H_state';
    add('a',other ? label('English conversation history','היסטוריית שיחות בגרסה האנגלית') : label('Hebrew conversation history','היסטוריית שיחות בגרסה העברית')).href =
      (other ? 'index.html?lang=en' : 'indexH.html?lang=he') + '#chatHistory';
    add('p',label('Chats stay in this browser on this site. Clearing site data can erase them. Back up each edition separately. The downloaded file contains readable conversation text. Keep it private. Restore adds missing transcripts.',
      'השיחות נשמרות בדפדפן הזה באתר הזה. מחיקת נתוני האתר עלולה למחוק אותן. יש לגבות כל גרסה בנפרד. הקובץ כולל טקסט קריא של השיחות ויש לשמור עליו בפרטיות. השחזור מוסיף שיחות חסרות.'));
    button(label('Download chat backup','הורדת גיבוי שיחות'), () => {
      const url = URL.createObjectURL(new Blob([JSON.stringify(ChatHistory.backup(S))],{type:'application/json'}));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'companion-chats-' + (other ? 'he' : 'en') + '.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    const prompt = add('label',label('Restore chat backup','שחזור מגיבוי שיחות'));
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = '.json,application/json';
    prompt.append(file);
    Array.from(body.children).slice(toolsStart).forEach(node => tools.append(node));
    file.onchange = async () => {
      try {
        const selected = file.files[0];
        if (!selected) return;
        if (selected.size > 16*1024*1024) throw Error();
        const data = JSON.parse(await selected.text());
        if (commit(ChatHistory.restore(S,data))) {
          draw();
          add('p',label('Restore complete. Choose a conversation above.','השחזור הסתיים. ניתן לבחור שיחה למעלה.')).setAttribute('role','status');
        }
      } catch {
        alert(label('Could not read this chat backup.','לא ניתן לקרוא גיבוי שיחות זה.'));
      }
      file.value = '';
    };
  }
  panel.ontoggle = () => {
    if (panel.open) draw();
  };
  desktop.addEventListener('change', () => { panel.open = false; });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.open) {
      panel.open = false;
      panel.querySelector('summary').focus();
    }
  });
  document.addEventListener('companion:chat-updated', draw);
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  draw();
  if (location.hash === '#chatHistory') panel.open = true;
}
