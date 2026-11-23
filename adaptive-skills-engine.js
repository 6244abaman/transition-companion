/* Short adaptive skills interview from Momentum's original 63-skill mapping.
   Candidate priorities only select questions. They NEVER establish a person's competence.
   Source #63 duplicates #55 and is intentionally excluded. */
(function(root,factory){
  const api=factory();
  if(typeof module==="object" && module.exports) module.exports=api;
  else root.MomentumAdaptiveSkills=api;
})(typeof window==="undefined"?globalThis:window,function(){
  "use strict";
  const ACTIVITY_SKILLS={
    field:[1,2,6,7,15,17,38],
    coordinate:[4,5,11,14,24,51],
    lead:[16,18,19,24,38,58],
    analyze:[9,13,38,39,40,42],
    technical:[3,7,9,13,39,55],
    teach:[18,19,21,58],
    care:[21,22,23,57,58],
    communicate:[17,21,23,58],
    create:[7,39,40,41,59]
  };
  // Personal distress, grief and coping skills are never inferred from a soldier's unit.
  const NOT_AUTOMATIC=new Set([27,28,29,32,33,34,35,36,37,60,61]);
  function choose(source,context){
    if(!source || !Array.isArray(source.skills))return [];
    const p=context||{},role=Math.max(0,Math.min(14,Number(p.role)||0)),
      rank=Math.max(0,Math.min(3,Number(p.rank)||0)),
      activities=Array.isArray(p.activities)?p.activities.filter(x=>ACTIVITY_SKILLS[x]):[],
      wanted=Math.max(1,Math.min(10,Number(p.count)||7));
    const candidates=source.skills.filter(skill=>skill && skill.id!==63 && !NOT_AUTOMATIC.has(skill.id))
      .map(skill=>{
        const opportunity=source.opportunities?.[skill.id]?.[role]||0;
        const rankWeight=source.rankOverlays?.[skill.id]?.[rank]||0;
        const activityMatches=activities.filter(name=>ACTIVITY_SKILLS[name].includes(skill.id)).length;
        const score=opportunity*2 + rankWeight*1.5 + activityMatches*3.5;
        return {...skill,priority:score,activityMatches};
      }).sort((a,b)=>b.priority-a.priority || b.activityMatches-a.activityMatches || a.id-b.id);
    const picks=[],domains=new Map();
    for(const skill of candidates){
      if(picks.length>=wanted)break;
      if((domains.get(skill.domain)||0)>=2)continue;
      picks.push(skill);domains.set(skill.domain,(domains.get(skill.domain)||0)+1);
    }
    for(const skill of candidates){
      if(picks.length>=wanted)break;
      if(!picks.some(x=>x.id===skill.id))picks.push(skill);
    }
    return picks;
  }
  function evidenceLevel(answer){
    if(!answer || answer.confirmed!==true || !String(answer.evidence||"").trim())return 0;
    const practice=answer.practice||"once",autonomy=answer.autonomy||"assisted",
      result=answer.result===true;
    if(practice==="repeated" && autonomy==="guided" && result)return 4;
    if(autonomy!=="assisted" && result)return 3;
    if(practice==="repeated")return 2;
    return 1;
  }
  return {ACTIVITY_SKILLS,choose,evidenceLevel};
});