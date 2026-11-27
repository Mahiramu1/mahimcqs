import React, {useEffect, useState} from 'react';
import {doc, getDoc, setDoc} from 'firebase/firestore';
import {db} from './firebase';

export default function ReaderNotes({uid, bookId, page}) {
  const [text, setText] = useState('');
  const [bookmark, setBookmark] = useState(false);
  const [status, setStatus] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    getDoc(doc(db, 'users', uid, 'books', bookId, 'reader_notes', String(page))).then(snapshot => {
      if (!active) return;
      setText(snapshot.data()?.text ?? '');
      setBookmark(snapshot.data()?.bookmark === true);
      setReady(true);
    }).catch(() => {
      if (active) setStatus('Could not load your page notes.');
    });
    return () => {active = false;};
  }, [uid, bookId, page]);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setStatus('');
    try {
      await setDoc(doc(db, 'users', uid, 'books', bookId, 'reader_notes', String(page)), {text, bookmark});
      setStatus('Page notes saved.');
    } catch {
      setStatus('Could not save your page notes.');
    } finally {
      setBusy(false);
    }
  }
  return <details className="question">
    <summary>Personal notes {bookmark && '· Bookmarked'}</summary>
    <form onSubmit={save}>
      <fieldset disabled={!ready || busy}>
        <label className="field">Notes for page {page}
          <textarea rows={4} maxLength={6000} value={text} onChange={event => setText(event.target.value)}/>
        </label>
        <label className="option"><input type="checkbox" checked={bookmark}
          onChange={event => setBookmark(event.target.checked)}/> Bookmark this page</label>
        <button type="submit" className="btn secondary">{busy ? 'Saving…' : 'Save page notes'}</button>
      </fieldset>
      {status && <p role="status">{status}</p>}
    </form>
  </details>;
}
