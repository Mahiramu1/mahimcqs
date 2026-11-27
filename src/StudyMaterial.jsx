import React, {useEffect, useState} from 'react';
import {collection, limit, onSnapshot, orderBy, query} from 'firebase/firestore';
import {db} from './firebase';
import {extractPageText, recognizePage} from './pdfText.js';
import {MAX_SELECTED_PAGES, parsePages} from '../shared/page-selection';

const exams = ['UPSC', 'TGPSC Groups', 'APPSC', 'SSC', 'Banking', 'Railways', 'Police', 'DSC', 'NEET', 'EAPCET', 'NCERT', 'General competitive examinations'];

export function StudyMaterial({pdf, book, page, pageText, api}) {
  const [range, setRange] = useState('');
  const [mode, setMode] = useState('separate');
  const [exam, setExam] = useState('UPSC');
  const [language, setLanguage] = useState('English');
  const [useOCR, setUseOCR] = useState(false);
  const [count, setCount] = useState(5);
  const [difficulty, setDifficulty] = useState('Mixed');
  const [length, setLength] = useState('Short');
  const [results, setResults] = useState([]);
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  let pages = [];
  let rangeError = '';
  try {
    pages = parsePages(range.trim() || String(page), pdf?.numPages ?? book.pages);
  } catch (err) {
    rangeError = err.message;
  }

  async function run(event) {
    event.preventDefault();
    if (rangeError || !pdf || busy) return;
    setResults([]);
    setError('');
    setActive(0);
    setBusy(true);
    try {
      const currentPage = page;
      const currentText = pageText;
      const sources = [];
      for (const number of pages) {
        setStatus(`Reading page ${number}…`);
        let text = number === currentPage && currentText.trim()
          ? currentText
          : await extractPageText(pdf, number);
        if (useOCR && text.trim().replace(/\s+/gu, ' ').length < 40) {
          setStatus(`Running OCR on page ${number}…`);
          text = await recognizePage(pdf, number, status => setStatus(`Page ${number} OCR · ${status}`));
        }
        if (text.trim().replace(/\s+/gu, ' ').length < 40) {
          throw new Error(`Page ${number} needs readable text. Open that page and run OCR or edit its extracted text.`);
        }
        sources.push({page: number, text});
      }
      const batches = mode === 'combined' ? [sources] : sources.map(source => [source]);
      for (const batch of batches) {
        setStatus(`Generating study material for ${batch.map(item => item.page).join(', ')}…`);
        const result = await api('study-material', {bookId: book.id, pages: batch, mode, exam, language, count, difficulty, length});
        setResults(previous => [...previous, result]);
      }
      setStatus('Study material saved to your library.');
    } catch (err) {
      setError(err.message);
      setStatus('');
    } finally {
      setBusy(false);
    }
  }

  return <section className="card study-material">
    <h2 id="generate-material">Generate study material</h2>
    <form onSubmit={run}>
      <fieldset disabled={busy}>
        <legend className="sr-only">Generation settings</legend>
        <label className="field">Pages
          <input value={range} onChange={event => setRange(event.target.value)} placeholder={`Current page (${page}), or 1-3, 5`} aria-describedby="page-selection-help"/>
        </label>
        <p id="page-selection-help" className="small muted">
          {rangeError || `${pages.length} of ${MAX_SELECTED_PAGES} pages selected · ${mode === 'combined' ? 1 : pages.length} generation requests before cache · ${mode === 'combined' ? count : count * pages.length} MCQs`}
        </p>
        <div className="material-controls">
          <label className="field">Generation mode
            <select value={mode} onChange={event => setMode(event.target.value)}>
              <option value="separate">Separate result for each page</option>
              <option value="combined">Combine selected pages</option>
            </select>
          </label>
          <Choice label="Examination" value={exam} onChange={setExam} values={exams}/>
          <Choice label="Language" value={language} onChange={setLanguage} values={['English', 'Telugu', 'Bilingual']}/>
          <Choice label="MCQs per result" value={count} onChange={value => setCount(Number(value))} values={[3, 5, 10]}/>
          <Choice label="Difficulty" value={difficulty} onChange={setDifficulty} values={['Easy', 'Moderate', 'Hard', 'Mixed']}/>
          <Choice label="Notes length" value={length} onChange={setLength} values={['Short', 'Standard', 'Detailed']}/>
        </div>
        <label className="option"><input type="checkbox" checked={useOCR}
          onChange={event => setUseOCR(event.target.checked)}/> Run English and Telugu OCR on pages with little text</label>
        <button type="submit" className="btn" disabled={!pdf || Boolean(rangeError)}>Generate notes, MCQs and flashcards</button>
      </fieldset>
    </form>
    {status && <p role="status">{status}</p>}
    {error && <p className="status error" role="alert">{error}</p>}
    {results.length > 1 && <Choice label="Generated result" value={active} onChange={value => setActive(Number(value))}
      values={results.map((_, index) => index)} display={index => `Pages ${results[index].pages.join(', ')}`}/>}
    {results[active] && <MaterialResult key={results[active].id} record={results[active]} api={api}/>}
  </section>;
}

function Choice({label, value, onChange, values, display = value => value}) {
  return <label className="field">{label}
    <select value={value} onChange={event => onChange(event.target.value)}>
      {values.map(option => <option key={option} value={option}>{display(option)}</option>)}
    </select>
  </label>;
}

