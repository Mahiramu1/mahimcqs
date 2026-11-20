import test from 'node:test';
import assert from 'node:assert/strict';
import {googleSignInError} from '../src/googleAuthErrors.js';

test('Google sign-in errors tell users how to recover',()=>{
  for(const code of ['auth/popup-blocked','auth/unauthorized-domain','auth/operation-not-allowed','auth/network-request-failed']){
    const message=googleSignInError({code});
    assert.ok(message.length>20);
    assert.doesNotMatch(message,/undefined|Bearer|private.key/i);
  }
});
test('Unknown errors do not expose SDK internal messages',()=>{
  assert.equal(googleSignInError({code:'auth/mystery',message:'sensitive internals'}),'Google sign-in failed. Please try again or contact support if it continues.');
  assert.equal(googleSignInError(null),'Google sign-in failed. Please try again or contact support if it continues.');
});
