"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

type Step = "register" | "confirm";

export default function SignUpPage() {
  const { signUp, confirmSignUp, signIn } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setStep("confirm");
    } catch (err: any) {
      setError(err.message ?? "Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmSignUp(email.trim(), code.trim());
      await signIn(email.trim(), password);
      router.replace("/practice");
    } catch (err: any) {
      setError(err.message ?? "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-deep flex items-center justify-center px-8">
      <div className="w-full max-w-sm py-14">
        <p className="text-5xl text-center mb-3">🎙</p>
        <h1 className="text-white text-3xl font-bold text-center mb-1.5">Create Account</h1>

        {step === "register" ? (
          <>
            <p className="text-muted text-sm text-center mb-10">Start improving your communication</p>
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
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
                placeholder="Password (min. 8 characters)"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-card border border-navy rounded-xl px-4 py-3.5 text-white text-base placeholder-[#555] outline-none focus:border-brand"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-card border border-navy rounded-xl px-4 py-3.5 text-white text-base placeholder-[#555] outline-none focus:border-brand"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-brand text-white rounded-xl py-4 font-bold text-lg mt-1 disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
            </form>
            <p className="text-muted text-sm text-center mt-6">
              Already have an account?{" "}
              <Link href="/auth/sign-in" className="text-brand font-semibold">
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-muted text-sm text-center mb-10 leading-relaxed">
              We sent a verification code to{" "}
              <span className="text-brand font-semibold">{email}</span>
            </p>
            <form onSubmit={handleConfirm} className="flex flex-col gap-3">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Verification code"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="bg-card border border-navy rounded-xl px-4 py-3.5 text-white text-base placeholder-[#555] outline-none focus:border-brand"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-brand text-white rounded-xl py-4 font-bold text-lg mt-1 disabled:opacity-60"
              >
                {loading ? "Verifying…" : "Verify & Sign In"}
              </button>
            </form>
            <button
              onClick={() => { setStep("register"); setError(null); }}
              className="w-full text-brand text-sm font-semibold text-center mt-6"
            >
              Go back
            </button>
          </>
        )}
      </div>
    </div>
  );
}
