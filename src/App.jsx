import ReaderNotes from './ReaderNotes.jsx';
import {extractPageText} from './pdfText.js';
import {StudyMaterial,MaterialLibrary} from './StudyMaterial.jsx';
import GuestStudy from './GuestStudy';
import EmailPasswordLogin from './EmailPasswordLogin.jsx';
import {PYQBrowser,CurrentAffairs,PredictionPanel,SubscriptionPanel,AdminPanel} from './ExtraFeatures.jsx';
import {OCRButton,ExportQuestions,MyProgress,SavedLibrary} from './StudyTools.jsx';
import React,{useState,useEffect,useRef} from 'react';
import {onAuthStateChanged,signOut} from 'firebase/auth';
import {collection,addDoc,deleteDoc,doc,getDocs,updateDoc} from 'firebase/firestore';
import {ref,uploadBytesResumable,getBytes,deleteObject} from 'firebase/storage';
import * as pdfjs from 'pdfjs-dist';
import {auth,db,storage,configured} from './firebase';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();
const exams=['UPSC','TGPSC Groups','APPSC','DSC','Police'];
const safe=(x)=>String(x||'').slice(0,100);
async function readPdf(bytes){return pdfjs.getDocument({data:bytes}).promise;}
function getFilePath(uid,id){return 'books/'+uid+'/'+id+'.pdf';}
export default function App(){
const [user,setUser]=useState(null),[isAdmin,setIsAdmin]=useState(false),[zoom,setZoom]=useState(1.25),[loading,setLoading]=useState(true),[books,setBooks]=useState([]),[selected,setSelected]=useState(null),[pdf,setPdf]=useState(null),[page,setPage]=useState(1),[pageText,setPageText]=useState(''),[questions,setQuestions]=useState([]),[answers,setAnswers]=useState({}),[result,setResult]=useState(null),[savedId,setSavedId]=useState(null),[saved,setSaved]=useState([]),[busy,setBusy]=useState(false),[uploadProgress,setUploadProgress]=useState(null),[notice,setNotice]=useState(''),[error,setError]=useState(''),[exam,setExam]=useState('UPSC'),[language,setLanguage]=useState('English'),[count,setCount]=useState(5),[tab,setTab]=useState('study'),[showText,setShowText]=useState(false);const canvas=useRef(null),renderTask=useRef(null),openVersion=useRef(0),readerPosition=useRef(null);
readerPosition.current={pdf,page};
const alert=(message,bad=false)=>{if(bad){setError(message);setNotice('')}else{setNotice(message);setError('')}};
useEffect(()=>{
  let active=true;
  const unsubscribe=onAuthStateChanged(auth,async nextUser=>{
    if(!nextUser){if(active){setUser(null);setIsAdmin(false);setLoading(false);}return;}
    try{
      const token=await nextUser.getIdTokenResult();
      // Remove legacy Google/phone sessions, not only their sign-in buttons.
      if(token.signInProvider!=='password'){
        await signOut(auth);
        if(active)alert('MahiMCQs now uses email and password. Contact support to migrate an older Google or mobile OTP account.',true);
        return;
      }
      if(active){setUser(nextUser);setIsAdmin(token.claims.admin===true);setLoading(false);}
    }catch{
      await signOut(auth).catch(()=>{});
      if(active){setUser(null);setIsAdmin(false);setLoading(false);alert('Your session could not be verified. Please sign in again.',true);}
    }
  });
  return()=>{active=false;unsubscribe();};
},[]);
useEffect(()=>{if(!user){openVersion.current++;setBooks([]);setSelected(null);setPdf(null);setSaved([]);return;}refreshBooks();refreshSaved()},[user]);
async function refreshBooks(){if(!auth.currentUser)return;try{const snap=await getDocs(collection(db,'users',auth.currentUser.uid,'books'));setBooks(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)))}catch(e){alert('Could not load library: '+e.message,true)}}
async function refreshSaved(){if(!auth.currentUser)return;try{const snap=await getDocs(collection(db,'users',auth.currentUser.uid,'saved'));setSaved(snap.docs.map(d=>({id:d.id,...d.data()})))}catch(e){console.error(e)}}
async function upload(e){const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.type!=='application/pdf'||file.size>20*1024*1024){alert('Upload a PDF smaller than 20 MB',true);return}setBusy(true);try{const data=await file.arrayBuffer();const test=await pdfjs.getDocument({data:new Uint8Array(data.slice(0))}).promise;const pageCount=test.numPages;await test.destroy();if(pageCount>500)throw Error('Maximum 500 pages per book');const uid=user.uid;const docRef=await addDoc(collection(db,'users',uid,'books'),{title:safe(file.name.replace(/\.pdf$/i,'')),pages:pageCount,createdAt:new Date(),language:'English',exam,storagePath:'pending'});const location=getFilePath(uid,docRef.id);try{const job=uploadBytesResumable(ref(storage,location),file,{contentType:'application/pdf'});await new Promise((resolve,reject)=>job.on('state_changed',s=>setUploadProgress(Math.round(s.bytesTransferred/s.totalBytes*100)),reject,resolve));await updateDoc(docRef,{storagePath:location});}catch(e){await deleteObject(ref(storage,location)).catch(()=>{});await deleteDoc(docRef);throw e;}setUploadProgress(null);await refreshBooks();alert('Book uploaded. Open it from your library.')}catch(e){alert('Upload failed: '+e.message,true)}finally{setBusy(false);setUploadProgress(null)}}
async function openBook(b,requestedPage){const ver=++openVersion.current;setBusy(true);setSelected(b);setTab('study');setPdf(null);setQuestions([]);setSavedId(null);setResult(null);setAnswers({});setPage(1);setPageText('');try{const bytes=await getBytes(ref(storage,b.storagePath),20*1024*1024);const p=await readPdf(bytes);if(ver!==openVersion.current){await p.destroy();return}const start=requestedPage??b.lastPage??1;
setPage(Number.isInteger(start)?Math.min(p.numPages,Math.max(1,start)):1);
setPdf(p);alert('Book ready');return true
}catch(e){if(ver===openVersion.current)alert('Could not open PDF: '+e.message,true);return false}
finally{if(ver===openVersion.current)setBusy(false)}}
useEffect(()=>()=>{pdf?.destroy().catch(()=>{});},[pdf]);
useEffect(()=>{if(!pdf||tab!=='study')return;let gone=false;async function render(){try{if(renderTask.current){renderTask.current.cancel();try{await renderTask.current.promise}catch{}}const p=await pdf.getPage(page);if(gone)return;const viewport=p.getViewport({scale:zoom});const cv=canvas.current;if(!cv)return;cv.width=Math.floor(viewport.width);cv.height=Math.floor(viewport.height);const ctx=cv.getContext('2d');renderTask.current=p.render({canvasContext:ctx,viewport});await renderTask.current.promise;}catch(e){if(e.name!=='RenderingCancelledException'&&!gone)alert('Could not render page: '+e.message,true)}}render();return()=>{gone=true;renderTask.current?.cancel()}},[pdf,page,tab,zoom]);
useEffect(()=>{
  if(!pdf)return;
  let active=true;
  extractPageText(pdf,page).then(text=>{
    if(active)setPageText(current=>current||text);
  }).catch(()=>{if(active)alert('Could not extract page text. Try OCR or enter the text manually.',true)});
  return()=>{active=false};
},[pdf,page]);
useEffect(()=>{
  if(!user||!selected||!pdf)return;
  const timer=setTimeout(()=>{
    const bookRef=doc(db,'users',user.uid,'books',selected.id);
    updateDoc(bookRef,{lastPage:page}).then(()=>{
      setBooks(previous=>previous.map(book=>book.id===selected.id?{...book,lastPage:page}:book));
    }).catch(()=>{});
  },500);
  return()=>clearTimeout(timer);
},[user,selected,pdf,page]);
function move(n){if(!pdf)return;const next=Math.min(pdf.numPages,Math.max(1,Math.trunc(n)));if(next===page)return;setPageText('');setPage(next);setQuestions([]);setSavedId(null);setResult(null);setAnswers({});}
async function api(path,data){const token=await user.getIdToken();const response=await fetch('/api/'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify(data)});const output=await response.json().catch(()=>({}));if(!response.ok)throw Error(output.error||'Request failed');return output;}
async function generate(){if(!selected)return;setBusy(true);setQuestions([]);setAnswers({});setResult(null);setSavedId(null);try{const data=await api('generate',{bookId:selected.id,page,text:pageText,exam,language,count});setQuestions(data.questions);alert(data.cached?'Loaded cached questions':'Questions generated from current page')}catch(e){alert(e.message,true)}finally{setBusy(false)}}
async function saveQuestions(){if(!questions.length)return null;setBusy(true);try{if(savedId)return savedId;const result=await api('save',{bookId:selected.id,page,questions});setSavedId(result.id);await refreshSaved();alert('Question set saved');return result.id}catch(e){alert(e.message,true);return null}finally{setBusy(false)}}
async function submit(){const id=savedId||await saveQuestions();if(!id)return;setBusy(true);try{const a=questions.map((_,i)=>answers[i]??null);const result=await api('submit',{savedId:id,answers:a,attemptId:crypto.randomUUID()});setResult(result);alert('Quiz scored securely by server')}catch(e){alert(e.message,true)}finally{setBusy(false)}}
async function remove(b){if(!window.confirm('Delete this book and its PDF?'))return;setBusy(true);try{await deleteObject(ref(storage,b.storagePath));await deleteDoc(doc(db,'users',user.uid,'books',b.id));if(selected?.id===b.id){setSelected(null);setPdf(null)}await refreshBooks();alert('Book deleted')}catch(e){alert('Deletion failed: '+e.message,true)}finally{setBusy(false)}}
async function openSaved(s){
  const book=books.find(b=>b.id===s.bookId);
  if(book){
    if(!await openBook(book,s.page))return;
  }else{
    setPdf(null);
    setSelected({id:s.bookId,title:'Saved quiz',pages:s.page});
    setPage(s.page);
    setPageText('');
    setTab('study');
  }
  setQuestions(s.questions);setAnswers({});setResult(null);setSavedId(s.id);
}
function exportJson(){const blob=new Blob([JSON.stringify({book:selected?.title,page,questions},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='mahimcqs-questions.json';a.click();URL.revokeObjectURL(a.href)}
return <><header className="top"><div className="brand">MahiMCQs <small>గ్యాన్-అస్త్ర • Learn from every page</small></div><div className="actions">{user&&<><span className="small">{user.email}</span><button className="btn secondary" onClick={()=>signOut(auth)}>Sign out</button></>}</div></header><main className="wrap">
{configured&&loading?<div className="empty">Checking session…</div>:!user?<GuestStudy signIn={<EmailPasswordLogin/>}/>:<div className="grid"><aside className="card"><h2>My Books</h2><label className="btn" style={{display:'block',textAlign:'center'}}>+ Upload PDF<input type="file" accept="application/pdf" hidden onChange={upload}/></label>{uploadProgress!==null&&<p>Uploading {uploadProgress}%</p>}{books.length===0&&<p className="muted">No books yet. Upload your first PDF.</p>}{books.map(b=><div key={b.id}><button className={'book '+(b.id===selected?.id?'active':'')} onClick={()=>openBook(b)}>{b.title}<div className="small muted">{b.pages} pages</div></button><button className="btn outline small" onClick={()=>remove(b)}>Delete</button></div>)}<hr/><div className="actions"><button className="btn secondary" onClick={()=>setTab('library')}>YourMcqs ({saved.length})</button><button className="btn secondary" onClick={()=>setTab('materials')}>Study materials</button><button className="btn secondary" onClick={()=>setTab('progress')}>Progress</button><button className="btn secondary" onClick={()=>setTab('study')}>Study</button><button className="btn secondary" onClick={()=>setTab('pyqs')}>PYQs</button><button className="btn secondary" onClick={()=>setTab('news')}>Current Affairs</button><button className="btn secondary" onClick={()=>setTab('membership')}>Membership</button>{isAdmin&&<button className="btn secondary" onClick={()=>setTab('admin')}>Admin</button>}</div>{tab==='saved'&&<p className="small muted">Use the saved library below to search, reopen or export questions.</p>}</aside><div>{tab==='pyqs'?<PYQBrowser/>:tab==='news'?<CurrentAffairs/>:tab==='membership'?<SubscriptionPanel/>:tab==='admin'&&isAdmin?<AdminPanel/>:tab==='materials'?<MaterialLibrary key={user.uid} uid={user.uid} api={api}/>:tab==='progress'?<MyProgress uid={user.uid}/>:tab==='library'?<SavedLibrary uid={user.uid} books={books} onOpen={openSaved}/>:selected?<><div className="card"><h2>{selected.title}</h2><div className="toolbar"><button className="btn secondary" disabled={!pdf||page<=1} onClick={()=>move(page-1)}>← Previous</button><label className="field">Page<input type="number" min="1" max={pdf?.numPages||1} value={page} onChange={e=>move(Number(e.target.value)||1)} style={{width:85}}/></label><span className="muted">/ {pdf?.numPages||selected.pages}</span><button className="btn secondary" disabled={!pdf||page>=pdf.numPages} onClick={()=>move(page+1)}>Next →</button><label className="field">Zoom<select value={zoom} onChange={event=>setZoom(Number(event.target.value))}><option value={0.8}>80%</option><option value={1.25}>125%</option><option value={1.75}>175%</option><option value={2}>200%</option></select></label></div></div><div className="workspace" style={{marginTop:18}}><section className="card"><h2>Book Reader</h2><div className="viewer">{pdf?<canvas ref={canvas}/>:<div className="empty">Opening PDF…</div>}</div><OCRButton key={selected.id+':'+page} pdf={pdf} page={page} onText={text=>{if(readerPosition.current.pdf===pdf&&readerPosition.current.page===page){setPageText(text);setShowText(true)}}}/><button className="btn secondary" style={{marginTop:12}} onClick={()=>setShowText(!showText)}>{showText?'Hide':'Show / edit'} extracted text</button>{showText&&<><textarea rows={9} value={pageText} onChange={e=>setPageText(e.target.value)} aria-label="Editable page text"/><p className="small muted">For a scanned page, run OCR and review the extracted text before generating questions.</p></>}{pdf&&<ReaderNotes key={selected.id+':'+page} uid={user.uid} bookId={selected.id} page={page}/>}</section><div className="study-stack"><StudyMaterial key={selected.id} book={selected} pdf={pdf} page={page} pageText={pageText} api={api}/><section className="card"><h2>Single-page quiz</h2><div className="toolbar"><label className="field">Exam<select value={exam} onChange={e=>setExam(e.target.value)}>{exams.map(e=><option key={e}>{e}</option>)}</select></label><label className="field">Language<select value={language} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>Telugu</option></select></label><label className="field">Questions<select value={count} onChange={e=>setCount(Number(e.target.value))}>{[3,5,10].map(n=><option key={n}>{n}</option>)}</select></label></div><p className="small muted">Page {page} · {pageText.length} extracted characters</p><button className="btn" disabled={busy||!pdf||pageText.length<100} onClick={generate}>{busy?'Working…':'Generate Page MCQs'}</button>{pageText.length<100&&<p className="muted small">This page needs at least 100 characters. Open the text editor to review or correct extraction.</p>}<PredictionPanel bookId={selected?.id} page={page} text={pageText} exam={exam} language={language}/>{questions.map((q,i)=><div className="question" key={q.id||i}><strong>{i+1}. {q.question}</strong>{q.options.map((o,j)=><label key={j} className={'option '+(answers[i]===j?'selected':'')}><input type="radio" name={'q'+i} checked={answers[i]===j} disabled={Boolean(result)} onChange={()=>setAnswers(a=>({...a,[i]:j}))}/> {String.fromCharCode(65+j)}. {o}</label>)}{result&&<p><strong>Correct answer: {String.fromCharCode(65+q.answer)}</strong><br/>{q.explanation}<br/><small>Source: {q.source}</small></p>}</div>)}{questions.length>0&&<div className="actions"><button className="btn secondary" disabled={busy} onClick={saveQuestions}>Save MCQs</button><button className="btn" disabled={busy||Boolean(result)} onClick={submit}>Submit quiz</button><button className="btn outline" onClick={exportJson}>Export JSON</button><ExportQuestions questions={questions} title={selected.title} page={page} language={language}/></div>}{result&&<div className="status success"><h3>Score: {result.score} / {result.total}</h3>Review the correct answers above.</div>}</section></div></div></>:<div className="card hero"><h1>Welcome to your library</h1><p>Upload a PDF to start learning page by page.</p><p className="muted">Select pages to generate notes, quizzes and flashcards from your book.</p></div>}</div></div>}
{notice&&<div className="status success" role="status">{notice}</div>}{error&&<div className="status error" role="alert">{error}</div>}
</main></>}
