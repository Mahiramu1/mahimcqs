import React, {useState} from 'react';
import {signInWithPopup} from 'firebase/auth';
import {auth,configured,googleProvider} from './firebase';
import {googleSignInError} from './googleAuthErrors.js';

/**
 * Popup auth is intentional: MahiMCQs is hosted outside Firebase Hosting.
 * Firebase redirect auth needs additional first-party auth-domain/proxy setup
 * on some browsers. Keep the popup call directly inside the click handler.
 */
export default function GoogleLogin(){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');

  async function signIn(){
    if(!configured||busy)return;
    setError('');
    setBusy(true);
    try{
      await signInWithPopup(auth,googleProvider);
      // The parent App's onAuthStateChanged listener opens the private dashboard.
    }catch(e){
      setError(googleSignInError(e));
    }finally{
      setBusy(false);
    }
  }

  return <div className="google-login">
    <button type="button" className="btn google-button" onClick={signIn} disabled={!configured||busy} aria-busy={busy}>
      <span className="google-mark" aria-hidden="true">G</span>
      {busy?'Signing in…':'Continue with Google (Gmail)'}
    </button>
    {!configured && <p className="status error" role="alert">Google sign-in is not configured. Add the public Firebase web-app variables to the Hostinger build environment and redeploy.</p>}
    {error && <p className="status error" role="alert">{error}</p>}
    <p className="small muted">Use your Google account. Your Gmail password is never entered into MahiMCQs.</p>
  </div>;
}
