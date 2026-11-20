/** Client-side validation only; Firebase enforces authentication on the server. */
export function validEmail(email){
  return typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
export function validateRegistration(email,password,confirmation){
  if(!validEmail(email))return 'Enter a valid email address.';
  if(typeof password!=='string'||password.length<8)return 'Choose a password with at least 8 characters.';
  if(password.length>128)return 'Choose a password shorter than 129 characters.';
  if(password!==confirmation)return 'The two passwords do not match.';
  return '';
}
export function emailPasswordError(error){
  const mapping={
    'auth/invalid-email':'Enter a valid email address.',
    'auth/invalid-credential':'Incorrect email or password. Check your details or reset your password.',
    'auth/wrong-password':'Incorrect email or password. Check your details or reset your password.',
    'auth/user-not-found':'Incorrect email or password. Check your details or reset your password.',
    'auth/email-already-in-use':'That email is already registered. Try signing in or resetting your password. If you previously used Google login, contact support to preserve your books.',
    'auth/weak-password':'The password is too weak. Choose a longer password.',
    'auth/operation-not-allowed':'Email/password sign-in is not enabled. The site administrator must enable it in Firebase Authentication.',
    'auth/network-request-failed':'Network error. Check your internet connection and retry.',
    'auth/too-many-requests':'Too many attempts. Please try later or reset your password.',
    'auth/user-disabled':'This account is disabled. Contact support.',
    'auth/invalid-api-key':'The Firebase configuration is invalid. Contact support.',
    'auth/unauthorized-domain':'This domain is not authorized in Firebase Authentication. Contact support.',
  };
  return mapping[error?.code]||'Authentication failed. Try again or contact support.';
}
