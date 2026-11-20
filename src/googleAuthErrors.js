/** Human-readable errors without exposing Firebase internals or credentials. */
export function googleSignInError(error){
  const messages={
    'auth/popup-blocked':'Your browser blocked the Google sign-in window. Allow pop-ups and try again, or open MahiMCQs in Chrome.',
    'auth/popup-closed-by-user':'Google sign-in was cancelled. Select Continue with Google to try again.',
    'auth/cancelled-popup-request':'Another sign-in is already in progress. Please try again.',
    'auth/unauthorized-domain':'This website domain is not authorized in Firebase Authentication. Add your live domain under Authentication > Settings > Authorized domains.',
    'auth/operation-not-allowed':'Google login is disabled for this Firebase project. Enable Google in Authentication > Sign-in method.',
    'auth/invalid-api-key':'Firebase web configuration is invalid. Check the VITE_FIREBASE_API_KEY environment variable.',
    'auth/network-request-failed':'Network error. Check your connection and try Google sign-in again.',
    'auth/account-exists-with-different-credential':'This email is associated with another sign-in method. Use the original method first to access that account.',
    'auth/operation-not-supported-in-this-environment':'This browser cannot open Google sign-in. Open MahiMCQs in a regular browser such as Chrome.',
    'auth/web-storage-unsupported':'Browser storage is unavailable. Enable cookies and local storage or use Chrome.',
  };
  return messages[error?.code] || 'Google sign-in failed. Please try again or contact support if it continues.';
}
