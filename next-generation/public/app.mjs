import {
  emptyMemory,
  addGoal,
  completeGoal,
  makePacket,
  localReply,
  needsHuman,
} from "../shared/memory.mjs";
import { PrivateVault } from "./vault.mjs";
const COPY = {
  he: {
    welcome:
      "טוב שאתה כאן. אפשר לדבר על מה שמעסיק אותך, ולעשות יחד צעד קטן קדימה. במה נתחיל?",
    help: "עזרה אנושית",
    journey: "המסע שלי",
    benefits: "מקורות זכויות",
    privacy: "פרטיות וזיכרון",
    placeholder: "מה מעסיק אותך היום?",
    send: "שליחה",
    message: "הודעה",
    mic: "הכתבה קולית",
    close: "סגירה",
    footer: "במכשיר שלך • ללא שיתוף אוטומטי",
    local: "שיחה מודרכת מקומית • לא מחוברת ל-AI",
    ready: "AI זמין רק אחרי בדיקת הבקשה ואישור שלך",
    saved: "זיכרון פרטי פתוח • שמירה מוצפנת במכשיר",
    session: "מצב זמני • השיחה נמחקת בסגירת הדף",
    topics: ["זכויות והטבות", "עבודה ולימודים", "הצעד הבא שלי", "פשוט לדבר"],
    error: "הפעולה לא הושלמה. המידע הקיים לא הוחלף. אפשר לנסות שוב.",
    you: "אתה",
    read: "הקראה",
    step: "שמירת צעד",
    cancel: "ביטול",
    voice: "שימוש בקול",
    voiceNotice:
      "הדפדפן או מערכת ההפעלה עשויים לשלוח קול או טקסט לספק שירות דיבור חיצוני. אפשר להמשיך בהקלדה. ההסכמה כאן היא לפעולת הקול הנוכחית בלבד.",
    allowVoice: "אישור לפעולת הקול",
    noVoice: "קול אינו זמין בדפדפן הזה. אפשר להקליד כרגיל.",
    empty: "עדיין אין צעדים שמורים. בחר צעד קטן שתוכל לבצע, ונשמור אותו כאן.",
    title: "הצעד הקרוב",
    due: "תאריך לבחירתך",
    add: "שמירה במסע",
    done: "סימון כהושלם",
    reopen: "פתיחה מחדש",
    pass: "סיסמה פרטית (לפחות 12 תווים)",
    create: "יצירת זיכרון מוצפן",
    unlock: "פתיחת הזיכרון",
    lock: "נעילה ויציאה מהשיחה",
    backup: "הורדת גיבוי מוצפן",
    restore: "החלפת הזיכרון מגיבוי",
    delete: "מחיקת כל זיכרון Next Generation",
    deleteConfirm:
      "האם למחוק את השיחה, הצעדים והזיכרון של Next Generation מהמכשיר הזה? גיבויים שהורדת נשארים באחריותך.",
    privacyNotice:
      "אין כאן חשבון חייל או שמירה מרכזית. בלי זיכרון פתוח, השיחה זמנית. סיסמה נשמרת רק בזיכרון הפעיל; אם תאבד, אין שחזור. נעילה או סגירת הדף מנקות את השיחה הפעילה. נעל לפני מסירת המכשיר. גיבוי מוצפן נשמר רק בקובץ שתוריד.",
    key: "קוד גישה לשרת AI (לא מפתח OpenAI)",
    keyNote:
      "אופציונלי; הקוד נשאר בזיכרון הפעיל בלבד. מנהל ההתקנה מגדיר אותו בצד השרת.",
    setKey: "שמירת קוד למפגש הזה",
    exportNone: "יש ליצור זיכרון מוצפן לפני הורדת גיבוי.",
    consent: "בדיקת הבקשה לפני שיתוף",
    consentText:
      "רק התוכן בתצוגה למטה יישלח דרך שרת Momentum ל-OpenAI. השרת מוסיף הנחיות קבועות ומקורות ציבוריים מאומתים. ללא שיתוף אוטומטי. store:false אינו מבטיח אפס שמירה אצל הספק; ייתכנו יומני אבטחה לפי תנאיו. לא להזין מספרי זהות, סודות צבאיים או מידע של אחרים.",
    context: "לכלול עד 5 צעדים, 5 מיומנויות ו-4 הודעות אחרונות",
    approve: "אישור ושליחה ל-OpenAI",
    localInstead: "תשובה מקומית ללא שיתוף",
    noKey:
      "אין קוד גישה למפגש הזה. אפשר להגדיר בפרטיות וזיכרון או להמשיך מקומית.",
    failedAI:
      "ה-AI לא ענה. אפשר לנסות שוב בהודעה הבאה. זו תשובה מודרכת מקומית:",
    sources:
      "אין כאן עדיין מידע מאומת על זכאות. המקורות הרשמיים הבאים נפתחו ונבדקו ב-25.11.2026. בדוק בהם תנאים ומועדים לפני החלטה.",
    benefitSource: "האגף לחיילים משוחררים ומילואים",
    rehab: "אגף השיקום",
    helpNotice:
      "אפשר לפנות לאדם שאתה סומך עליו ולהישאר איתו. האפליקציה אינה מנטרת מצב חירום ואינה מזעיקה עזרה.",
    eran: "ער״ן — תמיכה רגשית",
    chat: "פתיחת תמיכה בכתיבה",
    savedStatus: "נשמר בזיכרון המוצפן",
    unsaved:
      "השמירה לא הושלמה. השיחה זמנית כרגע; הורד גיבוי קודם או פתח שוב את הזיכרון.",
    working: "ממתין לתשובה…",
  },
  en: {
    welcome:
      "Good to have you here. We can talk about what is on your mind and take one small step forward. Where would you like to start?",
    help: "Human help",
    journey: "My Journey",
    benefits: "Benefits sources",
    privacy: "Privacy & memory",
    placeholder: "What is on your mind today?",
    send: "Send",
    message: "Message",
    mic: "Voice input",
    close: "Close",
    footer: "On your device • No automatic sharing",
    local: "Local guided conversation • AI is not connected",
    ready: "AI is available after you review and approve each request",
    saved: "Private memory unlocked • Encrypted on this device",
    session: "Temporary session • Cleared when you close this page",
    topics: [
      "Benefits and rights",
      "Work and studies",
      "My next step",
      "Just talk",
    ],
    error:
      "The action could not be completed. Existing saved data was not replaced. Please try again.",
    you: "You",
    read: "Read aloud",
    step: "Save a step",
    cancel: "Cancel",
    voice: "Using voice",
    voiceNotice:
      "Your browser or operating system may send audio or text to an external speech provider. You can keep typing instead. Approval here applies to this voice action only.",
    allowVoice: "Approve this voice action",
    noVoice: "Voice is unavailable in this browser. You can type as usual.",
    empty:
      "No saved steps yet. Choose one small action you can take, and keep it here.",
    title: "Your next step",
    due: "Optional date",
    add: "Save to Journey",
    done: "Mark done",
    reopen: "Reopen",
    pass: "Private passphrase (at least 12 characters)",
    create: "Create encrypted memory",
    unlock: "Unlock memory",
    lock: "Lock and leave conversation",
    backup: "Download encrypted backup",
    restore: "Replace memory from backup",
    delete: "Delete all Next Generation memory",
    deleteConfirm:
      "Delete this Next Generation conversation, steps and memory from this device? Downloaded backups remain your responsibility.",
    privacyNotice:
      "There is no soldier account or central personal storage. Without unlocked memory, this conversation is temporary. Your passphrase stays in active memory only; it cannot be recovered if lost. Locking or closing the page clears the active conversation. Lock before handing over the device. An encrypted backup exists only in the file you download.",
    key: "AI server access code (not an OpenAI key)",
    keyNote:
      "Optional; held in active memory only. The installation owner configures it on the server.",
    setKey: "Use code for this session",
    exportNone: "Create encrypted memory before downloading a backup.",
    consent: "Review before sharing",
    consentText:
      "Only the content below is sent through the Momentum server to OpenAI. The server adds fixed instructions and verified public sources. Nothing is shared automatically. store:false does not guarantee zero provider retention; security logs may be retained under provider terms. Do not enter ID numbers, military secrets or other people’s information.",
    context: "Include up to 5 steps, 5 skills and 4 recent messages",
    approve: "Approve and send to OpenAI",
    localInstead: "Local answer without sharing",
    noKey:
      "No access code is set for this session. Set one in Privacy & memory, or continue locally.",
    failedAI:
      "AI could not answer. You can try again with your next message. This is a local guided answer:",
    sources:
      "No verified eligibility information has been loaded yet. These official source pages were checked on 25 November 2026. Check current conditions and deadlines there before deciding.",
    benefitSource: "Discharged Soldiers and Reservists Division",
    rehab: "Rehabilitation Division",
    helpNotice:
      "Consider reaching someone you trust and staying with them. The app does not monitor emergencies or summon help.",
    eran: "ERAN — emotional support",
    chat: "Open written support",
    savedStatus: "Saved in encrypted memory",
    unsaved:
      "Saving failed. This conversation is temporary for now; keep your previous backup or unlock memory again.",
    working: "Waiting for an answer…",
  },
};
export function mountApp({
  document: doc = document,
  window: win = window,
  vault = new PrivateVault(),
  fetcher = fetch,
} = {}) {
  const $ = (id) => doc.getElementById(id);
  let memory = emptyMemory(),
    ai = false,
    accessCode = "",
    busy = false,
    recognition,
    requestController,
    generation = 0,
    pending = Promise.resolve(),
    disposed = false;
  const t = (key) => COPY[memory.language][key];
  const el = (tag, text, cls) => {
    const n = doc.createElement(tag);
    if (text !== undefined) n.textContent = text;
    if (cls) n.className = cls;
    return n;
  };
  const button = (text, action, cls) => {
    const b = el("button", text, cls);
    b.type = "button";
    b.onclick = action;
    return b;
  };
  const para = (text) => el("p", text);
  function announce(text) {
    $("mode").textContent = text;
  }
  function close() {
    $("panel").close();
  }
  function panel(title) {
    $("panel-title").textContent = title;
    $("panel-content").replaceChildren();
    if (!$("panel").open) $("panel").showModal();
    return $("panel-content");
  }
  function store() {
    if (!vault.unlocked) return;
    const snapshot = structuredClone(memory);
    pending = pending
      .then(() => vault.save(snapshot))
      .then(() => {
        if (!disposed) announce(t("savedStatus"));
      })
      .catch(() => {
        vault.lock();
        announce(t("unsaved"));
      });
  }
  function append(role, text) {
    memory.messages.push({ role, text });
    memory.messages = memory.messages.slice(-200);
    renderMessages();
    store();
  }
  function renderMessages() {
    const box = $("messages");
    box.replaceChildren();
    const all = [{ role: "assistant", text: t("welcome") }, ...memory.messages];
    for (const [i, m] of all.entries()) {
      const article = el("article", undefined, `message ${m.role}`),
        label = el("div", m.role === "user" ? t("you") : "Momentum", "speaker");
      article.append(label, para(m.text));
      if (m.role === "assistant" && i > 0)
        label.append(button(t("read"), () => voice("read", m.text), "read"));
      if (i === 0 && !memory.messages.length) {
        const starters = el("div", undefined, "starters");
        starters.id = "starters";
        for (const text of t("topics"))
          starters.append(
            button(text, () => {
              $("message").value = text;
              void submit();
            }),
          );
        article.append(starters);
      }
      box.append(article);
    }
    if ($("message").value) $("starters")?.setAttribute("hidden", "");
    $("thread").scrollTop = $("thread").scrollHeight;
  }
  function render() {
    doc.documentElement.lang = memory.language;
    doc.documentElement.dir = memory.language === "he" ? "rtl" : "ltr";
    for (const id of [
      "help",
      "journey",
      "benefits",
      "privacy",
      "send",
      "footer",
    ])
      $(id).textContent = t(id);
    $("language").textContent = memory.language === "he" ? "English" : "עברית";
    $("message-label").textContent = t("message");
    $("message").placeholder = t("placeholder");
    $("mic").setAttribute("aria-label", t("mic"));
    $("close-panel").setAttribute("aria-label", t("close"));
    announce(
      vault.unlocked
        ? t("saved")
        : t("session") + " · " + (ai ? t("ready") : t("local")),
    );
    renderMessages();
  }
  async function submit() {
    const message = $("message").value.trim();
    if (!message || busy) return;
    $("message").value = "";
    $("message").style.height = "";
    append("user", message);
    if (needsHuman(message)) {
      append("assistant", localReply(message, memory));
      help();
      return;
    }
    if (!ai || !accessCode) {
      append("assistant", localReply(message, memory));
      if (ai && !accessCode) announce(t("noKey"));
      return;
    }
    let packet = makePacket(message, memory, false);
    const p = panel(t("consent"));
    p.append(para(t("consentText")));
    const label = el("label"),
      check = el("input");
    check.type = "checkbox";
    label.append(check, doc.createTextNode(" " + t("context")));
    const preview = el("pre", JSON.stringify(packet, null, 2));
    check.onchange = () => {
      packet = makePacket(message, memory, check.checked);
      preview.textContent = JSON.stringify(packet, null, 2);
    };
    const approve = button(
      t("approve"),
      async () => {
        const approved = structuredClone(packet),
          requestGeneration = generation;
        close();
        busy = true;
        $("send").disabled = true;
        announce(t("working"));
        requestController = new AbortController();
        try {
          const post = async (url, data) => {
            const r = await fetcher(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessCode}`,
              },
              body: JSON.stringify(data),
              signal: AbortSignal.any([
                requestController.signal,
                AbortSignal.timeout(30000),
              ]),
            });
            if (!r.ok) throw new Error("Gateway unavailable");
            return r.json();
          };
          const { ticket } = await post("/api/consent", {
            packet: approved,
            scope: "openai-request-v1",
          });
          if (requestGeneration !== generation) return;
          const answer = await post("/api/respond", {
            packet: approved,
            ticket,
          });
          if (requestGeneration !== generation) return;
          append("assistant", answer.reply);
          const last = $("messages").lastElementChild;
          for (const c of answer.citations || []) {
            if (safeOfficial(c.url))
              last.append(
                source(c.title, c.url, `${c.reviewedAt} → ${c.expiresAt}`),
              );
          }
          for (const suggestion of answer.suggestions || [])
            last.append(
              button(t("step") + ": " + suggestion, () => journey(suggestion)),
            );
          if (answer.needsHuman) help();
        } catch {
          if (requestGeneration === generation)
            append(
              "assistant",
              t("failedAI") + "\n" + localReply(message, memory),
            );
        } finally {
          if (requestGeneration === generation) {
            busy = false;
            $("send").disabled = false;
            requestController = undefined;
          }
        }
      },
      "primary",
    );
    p.append(
      label,
      preview,
      approve,
      button(t("localInstead"), () => {
        close();
        append("assistant", localReply(message, memory));
      }),
    );
  }
  function safeOfficial(url) {
    try {
      const u = new URL(url);
      return (
        u.protocol === "https:" &&
        !u.username &&
        !u.password &&
        [
          "www.hachvana.mod.gov.il",
          "hachvana.mod.gov.il",
          "www.gov.il",
          "gov.il",
          "shikum.mod.gov.il",
        ].includes(u.hostname)
      );
    } catch {
      return false;
    }
  }
  function source(title, url, detail) {
    const a = el("a", title, "source");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (detail) a.append(el("small", detail));
    return a;
  }
  function help() {
    const p = panel(t("help"));
    p.append(
      para(t("helpNotice")),
      source(
        t("eran") + " · 1201",
        "tel:1201?oai_link_source=model_response_hotline",
      ),
      source(
        t("chat"),
        "https://www.eran.org.il/online-emotional-help/?oai_link_source=model_response_hotline",
      ),
      source(t("rehab"), "https://shikum.mod.gov.il/"),
    );
  }
  async function benefits() {
    const lang = memory.language;
    const p = panel(t("benefits"));
    p.append(
      para(t("sources")),
      source(t("benefitSource"), "https://www.hachvana.mod.gov.il/"),
      source(t("rehab"), "https://shikum.mod.gov.il/"),
    );
    const library = el("div");
    p.prepend(library);
    try {
      const groups = await Promise.all(
        ["benefits", "education", "employment"].map(async (domain) => {
          const r = await fetcher(
            `/api/knowledge?domain=${domain}&language=${lang}`,
          );
          if (!r.ok) return [];
          const value = await r.json();
          return Array.isArray(value.items) ? value.items : [];
        }),
      );
      if (
        disposed ||
        !$("panel")?.open ||
        $("panel-title").textContent !== t("benefits") ||
        memory.language !== lang
      )
        return;
      const records = groups
        .flat()
        .filter(
          (x) => safeOfficial(x.url) && new Date(x.expires_at) > new Date(),
        );
      if (records.length) {
        p.querySelector("p")?.remove();
        library.append(
          para(
            lang === "he"
              ? "מידע שעבר בדיקה מקצועית. יש לבדוק התאמה אישית מול הגוף הרשמי."
              : "Professionally reviewed information. Check your individual situation with the official body.",
          ),
        );
        for (const r of records) {
          const row = el("article", undefined, "goal");
          row.append(
            el("h3", r.title),
            para(r.body),
            source(
              r.title,
              r.url,
              (lang === "he" ? "נבדק: " : "Reviewed: ") +
                new Date(r.reviewed_at).toLocaleDateString(lang) +
                " · " +
                (lang === "he" ? "בתוקף עד: " : "Valid until: ") +
                new Date(r.expires_at).toLocaleDateString(lang),
            ),
          );
          library.append(row);
        }
      }
    } catch {
      /* The official source links remain usable when the local desk is stopped. */
    }
  }
  function field(parent, text, type = "text") {
    const label = el("label", text),
      input = el("input");
    input.type = type;
    label.append(input);
    parent.append(label);
    return input;
  }
  function journey(prefill = "") {
    const p = panel(t("journey"));
    if (!memory.goals.length) p.append(para(t("empty")));
    for (const g of memory.goals) {
      const row = el("div", undefined, "goal " + g.status);
      row.append(para(g.title));
      if (g.due) row.append(el("small", g.due));
      row.append(
        button(t(g.status === "done" ? "reopen" : "done"), () => {
          memory = completeGoal(memory, g.id);
          store();
          journey();
        }),
      );
      p.append(row);
    }
    const title = field(p, t("title"));
    title.maxLength = 300;
    title.value = prefill;
    const due = field(p, t("due"), "date");
    p.append(
      button(
        t("add"),
        () => {
          if (!title.value.trim()) {
            title.focus();
            return;
          }
          memory = addGoal(memory, { title: title.value, due: due.value });
          store();
          journey();
        },
        "primary",
      ),
    );
  }
  async function privacy() {
    const p = panel(t("privacy"));
    p.append(para(t("privacyNotice")));
    const exists = await vault.exists().catch(() => false);
    if (!$("panel").open || $("panel-title").textContent !== t("privacy"))
      return;
    const pass = field(p, t("pass"), "password");
    pass.autocomplete = "off";
    pass.minLength = 12;
    pass.maxLength = 1024;
    const status = el("p", undefined, "small");
    status.setAttribute("role", "status");
    const action = button(
      t(exists ? "unlock" : "create"),
      async () => {
        action.disabled = true;
        try {
          await pending;
          if (exists) memory = await vault.unlock(pass.value);
          else await vault.create(pass.value, memory);
          pass.value = "";
          close();
          render();
        } catch {
          status.textContent = t("error");
        } finally {
          action.disabled = false;
        }
      },
      "primary",
    );
    p.append(
      action,
      button(t("lock"), async () => {
        await pending;
        reset();
        close();
        render();
      }),
      status,
    );
    p.append(
      button(t("backup"), async () => {
        try {
          await pending;
          const blob = new Blob([await vault.exportBackup()], {
              type: "application/json",
            }),
            url = URL.createObjectURL(blob),
            a = el("a");
          a.href = url;
          a.download = "momentum-private-backup.json";
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
          status.textContent = t("exportNone");
        }
      }),
    );
    const file = field(p, t("restore"), "file");
    file.accept = ".json,application/json";
    p.append(
      button(t("restore"), async () => {
        try {
          const f = file.files[0];
          if (!f || f.size > 1600000) throw new Error();
          await pending;
          memory = await vault.importBackup(await f.text(), pass.value);
          pass.value = "";
          close();
          render();
        } catch {
          status.textContent = t("error");
        }
      }),
      button(t("delete"), async () => {
        if (!win.confirm(t("deleteConfirm"))) return;
        await pending;
        await vault.deleteAll();
        reset();
        close();
        render();
      }),
    );
    const code = field(p, t("key"), "password");
    code.autocomplete = "off";
    p.append(
      para(t("keyNote")),
      button(t("setKey"), () => {
        accessCode = code.value;
        code.value = "";
        close();
        render();
      }),
    );
  }
  function voice(kind, text) {
    const Recognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (
      (kind === "input" && !Recognition) ||
      (kind === "read" && !win.speechSynthesis)
    ) {
      announce(t("noVoice"));
      return;
    }
    const p = panel(t("voice"));
    p.append(
      para(t("voiceNotice")),
      button(
        t("allowVoice"),
        () => {
          close();
          if (kind === "read") {
            const u = new win.SpeechSynthesisUtterance(text);
            u.lang = memory.language === "he" ? "he-IL" : "en-US";
            win.speechSynthesis.speak(u);
          } else {
            recognition = new Recognition();
            recognition.lang = memory.language === "he" ? "he-IL" : "en-US";
            recognition.continuous = false;
            recognition.onresult = (e) => {
              $("message").value = e.results[0][0].transcript;
              resize();
              $("message").focus();
            };
            recognition.onerror = () => announce(t("noVoice"));
            try {
              recognition.start();
            } catch {
              announce(t("noVoice"));
            }
          }
        },
        "primary",
      ),
      button(t("cancel"), close),
    );
  }
  function reset() {
    generation++;
    requestController?.abort();
    requestController = undefined;
    busy = false;
    $("send").disabled = false;
    vault.lock();
    memory = emptyMemory(memory.language);
    accessCode = "";
    recognition?.abort();
    win.speechSynthesis?.cancel();
    $("message").value = "";
  }
  function resize() {
    $("message").style.height = "auto";
    $("message").style.height = Math.min($("message").scrollHeight, 96) + "px";
    $("starters")?.toggleAttribute("hidden", !!$("message").value);
  }
  $("compose").onsubmit = (e) => {
    e.preventDefault();
    void submit();
  };
  $("message").oninput = resize;
  $("message").onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      void submit();
    }
  };
  $("language").onclick = () => {
    memory.language = memory.language === "he" ? "en" : "he";
    store();
    if ($("panel").open) close();
    render();
  };
  $("help").onclick = help;
  $("benefits").onclick = benefits;
  $("journey").onclick = () => journey();
  $("privacy").onclick = () => void privacy();
  $("close-panel").onclick = close;
  $("mic").onclick = () => voice("input");
  win.addEventListener("pagehide", () => {
    disposed = true;
    reset();
  });
  render();
  // Only capability discovery, no personal data, credentials or background model call.
  fetcher("/api/status")
    .then((r) => (r.ok ? r.json() : { ai: false }))
    .then((s) => {
      ai = s.ai === true;
      render();
    })
    .catch(() => {});
  return {
    getMemory: () => structuredClone(memory),
    submit,
    ready: () => pending,
  };
}
if (typeof document !== "undefined") mountApp();
