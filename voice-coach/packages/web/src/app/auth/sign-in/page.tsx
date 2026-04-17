"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function SignInPage() {
  const { signIn, user, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [user, isLoading, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(err.message ?? "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-deep flex items-center justify-center px-8">
      <div className="w-full max-w-sm">
        <p className="text-5xl text-center mb-3">🎙</p>
        <h1 className="text-white text-3xl font-bold text-center mb-1.5">Voice Coach</h1>
        <p className="text-muted text-sm text-center mb-10">Sign in to continue</p>

        <form onSubmit={handleSignIn} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-card border border-navy rounded-xl px-4 py-3.5 text-white text-base placeholder-[#555] outline-none focus:border-brand"
          />
          <input
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-card border border-navy rounded-xl px-4 py-3.5 text-white text-base placeholder-[#555] outline-none focus:border-brand"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-brand text-white rounded-xl py-4 font-bold text-lg mt-1 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="flex flex-col items-center gap-4 mt-6">
          <Link href="/auth/forgot-password" className="text-brand text-sm font-semibold">
            Forgot password?
          </Link>
          <p className="text-muted text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-brand font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
