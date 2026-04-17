"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

type Step = "request" | "confirm";

export default function ForgotPasswordPage() {
  const { forgotPassword, confirmForgotPassword, signIn } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep("confirm");
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmForgotPassword(email.trim(), code.trim(), newPassword);
      await signIn(email.trim(), newPassword);
    } catch (err: any) {
      setError(err.message ?? "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-deep flex items-center justify-center px-8">
      <div className="w-full max-w-sm py-14">
        <p className="text-5xl text-center mb-3">🔑</p>
        <h1 className="text-white text-3xl font-bold text-center mb-1.5">Reset Password</h1>

        {step === "request" ? (
          <>
            <p className="text-muted text-sm text-center mb-10">
              Enter your email and we&apos;ll send you a verification code
            </p>
            <form onSubmit={handleRequest} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-card border border-navy rounded-xl px-4 py-3.5 text-white text-base placeholder-[#555] outline-none focus:border-brand"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="bg-brand text-white rounded-xl py-4 font-bold text-lg mt-1 disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Code"}
              </button>
            </form>
            <p className="text-center mt-6">
              <Link href="/auth/sign-in" className="text-brand text-sm font-semibold">
                Back to sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="text-muted text-sm text-center mb-10 leading-relaxed">
              Enter the code sent to{" "}
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
              <input
                type="password"
                placeholder="New password (min. 8 characters)"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-card border border-navy rounded-xl px-4 py-3.5 text-white text-base placeholder-[#555] outline-none focus:border-brand"
              />
              <input
                type="password"
                placeholder="Confirm new password"
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
                {loading ? "Resetting…" : "Reset & Sign In"}
              </button>
            </form>
            <button
              onClick={() => { setStep("request"); setError(null); }}
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
