// Curated dataset loader: only entries with explicit exam-paper provenance can be displayed as verified PYQs.
// This application ships with no claims about authentic past papers.
import fs from 'node:fs';
const file=process.env.PYQ_DATA_PATH;
let data=[];
if(file){try{const loaded=JSON.parse(fs.readFileSync(file,'utf8'));if(!Array.isArray(loaded))throw Error('PYQ dataset must be an array');data=loaded.filter(x=>x&&typeof x.exam==='string'&&Number.isInteger(x.year)&&typeof x.question==='string'&&typeof x.sourceUrl==='string'&&/^https?:\/\//.test(x.sourceUrl)&&typeof x.paper==='string'&&x.paper&&Array.isArray(x.options)&&x.options.length===4&&Number.isInteger(x.answer)&&x.answer>=0&&x.answer<4)}catch(e){console.warn('PYQ dataset not loaded:',e.message)}}
export function searchPYQ({exam,term,year}){return data.filter(q=>(!exam||q.exam.toLowerCase()===exam.toLowerCase())&&(!year||q.year===year)&&(!term||(q.question+' '+(q.topic||'')).toLowerCase().includes(term.toLowerCase()))).slice(0,100).map(q=>({...q,provenance:'dataset'}))}
export function pyqCount(){return data.length}
