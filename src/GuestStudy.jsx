import React, { useEffect, useRef, useState } from 'react';
import { getDocument } from 'pdfjs-dist';
import { OCRButton } from './StudyTools';
import { printQuestionSet } from './print';

const lesson = 'Plants absorb carbon dioxide through small openings called stomata. Chlorophyll absorbs the light energy needed for photosynthesis. Roots take up water and minerals from the soil. Oxygen is released when water molecules split during photosynthesis.';
const example = [
  ['Which structures let carbon dioxide enter a leaf?', ['Roots', 'Stomata', 'Water molecules', 'Minerals'], 1],
  ['What absorbs light energy for photosynthesis?', ['Chlorophyll', 'Carbon dioxide', 'Water', 'Oxygen'], 0],
  ['What do roots take up from the soil?', ['Light and oxygen', 'Carbon dioxide', 'Water and minerals', 'Chlorophyll'], 2],
  ['Which gas is released when water molecules split?', ['Nitrogen', 'Hydrogen', 'Carbon dioxide', 'Oxygen'], 3]
].map(([question, options, answer], i) => ({
  question, options, answer, explanation: lesson.split('. ')[i].replace(/\.$/, '') + '.', source: lesson.split('. ')[i]
}));

function PageReader({ pdf, page }) {
  const canvas = useRef(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let stale = false;
    let render;
    async function load() {
      const current = await pdf.getPage(page);
      if (stale) return;
      const viewport = current.getViewport({ scale: 1.3 });
      canvas.current.width = viewport.width;
      canvas.current.height = viewport.height;
      render = current.render({ canvasContext: canvas.current.getContext('2d'), viewport });
      await render.promise;
      const content = await current.getTextContent();
      if (!stale) setText(content.items.map(item => item.str).join(' '));
    }
    load().catch(e => { if (!stale) setError(e.message); });
    return () => { stale = true; render?.cancel(); };
  }, [pdf, page]);
  return <><div className="viewer"><canvas ref={canvas} aria-label={'PDF page ' + page}/></div>
    {error && <p role="alert">{error}</p>}
    <OCRButton pdf={pdf} page={page} onText={setText}/>
    <label className="field">Page text<textarea rows={5} value={text} onChange={e => setText(e.target.value)}/></label></>;
}

export default function GuestStudy({ signIn }) {
  const [active, setActive] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [pdf, setPdf] = useState(null);
  const [title, setTitle] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const version = useRef(0);
  useEffect(() => () => { pdf?.destroy(); }, [pdf]);
  useEffect(() => () => { version.current++; }, []);
  async function openFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const id = ++version.current;
    setError('');
    try {
      if (file.size > 20 * 1024 * 1024) throw Error('Choose a PDF smaller than 20 MB.');
      const document = await getDocument({data: await file.arrayBuffer()}).promise;
      if (id !== version.current) { await document.destroy(); return; }
      setPage(1); setTitle(file.name); setPdf(document);
    } catch (e) { if (id === version.current) setError(e.message); }
  }
  const score = example.filter((q, i) => answers[i] === q.answer).length;
  return <section className="card" style={{maxWidth:850, margin:'24px auto'}}>
    <h1>Study with MahiMCQs</h1>
    <p>Read a PDF on this device or practise with a short biology quiz.</p>
    <div className="actions"><label className="btn secondary">Open a PDF<input type="file" hidden accept="application/pdf" onChange={openFile}/></label>
      <button className="btn" onClick={() => setActive(true)}>Start biology quiz</button></div>
    {error && <p role="alert">{error}</p>}
    {pdf && <section><h2>{title}</h2><div className="toolbar">
      <button className="btn secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
      <span>Page {page} of {pdf.numPages}</span>
      <button className="btn secondary" disabled={page === pdf.numPages} onClick={() => setPage(page + 1)}>Next</button></div>
      <PageReader key={pdf.fingerprints[0] + '-' + page} pdf={pdf} page={page}/></section>}
    {active && <section><h2>Photosynthesis</h2><p>{lesson}</p>
      {example.map((q,i) => <fieldset className="question" key={q.question}><legend>{i+1}. {q.question}</legend>
        {q.options.map((option,j) => <label className="option" key={option}><input type="radio" disabled={submitted}
          name={'practice-'+i} checked={answers[i] === j} onChange={() => setAnswers({...answers,[i]:j})}/> {option}</label>)}
        {submitted && <p>{answers[i] === q.answer ? 'Correct.' : 'Answer: ' + q.options[q.answer] + '.'} {q.explanation}</p>}
      </fieldset>)}
      {submitted ? <><p role="status">Score: {score} / {example.length}</p><div className="actions">
        <button className="btn" onClick={() => { setSubmitted(false); setAnswers({}); }}>Try again</button>
        <button className="btn secondary" onClick={() => {try { printQuestionSet({title:'Photosynthesis',questions:example,page:1,language:'English'}); } catch(e) {setError(e.message);} }}>Print / Save PDF</button></div></>
        : <button className="btn" disabled={Object.keys(answers).length !== example.length} onClick={() => setSubmitted(true)}>Score quiz</button>}</section>}
    {signIn && <section><h2>Your study account</h2><p>Sign in to save books and generate English or Telugu questions from your pages.</p>{signIn}</section>}
  </section>;
}
