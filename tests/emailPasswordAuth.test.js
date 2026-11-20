import test from 'node:test';
import assert from 'node:assert/strict';
import {validEmail,validateRegistration,emailPasswordError} from '../src/emailPasswordAuth.js';
import {isPasswordProvider} from '../server/auth.js';

test('Email address validation',()=>{
  assert.equal(validEmail('student@example.com'),true);
  assert.equal(validEmail('student+exam@gmail.com'),true);
  assert.equal(validEmail('bad-email'),false);
  assert.equal(validEmail(''),false);
});
test('Registration requires a long matching password',()=>{
  assert.equal(validateRegistration('user@example.com','long-pass-123','long-pass-123'),'');
  assert.match(validateRegistration('user@example.com','short','short'),/at least 8/);
  assert.match(validateRegistration('user@example.com','long-pass-123','different'),/do not match/);
  assert.match(validateRegistration('bad','long-pass-123','long-pass-123'),/valid email/);
});
test('Firebase errors remain actionable and do not reveal private messages',()=>{
  assert.match(emailPasswordError({code:'auth/invalid-credential'}),/Incorrect email or password/);
  assert.match(emailPasswordError({code:'auth/operation-not-allowed'}),/Firebase Authentication/);
  assert.equal(emailPasswordError({code:'unknown',message:'private credentials'}),'Authentication failed. Try again or contact support.');
});
test('Only password provider tokens may use protected API endpoints',()=>{
  assert.equal(isPasswordProvider({firebase:{sign_in_provider:'password'}}),true);
  assert.equal(isPasswordProvider({firebase:{sign_in_provider:'google.com'}}),false);
  assert.equal(isPasswordProvider({firebase:{sign_in_provider:'phone'}}),false);
  assert.equal(isPasswordProvider(null),false);
});
