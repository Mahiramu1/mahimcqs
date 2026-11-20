/** Token verified by Firebase Admin before this provider check is invoked. */
export const isPasswordProvider=token=>token?.firebase?.sign_in_provider==='password';
