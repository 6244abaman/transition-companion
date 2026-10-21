/* On-device safety cues, independent of external AI availability.
   A narrow safeguard, not diagnosis or continuous monitoring. */
(function(root){
  'use strict';
  function urgent(text){
    const s=String(text||'').toLowerCase();
    return /\b(?:kill myself|end my life|hurt myself|harm myself|suicidal|want to die|planning suicide|overdos(?:e|ed)|kill someone|hurt someone)\b/.test(s)||
      /(?:להתאבד|לשים קץ לחיי|לפגוע בעצמי|להרוג את עצמי|רוצה למות|אובדני|אובדנית|בלעתי כדורים|לפגוע במישהו)/.test(s);
  }
  function reply(lang){return lang==='he'?
    'תודה שאמרת לי. האם אתה בטוח כרגע? אם יש סכנה מיידית, פנה עכשיו לשירותי החירום או לאדם שנמצא לידך. אם אפשר, התרחק מדברים שעלולים לשמש לפגיעה ואל תישאר לבד. אפשר לפתוח כאן את אפשרויות העזרה האנושית. לא התקשרתי ולא הודעתי לאיש, והיישום אינו מנוטר. מה יכול לעזור לך להיות בטוח בדקות הקרובות?':
    'Thank you for telling me. Are you safe right now? If there is immediate danger, contact emergency services or someone nearby now. If you can, move away from anything you could use to hurt yourself or someone else, and stay with a trusted person. You can open human support here. I have not contacted anyone, and this app is not monitored. What would help you stay safe in the next few minutes?';}
  root.MomentumSafety={urgent,reply};
})(window);
