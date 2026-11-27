import {recognizePage} from './pdfText.js';
import React,{useState} from 'react';
import {collection,getDocs,query,where,deleteDoc,doc} from 'firebase/firestore';
import {db} from './firebase';
import {printQuestionSet} from './print';
export function OCRButton({pdf,page,onText}){
  const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
  async function run(){
    setBusy(true);setMessage('Rendering scanned page…');
    try{
      const text=await recognizePage(pdf,page,setMessage);
      if(!text)throw Error('No readable text detected. Try a clearer scan.');
      onText(text);setMessage('OCR complete. Review the extracted text before generation.');
    }catch(error){setMessage('OCR error: '+error.message)}
    finally{setBusy(false)}
  }
  return <div><button className="btn secondary" disabled={busy||!pdf} onClick={run}>
    {busy?'Reading…':'OCR scanned page (English / Telugu)'}</button>
    <p className="small muted" role="status">{message}</p></div>;
}
export function ExportQuestions({questions,title,page,language='English'}){return <button className="btn secondary" disabled={!questions?.length} onClick={()=>printQuestionSet({questions,title,page,language})}>Print / Save PDF</button>}
export function MyProgress({uid}){const [results,setResults]=useState([]),[state,setState]=useState('');async function load(){setState('Loading…');try{const snap=await getDocs(collection(db,'users',uid,'attempts'));setResults(snap.docs.map(d=>d.data()).sort((a,b)=>b.createdAt-a.createdAt));setState('')}catch(e){setState(e.message)}}return <section className="card"><h2>My Quiz Progress</h2><button className="btn secondary" onClick={load}>Load progress</button><p role="status">{state}</p>{results.length>0&&<><p>Attempts: {results.length} · Accuracy: {(100*results.reduce((a,r)=>a+r.score,0)/Math.max(1,results.reduce((a,r)=>a+r.total,0))).toFixed(1)}%</p>{results.slice(0,15).map((r,i)=><div className="question" key={i}>{new Date(r.createdAt).toLocaleDateString()} — {r.score}/{r.total} correct</div>)}</>}</section>}
export function SavedLibrary({uid,books,onOpen}){const [sets,setSets]=useState([]),[find,setFind]=useState(''),[error,setError]=useState('');async function refresh(){try{const snap=await getDocs(collection(db,'users',uid,'saved'));setSets(snap.docs.map(d=>({id:d.id,...d.data()})));setError('')}catch(e){setError(e.message)}}async function remove(id){if(!window.confirm('Delete this saved question set?'))return;try{await deleteDoc(doc(db,'users',uid,'saved',id));await refresh()}catch(e){setError(e.message)}}return <section className="card"><h2>YourMcqs Library</h2><div className="toolbar"><button className="btn secondary" onClick={refresh}>Load saved MCQs</button><input placeholder="Search book or question" value={find} onChange={e=>setFind(e.target.value)}/></div>{error&&<p className="status error">{error}</p>}{sets.filter(s=>((books.find(b=>b.id===s.bookId)?.title||'')+' '+s.questions.map(q=>q.question).join(' ')).toLowerCase().includes(find.toLowerCase())).map(s=><div key={s.id} className="question"><strong>{books.find(b=>b.id===s.bookId)?.title||'Deleted book'} · Page {s.page}</strong><p>{s.questions.length} questions</p><div className="actions"><button className="btn" onClick={()=>onOpen(s)}>Open</button><ExportQuestions questions={s.questions} title={books.find(b=>b.id===s.bookId)?.title} page={s.page}/><button className="btn outline" onClick={()=>remove(s.id)}>Delete</button></div></div>)}</section>}
