import React,{useState} from 'react';
import {createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signInWithEmailAndPassword} from 'firebase/auth';
import {auth,configured} from './firebase';
import {emailPasswordError,validEmail,validateRegistration} from './emailPasswordAuth.js';

export default function EmailPasswordLogin(){
  const [mode,setMode]=useState('login');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [showPassword,setShowPassword]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');

  function switchMode(next){
    if(busy)return;
    setMode(next);setError('');setMessage('');setPassword('');setConfirmPassword('');setShowPassword(false);
  }

  async function submit(event){
    event.preventDefault();
    if(busy||!configured)return;
    setError('');setMessage('');
    const address=email.trim();
    if(!validEmail(address)){setError('Enter a valid email address.');return;}
    if(mode==='register'){
      const validation=validateRegistration(address,password,confirmPassword);
      if(validation){setError(validation);return;}
    }else if(mode==='login'&&!password){
      setError('Enter your password.');return;
    }
    setBusy(true);
    try{
      if(mode==='reset'){
        await sendPasswordResetEmail(auth,address);
        // Use the same response regardless of whether this email has an account.
        setMessage('If this email has an account, a password reset link will arrive shortly. Check your inbox and spam folder.');
        setPassword('');
      }else if(mode==='register'){
        const result=await createUserWithEmailAndPassword(auth,address,password);
        setPassword('');setConfirmPassword('');
        // Verification is recommended, but email delivery is not a prerequisite
        // for basic email/password sign-in on this existing deployment.
        try{await sendEmailVerification(result.user);}
        catch{ /* The user can still sign in; configuration is owned by Firebase. */ }
      }else{
        await signInWithEmailAndPassword(auth,address,password);
        setPassword('');
      }
      // App's auth listener switches to the library on successful sign-in.
    }catch(cause){
      setError(emailPasswordError(cause));
    }finally{
      setBusy(false);
    }
  }

  return <div className="auth-form">
    <div className="auth-switch" role="group" aria-label="Account options">
      <button type="button" className="btn secondary" aria-pressed={mode==='login'} disabled={busy} onClick={()=>switchMode('login')}>Log in</button>
      <button type="button" className="btn secondary" aria-pressed={mode==='register'} disabled={busy} onClick={()=>switchMode('register')}>Create account</button>
      <button type="button" className="btn secondary" aria-pressed={mode==='reset'} disabled={busy} onClick={()=>switchMode('reset')}>Forgot password?</button>
    </div>
    <form onSubmit={submit}>
      <label className="field" htmlFor="auth-email">Email address
        <input id="auth-email" type="email" inputMode="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" disabled={busy}/>
      </label>
      {mode!=='reset'&&<label className="field" htmlFor="auth-password">Password
        <span className="auth-password-row">
          <input id="auth-password" type={showPassword?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} minLength={mode==='register'?8:undefined} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/>
          <button type="button" className="btn outline small" onClick={()=>setShowPassword(x=>!x)} disabled={busy} aria-label={showPassword?'Hide password':'Show password'}>{showPassword?'Hide':'Show'}</button>
        </span>
      </label>}
      {mode==='register'&&<label className="field" htmlFor="auth-confirm">Confirm password
        <input id="auth-confirm" type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} disabled={busy}/>
      </label>}
      {mode==='register'&&<p className="small muted">Use at least 8 characters. You may receive an email to verify your address.</p>}
      {!configured&&<p className="status error" role="alert">Login is not configured. Set the VITE_FIREBASE_* web app variables in the Hostinger build environment and redeploy.</p>}
      {error&&<p className="status error" role="alert">{error}</p>}
      {message&&<p className="status success" role="status">{message}</p>}
      <button type="submit" className="btn auth-submit" disabled={busy||!configured} aria-busy={busy}>
        {busy?'Please wait…':mode==='register'?'Create account':mode==='reset'?'Email password reset link':'Log in'}
      </button>
    </form>
    <p className="small muted">Accounts are secured by Firebase Authentication. Your password is not stored in MahiMCQs or in its GitHub repository.</p>
  </div>;
