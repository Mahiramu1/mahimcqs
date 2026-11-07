import test from 'node:test';import assert from 'node:assert/strict';import {validArticle,validPYQ,contentId} from '../server/content.js';
test('PYQ cannot be verified without paper provenance',()=>{assert.equal(Boolean(validPYQ({exam:'UPSC',year:2022,question:'What is the correct option?',options:['A','B','C','D'],answer:0})),false)});
test('reject bad article URLs',()=>{assert.equal(Boolean(validArticle({title:'A sample news article',summary:'A complete sample description longer than twenty characters.',publisher:'News',publishedAt:'2026-01-01',sourceUrl:'javascript:alert(1)'})),false)});
test('source identifiers deterministic',()=>{const x={sourceUrl:'https://example.org/a',title:'Example'};assert.equal(contentId('news',x),contentId('news',x))});
