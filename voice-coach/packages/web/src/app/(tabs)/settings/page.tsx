"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser } from "@/lib/auth";

export default function SettingsPage() {
  const { signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const user = getCurrentUser();
  const email = (user as any)?.username ?? "Unknown";

  function handleSignOut() {
    if (confirming) {
      signOut();
    } else {
      setConfirming(true);
    }
  }

  return (
    <div className="p-5 pb-16">
      <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2 ml-1 mt-6">Account</p>
      <div className="bg-card rounded-xl border border-navy overflow-hidden mb-6">
        <div className="flex justify-between items-center px-4 py-3.5">
          <span className="text-white text-sm">Email</span>
          <span className="text-muted text-sm truncate max-w-[60%] text-right">{email}</span>
        </div>
      </div>

      <p className="text-muted text-xs font-bold uppercase tracking-widest mb-2 ml-1">About</p>
      <div className="bg-card rounded-xl border border-navy overflow-hidden mb-8">
        <div className="flex justify-between items-center px-4 py-3.5 border-b border-navy">
          <span className="text-white text-sm">App</span>
          <span className="text-muted text-sm">Voice Coach</span>
        </div>
        <div className="flex justify-between items-center px-4 py-3.5">
          <span className="text-white text-sm">Version</span>
          <span className="text-muted text-sm">1.0.0</span>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="w-full bg-card border border-brand rounded-xl py-4 text-brand font-bold text-base"
      >
        {confirming ? "Tap again to confirm" : "Sign Out"}
      </button>
      {confirming && (
        <button
          onClick={() => setConfirming(false)}
          className="w-full text-muted text-sm mt-3"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
