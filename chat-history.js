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
  return {chats, select, backup, restore};
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
    panel.open = desktop.matches;
    enterChat();
    if (!S.messages.length) openConversation();
    paintTopicPanel();
    draw();
    document.getElementById('input').focus({preventScroll:true});
    scrollDown();
  }
  function draw() {
    panel.querySelector('summary').textContent = label('Previous conversations','שיחות קודמות');
    body.replaceChildren();
    button(label('Close chats ✕','סגירת שיחות ✕'), () => {
      panel.open = false;
      panel.querySelector('summary').focus();
    }).classList.add('close-chats');
    button(label('+ New chat','+ שיחה חדשה'), () => resume(ChatHistory.select(S,-1))).classList.add('new-chat');
    const list = add('nav','');
    list.className = 'chat-list';
    list.setAttribute('aria-label',label('Saved conversations','שיחות שמורות'));
    const records = ChatHistory.chats(S);
    records.forEach((chat,i) => {
      if (!chat.messages.length) return;
      const first = chat.messages.find(m => m.role === 'user') || chat.messages[0];
      const date = chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString(S.lang) : '';
      const title = [i === 0 ? label('Current','נוכחית') : '', date, first.text.slice(0,72)].filter(Boolean).join(' · ');
      const item = button(title, () => resume(i ? ChatHistory.select(S,i-1) : {...S,started:true}));
      item.classList.add('chat-item');
      item.setAttribute('aria-current',String(i === 0));
      list.append(item);
    });
    if (!records.some(c => c.messages.length)) add('p',label('No saved chats in this edition yet.','עדיין אין שיחות שמורות בגרסה זו.'));
    const tools = add('details','');
    tools.className = 'chat-tools';
    const summary = document.createElement('summary');
    summary.textContent = label('Chat backups and privacy','גיבוי שיחות ופרטיות');
    tools.append(summary);
    const toolsStart = body.children.length;
    const other = KEY === 'gtc_H_state';
    add('a',other ? 'English conversation history' : 'היסטוריית שיחות בגרסה העברית').href =
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
    if (desktop.matches && !panel.open) panel.open = true;
    if (panel.open) draw();
  };
  desktop.addEventListener('change', () => { panel.open = desktop.matches; });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panel.open && !desktop.matches) {
      panel.open = false;
      panel.querySelector('summary').focus();
    }
  });
  document.addEventListener('companion:chat-updated', draw);
  new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  draw();
  if (desktop.matches || location.hash === '#chatHistory') panel.open = true;
}
