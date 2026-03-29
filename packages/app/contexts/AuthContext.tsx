import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CognitoUser } from "amazon-cognito-identity-js";
import * as Auth from "../lib/auth";

interface AuthContextType {
  user: CognitoUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CognitoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = Auth.getCurrentUser();
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    currentUser.getSession((err: Error | null, session: any) => {
      setUser(session?.isValid() ? currentUser : null);
      setIsLoading(false);
    });
  }, []);

  async function signIn(email: string, password: string) {
    const u = await Auth.signIn(email, password);
    setUser(u);
  }

  async function signUp(email: string, password: string) {
    await Auth.signUp(email, password);
  }

  async function confirmSignUp(email: string, code: string) {
    await Auth.confirmSignUp(email, code);
  }

  function signOut() {
    Auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, confirmSignUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
