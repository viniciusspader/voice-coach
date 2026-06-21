"use client";

import { useEffect } from "react";

export default function TabsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[TabsError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-deep">
      <p className="text-red-400 text-lg font-semibold mb-3">Something went wrong</p>
      <p className="text-white text-sm text-center mb-2 max-w-sm">{error.message}</p>
      {error.digest && (
        <p className="text-muted text-xs mb-6">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-6 py-2.5 border border-brand rounded-lg text-brand text-sm"
      >
        Try again
      </button>
    </div>
  );
}
