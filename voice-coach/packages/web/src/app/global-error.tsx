"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ background: "#1a1a2e", color: "#fff", fontFamily: "sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", margin: 0 }}>
        <p style={{ color: "#e94560", fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Something went wrong
        </p>
        <p style={{ fontSize: "0.875rem", textAlign: "center", marginBottom: "0.5rem", maxWidth: "24rem" }}>
          {error.message}
        </p>
        {error.digest && (
          <p style={{ fontSize: "0.75rem", color: "#888", marginBottom: "1.5rem" }}>
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{ padding: "0.625rem 1.5rem", border: "1px solid #e94560", borderRadius: "0.5rem", color: "#e94560", background: "transparent", cursor: "pointer", fontSize: "0.875rem" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
