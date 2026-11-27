import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parsePages} from '../shared/page-selection.js';
import {registerStudyRoutes, studyInput, validateMaterial} from '../server/study-material.js';

const text = 'The Constitution provides equality before the law. Fundamental rights are enforceable.';
const otherText = 'Article 19 protects freedom of speech and expression with reasonable restrictions.';
const input = {
  bookId: 'book',
  mode: 'combined',
  pages: [{page: 3, text: otherText}, {page: 1, text}],
  language: 'Bilingual',
  count: 3,
  exam: 'UPSC',
  difficulty: 'Mixed',
  length: 'Short',
};
const citation = {page: 1, quote: 'equality before the law'};
const result = {
  title: 'Fundamental rights',
  notes: [
    {heading: 'Equality', text: 'Equality is a right.', ...citation},
    {heading: 'Expression', text: 'Speech is protected.', page: 3, quote: 'freedom of speech'},
  ],
  questions: [0, 1, 2].map(answer => ({
    question: 'What does the passage describe?',
    options: ['Equality', 'Trade', 'Revenue', 'Education'],
    answer, explanation: 'The answer follows from the passage.', ...citation,
  })),
  flashcards: [{front: 'Equality before what?', back: 'The law', ...citation}],
};

test('page selection sorts, deduplicates and bounds selected pages', () => {
  assert.deepEqual(parsePages('5, 2-4, 3, 1', 6), [1, 2, 3, 4, 5]);
  for (const invalid of ['', '0', '2,', '4-2', '7', '1.5', '1-6-2']) {
    assert.throws(() => parsePages(invalid, 6));
  }
  assert.throws(() => parsePages('1-9', 10), /at most 8/);
});

test('request validation rejects unselected or unreadable source pages', () => {
  const config = studyInput(input, 4);
  assert.deepEqual(config.pages.map(item => item.page), [1, 3]);
  assert.throws(() => studyInput(input, 2), /source page/);
  assert.throws(() => studyInput({...input, pages: [input.pages[0], input.pages[0]]}, 4), /duplicate/);
  assert.throws(() => studyInput({...input, pages: [{page: 1, text: '   '}]}, 4), /readable/);
  assert.throws(() => studyInput({...input, mode: 'separate'}, 4), /settings/);
});

test('generated material requires exact quotes and notes for each selected page', () => {
  const config = studyInput(input, 4);
  assert.equal(validateMaterial(result, config), result);
  assert.throws(() => validateMaterial({...result, flashcards: [{...result.flashcards[0], page: 3}]}, config), /citation/);
  assert.throws(() => validateMaterial({...result, notes: result.notes.slice(0, 1)}, config), /citation/);
  assert.throws(() => validateMaterial({...result, questions: result.questions.slice(1)}, config), /validation/);
});

test('study routes reuse cached output, isolate users and score canonical answers idempotently', async t => {
  const data = new Map([['users/student/books/book', {title: 'Polity', pages: 4}]]);
  const routes = new Map();
  function createRef(path) {
    return {
      collection: name => createRef(path + '/' + name),
      doc: id => createRef(path + '/' + id),
      path,
      get: async () => ({exists: data.has(path), data: () => data.get(path)}),
    };
  }
  const db = {
    collection: name => createRef(name),
    runTransaction: operation => operation({
      get: ref => ref.get(),
      set: (ref, value) => data.set(ref.path, value),
      create: (ref, value) => data.set(ref.path, value),
    }),
  };
  registerStudyRoutes({post: (path, _auth, handler) => routes.set(path, handler)}, {db, authenticate() {}});
  const key = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test';
  t.after(() => {
    if (key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = key;
  });
  let callCount = 0;
  let release;
  const responseReady = new Promise(resolve => {release = resolve;});
  let providerCalled;
  const firstProviderCall = new Promise(resolve => {providerCalled = resolve;});
  t.mock.method(globalThis, 'fetch', async (_url, request) => {
    callCount++;
    assert.equal(JSON.parse(request.body).response_format.json_schema.strict, true);
    providerCalled();
    await responseReady;
    return Response.json({choices: [{message: {content: JSON.stringify(result)}}]});
  });
  async function call(path, body, uid = 'student') {
    const response = {code: 200, status(code) {this.code = code; return this;}, json(value) {return value;}};
    const payload = await routes.get(path)({user: {uid}, body}, response);
    return {status: response.code, payload};
  }
  const generating = call('/api/study-material', input);
  await firstProviderCall;
  try {
    assert.equal((await call('/api/study-material', input)).status, 409);
  } finally {
    release();
  }
  const initial = await generating;
  assert.equal(initial.status, 200);
  assert.equal(initial.payload.cached, false);
  const repeat = await call('/api/study-material', input);
  assert.equal(repeat.payload.cached, true);
  assert.equal(repeat.payload.id, initial.payload.id);
  assert.equal(callCount, 1);
  assert.equal((await call('/api/study-material', input, 'someone-else')).status, 404);
  const attempt = {materialId: initial.payload.id, attemptId: 'attempt-1', answers: [0, 1, null]};
  const scored = await call('/api/study-attempt', attempt);
  assert.equal(scored.payload.score, 2);
  assert.deepEqual(await call('/api/study-attempt', {...attempt, answers: [0, 1, 2]}), scored);
  assert.equal((await call('/api/study-attempt', attempt, 'someone-else')).status, 404);
});
