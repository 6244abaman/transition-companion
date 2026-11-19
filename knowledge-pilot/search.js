/* Public records only. The search query is scored on this device. */
(function(root) {
  const clean = text => String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  function search(items, query, collection, language, now = Date.now()) {
    const terms = [...new Set(clean(query).split(' ').filter(t => t.length > 1))];
    const rows = items.filter(item => (!collection || item.collection === collection) &&
      !['closed','ended','retired','draft','expired'].includes(item.status) &&
      ![item.deadline,item.validUntil,item.eventAt,item.nextReviewDue].some(d => d && Date.parse(d) <= now));
    return rows.map(item => {
      const title = clean(item[language].title + ' ' + (item.keywords || ''));
      const text = clean(Object.values(item[language]).join(' '));
      const score = terms.reduce((n,t) => n + (title.includes(t) ? 4 : text.includes(t) ? 1 : 0),0);
      return {item,score};
    }).filter(r => !terms.length || r.score).sort((a,b) => b.score-a.score).map(r => r.item);
  }
  if(typeof module !== 'undefined') module.exports = search;
  else root.searchKnowledge = search;
})(globalThis);