export function MaterialLibrary({uid, api}) {
  const [records, setRecords] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => onSnapshot(
    query(collection(db, 'users', uid, 'study_material'), orderBy('createdAt', 'desc'), limit(100)),
    snapshot => setRecords(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))),
    () => setError('Could not load saved study material.')
  ), [uid]);
  const record = records?.find(item => item.id === selected);
  return <section className="card study-material">
    <h2>Saved study material</h2>
    {error ? <p role="alert">{error}</p> : !records ? <p role="status">Loading…</p> :
      !records.length ? <p className="muted">Generated notes, MCQs and flashcards will appear here.</p> :
        <Choice label="Saved result" value={selected ?? ''} onChange={setSelected}
          values={['', ...records.map(item => item.id)]} display={id => {
            const item = records.find(record => record.id === id);
            return item ? `${item.bookTitle} · pp. ${item.pages.join(', ')} · ${item.material.title}` : 'Choose a result';
          }}/>}
    {record && <MaterialResult key={record.id} record={record} api={api}/>}
  </section>;
}

function Citation({item}) {
  return <small className="material-citation">Page {item.page} · <q>{item.quote}</q></small>;
}

function MaterialResult({record, api}) {
  const [view, setView] = useState('Notes');
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const {material, pages, language, bookTitle} = record;
  const {title, notes, questions, flashcards} = material;
  const handwritten = view === 'Handwritten';
  const uid = React.useId();
  async function submit(event) {
    event.preventDefault();
    if (submitting || score) return;
    setSubmitting(true);
    setError('');
    const id = attemptId ?? crypto.randomUUID();
    setAttemptId(id);
    try {
      const result = await api('study-attempt', {
        materialId: record.id, attemptId: id,
        answers: questions.map((_, index) => answers[index] ?? null),
      });
      setAnswers(Object.fromEntries(result.answers.map((answer, index) => [index, answer])));
      setScore(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function print() {
    const popup = window.open('', '_blank', 'width=960,height=720');
    if (!popup) {
      setError('Allow pop-ups to print this material.');
      return;
    }
    popup.opener = null;
    const doc = popup.document;
    doc.title = title;
    doc.documentElement.lang = language === 'Telugu' ? 'te' : 'en';
    const style = doc.createElement('style');
    style.textContent = 'body{font:16px system-ui,sans-serif;margin:2rem;color:#172437} article{break-inside:avoid;margin:1rem 0} small{display:block}';
    doc.head.append(style);
    const add = (parent, tag, value) => {
      const element = doc.createElement(tag);
      element.textContent = value;
      parent.append(element);
      return element;
    };
    add(doc.body, 'h1', title);
    add(doc.body, 'p', `${bookTitle} · Pages ${pages.join(', ')} · ${language}`);
    add(doc.body, 'h2', 'Notes');
    for (const note of notes) {
      const section = add(doc.body, 'article', '');
      add(section, 'h3', note.heading);
      add(section, 'p', note.text);
      add(section, 'small', `Page ${note.page} · ${note.quote}`);
    }
    add(doc.body, 'h2', 'Practice questions');
    for (const question of questions) {
      const section = add(doc.body, 'article', '');
      add(section, 'strong', question.question);
      question.options.forEach((option, index) => add(section, 'div', `${'ABCD'[index]}. ${option}`));
      add(section, 'p', `Answer ${'ABCD'[question.answer]} · ${question.explanation}`);
      add(section, 'small', `Page ${question.page} · ${question.quote}`);
    }
    add(doc.body, 'h2', 'Flashcards');
    for (const flashcard of flashcards) {
      const section = add(doc.body, 'article', '');
      add(section, 'strong', flashcard.front);
      add(section, 'p', flashcard.back);
      add(section, 'small', `Page ${flashcard.page} · ${flashcard.quote}`);
    }
    popup.print();
  }

  return <section className="material-result" lang={language === 'Telugu' ? 'te' : undefined}>
    <h3>{title}</h3>
    <p className="muted small">{bookTitle} · Pages {pages.join(', ')} · {language}{record.cached ? ' · From cache' : ''}</p>
    <div className="actions" aria-label="Study material views">
      {['Notes', 'Handwritten', 'MCQs', 'Flashcards'].map(tab =>
        <button type="button" key={tab} className={'btn ' + (view === tab ? '' : 'secondary')}
          aria-pressed={view === tab} onClick={() => setView(tab)}>{tab}</button>)}
      <button type="button" className="btn outline" onClick={print}>Print / Save PDF</button>
    </div>
    {(view === 'Notes' || handwritten) && <div className={handwritten ? 'handwritten-notes' : ''}>
      {notes.map((note, index) => <article className="material-note" key={index}>
        <h4>{note.heading}</h4><p>{note.text}</p><Citation item={note}/>
      </article>)}
    </div>}
    {view === 'MCQs' && <form onSubmit={submit}>
      {questions.map((question, index) => <fieldset className="question" key={index} disabled={Boolean(score) || submitting}>
        <legend>{index + 1}. {question.question}</legend>
        {question.options.map((option, position) => <label className="option" key={position}>
          <input type="radio" name={`${uid}-${index}`} checked={answers[index] === position}
            onChange={() => {setAttemptId(null); setAnswers(previous => ({...previous, [index]: position}));}}/> {option}
        </label>)}
        {score && <><p><strong>{question.options[question.answer]}</strong> · {question.explanation}</p><Citation item={question}/></>}
      </fieldset>)}
      {score ? <p role="status">Score {score.score} / {score.total}</p> :
        <button type="submit" className="btn" disabled={submitting || !Object.keys(answers).length}>Check answers</button>}
    </form>}
    {view === 'Flashcards' && flashcards.map((card, index) => <details className="question" key={index}>
      <summary>{card.front}</summary><p>{card.back}</p><Citation item={card}/>
    </details>)}
    {error && <p className="status error" role="alert">{error}</p>}
  </section>;
}
