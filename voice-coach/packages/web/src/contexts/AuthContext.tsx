"use client";

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
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
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

  async function forgotPassword(email: string) {
    await Auth.forgotPassword(email);
  }

  async function confirmForgotPassword(email: string, code: string, newPassword: string) {
    await Auth.confirmForgotPassword(email, code, newPassword);
  }

  function signOut() {
    Auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, signIn, signUp, confirmSignUp, signOut, forgotPassword, confirmForgotPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
