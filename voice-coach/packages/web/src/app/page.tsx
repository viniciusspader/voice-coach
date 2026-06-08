import Link from "next/link";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#0d0d1a", color: "#f0f0f5" }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-1 { animation: fadeUp 0.5s ease both; }
        .fade-2 { animation: fadeUp 0.5s 0.08s ease both; }
        .fade-3 { animation: fadeUp 0.5s 0.16s ease both; }
        .fade-4 { animation: fadeUp 0.5s 0.24s ease both; }
        .fade-5 { animation: fadeUp 0.5s 0.36s ease both; }
      `}</style>

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-lg mx-auto w-full border-b border-white/5">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>🎙️</span>
          <span className="font-bold text-sm">Voice Coach</span>
        </div>
        <Link
          href="/auth/sign-in"
          className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
        >
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center max-w-lg mx-auto w-full py-20">
        <div
          className="fade-1 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 text-3xl"
          style={{ background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)" }}
        >
          🎙️
        </div>

        <h1 className="fade-2 text-4xl font-bold leading-tight mb-4 tracking-tight">
          Practice speaking.
          <br />
          <span style={{ color: "#a78bfa" }}>Get coached by AI.</span>
        </h1>

        <p className="fade-3 text-base leading-relaxed max-w-sm mb-10" style={{ color: "#94a3b8" }}>
          Real frameworks. Private sessions. Honest feedback on your storytelling, structure, and delivery — available any time on your phone.
        </p>

        <Link
          href="/auth/sign-in"
          className="fade-4 inline-flex items-center gap-2 font-semibold rounded-full px-8 py-3.5 text-sm transition-colors"
          style={{ background: "#7c3aed", color: "#fff" }}
        >
          Start practicing
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </main>

      {/* Feature strip */}
      <section className="fade-5 px-6 pb-16 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {[
            { emoji: "📖", label: "Framework-grounded", desc: "SUCCES, Monroe's Sequence, PREP, Rule of Three, and more." },
            { emoji: "🎯", label: "Targeted feedback", desc: "Evaluates how well you're applying the framework, not just your words." },
            { emoji: "📈", label: "Track progress", desc: "See how your scores improve over sessions." },
            { emoji: "💰", label: "~$1.20/month", desc: "Bedrock inference only — no subscription markup." },
          ].map(({ emoji, label, desc }) => (
            <div
              key={label}
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="text-xl">{emoji}</span>
              <p className="text-xs font-semibold leading-tight">{label}</p>
              <p className="text-[11px] leading-tight" style={{ color: "#64748b" }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center pb-8 text-xs" style={{ color: "#334155" }}>
        Personal app · AI-powered communication training
      </footer>
    </div>
  );
}
