import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
  ClientId:   process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
};

function getPool() {
  return new CognitoUserPool(poolData);
}

// ── In-memory session cache ───────────────────────────────────────────────────
// Avoids hitting localStorage + re-instantiating CognitoUserPool on every
// API call. The cached session is reused until it's within 5 minutes of
// expiring, at which point we go back to Cognito to refresh it.
let _cachedSession: CognitoUserSession | null = null;

function isCacheValid(session: CognitoUserSession): boolean {
  const exp = session.getIdToken().getExpiration(); // unix seconds
  const fiveMinutesFromNow = Math.floor(Date.now() / 1000) + 300;
  return session.isValid() && exp > fiveMinutesFromNow;
}

// ── Sign up ───────────────────────────────────────────────────────────────────
export function signUp(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attrs = [new CognitoUserAttribute({ Name: "email", Value: email })];
    getPool().signUp(email, password, attrs, [], (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── Confirm sign-up with the emailed verification code ───────────────────────
export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    user.confirmRegistration(code, true, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ── Sign in ───────────────────────────────────────────────────────────────────
export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user    = new CognitoUser({ Username: email, Pool: getPool() });
    const details = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(details, {
      onSuccess: resolve,
      onFailure: reject,
    });
  });
}

// ── Sign out ──────────────────────────────────────────────────────────────────
export function signOut() {
  _cachedSession = null;
  const user = getPool().getCurrentUser();
  if (user) user.signOut();
}

// ── Get the current session (refreshes tokens if needed) ──────────────────────
export function getSession(): Promise<CognitoUserSession | null> {
  // Return the cached session if it's still valid and not close to expiring
  if (_cachedSession && isCacheValid(_cachedSession)) {
    return Promise.resolve(_cachedSession);
  }

  return new Promise((resolve) => {
    const user = getPool().getCurrentUser();
    if (!user) {
      _cachedSession = null;
      return resolve(null);
    }
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        _cachedSession = null;
        resolve(null);
      } else {
        _cachedSession = session;
        resolve(session);
      }
    });
  });
}

// ── Get the ID token string to attach to API requests ─────────────────────────
export async function getIdToken(): Promise<string | null> {
  const session = await getSession();
  return session ? session.getIdToken().getJwtToken() : null;
}

// ── Get current user's email from the token payload ──────────────────────────
export async function getCurrentEmail(): Promise<string | null> {
  const session = await getSession();
  return session ? (session.getIdToken().decodePayload().email as string) : null;
}

// ── Trigger a password reset email with a verification code ──────────────────
export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

// ── Confirm the reset using the emailed code + new password ──────────────────
export function confirmForgotPassword(email: string, code: string, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email, Pool: getPool() });
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

// ── Delete the current user's account from Cognito ───────────────────────────
export function deleteAccount(): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getPool().getCurrentUser();
    if (!user) return reject(new Error("No user is signed in."));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return reject(new Error("Session expired. Please sign in again."));
      user.deleteUser((deleteErr) => {
        if (deleteErr) reject(deleteErr);
        else resolve();
      });
    });
  });
}
