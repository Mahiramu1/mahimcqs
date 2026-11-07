export const exams=['UPSC','TGPSC Groups','APPSC','DSC','Police'];
export const languages=['English','Telugu'];
export function canonicalText(v){return String(v||'').normalize('NFC').replace(/\s+/gu,' ').trim();}
export function checkQuestion(q){return q&&typeof q.question==='string'&&q.question.length>10&&Array.isArray(q.options)&&q.options.length===4&&new Set(q.options.map(s=>String(s).trim())).size===4&&q.options.every(x=>typeof x==='string'&&x.trim())&&Number.isInteger(q.answer)&&q.answer>=0&&q.answer<=3&&typeof q.explanation==='string'&&q.explanation.length>5&&typeof q.source==='string'&&q.source.trim();}
