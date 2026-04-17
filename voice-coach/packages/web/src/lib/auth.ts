import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

let _pool: CognitoUserPool | null = null;

function getPool(): CognitoUserPool {
  if (!_pool) {
    _pool = new CognitoUserPool({
      UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
    });
  }
  return _pool;
}

export function getCurrentUser(): CognitoUser | null {
  return getPool().getCurrentUser();
}

export function signIn(email: string, password: string): Promise<CognitoUser> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: getPool() });
    const authDetails = new AuthenticationDetails({
      Username: email.toLowerCase(),
      Password: password,
    });
    user.authenticateUser(authDetails, {
      onSuccess: () => resolve(user),
      onFailure: reject,
    });
  });
}

export function signUp(email: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    getPool().signUp(
      email.toLowerCase(),
      password,
      [new CognitoUserAttribute({ Name: "email", Value: email.toLowerCase() })],
      [],
      (err) => (err ? reject(err) : resolve())
    );
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: getPool() });
    user.confirmRegistration(code.trim(), true, (err) => (err ? reject(err) : resolve()));
  });
}

export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: getPool() });
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: reject,
      inputVerificationCode: () => resolve(),
    });
  });
}

export function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: getPool() });
    user.confirmPassword(code.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

export function signOut(): void {
  getPool().getCurrentUser()?.signOut();
}

export function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const user = getPool().getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: any) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session.getIdToken().getJwtToken());
    });
  });
}
