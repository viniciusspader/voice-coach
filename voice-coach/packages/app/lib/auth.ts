import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from "amazon-cognito-identity-js";

const USER_POOL_ID = process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID;

if (!USER_POOL_ID || !CLIENT_ID) {
  console.warn(
    "Cognito env vars not set. Add EXPO_PUBLIC_COGNITO_USER_POOL_ID and EXPO_PUBLIC_COGNITO_CLIENT_ID to .env"
  );
}

const userPool = new CognitoUserPool({
  UserPoolId: USER_POOL_ID ?? "placeholder",
  ClientId: CLIENT_ID ?? "placeholder",
});

export function getCurrentUser(): CognitoUser | null {
  return userPool.getCurrentUser();
}

export function signIn(email: string, password: string): Promise<CognitoUser> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: userPool });
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
    userPool.signUp(
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
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: userPool });
    user.confirmRegistration(code.trim(), true, (err) => (err ? reject(err) : resolve()));
  });
}

export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: userPool });
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
    const user = new CognitoUser({ Username: email.toLowerCase(), Pool: userPool });
    user.confirmPassword(code.trim(), newPassword, {
      onSuccess: () => resolve(),
      onFailure: reject,
    });
  });
}

export function signOut(): void {
  userPool.getCurrentUser()?.signOut();
}

export function getIdToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: any) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session.getIdToken().getJwtToken());
    });
  });
}
