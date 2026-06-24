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
  const user = getPool().getCurrentUser();
  if (user) user.signOut();
}

// ── Get the current session (refreshes tokens if needed) ──────────────────────
export function getSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = getPool().getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) resolve(null);
      else resolve(session);
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
