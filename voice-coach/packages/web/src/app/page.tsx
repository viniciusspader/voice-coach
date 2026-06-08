import Link from "next/link";
import Image from "next/image";
import { Microphone, BookOpen, ChartLineUp, ArrowRight, Target, CurrencyEur } from "@phosphor-icons/react/dist/ssr";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0d0d1a", color: "#f0f0f5" }}>
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
          <Microphone size={18} weight="duotone" style={{ color: "#a78bfa" }} />
          <span className="font-bold text-sm">Voice Coach</span>
        </div>
        <Link href="/auth/sign-in" className="text-sm font-medium transition-colors" style={{ color: "#a78bfa" }}>
          Sign in →
        </Link>
      </nav>

      {/* Hero image */}
      <div className="fade-1 w-full max-w-lg mx-auto px-6 pt-10">
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
          <Image
            src="/hero.png"
            alt="Voice Coach — sound visualization"
            width={800}
            height={450}
            className="w-full object-cover"
            priority
          />
        </div>
      </div>

      {/* Hero text */}
      <main className="flex flex-col items-center text-center px-6 pt-10 pb-6 max-w-lg mx-auto w-full">
        <h1 className="fade-2 text-4xl font-bold leading-tight mb-4 tracking-tight">
          Practice speaking.
          <br />
          <span style={{ color: "#a78bfa" }}>Get coached by AI.</span>
        </h1>

        <p className="fade-3 text-base leading-relaxed max-w-sm mb-8" style={{ color: "#94a3b8" }}>
          Real frameworks. Private sessions. Honest feedback on your storytelling, structure, and delivery — available any time on your phone.
        </p>

        <Link
          href="/auth/sign-in"
          className="fade-4 inline-flex items-center gap-2 font-semibold rounded-full px-8 py-3.5 text-sm transition-colors"
          style={{ background: "#7c3aed", color: "#fff" }}
        >
          Start practicing
          <ArrowRight size={16} weight="bold" />
        </Link>
      </main>

      {/* Feature strip */}
      <section className="fade-5 px-6 pb-16 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BookOpen, label: "Framework-grounded", desc: "SUCCES, Monroe's Sequence, PREP, Rule of Three, and more." },
            { icon: Target, label: "Targeted feedback", desc: "Evaluates how well you're applying the framework, not just your words." },
            { icon: ChartLineUp, label: "Track progress", desc: "See how your scores improve over sessions." },
            { icon: CurrencyEur, label: "~€1.20/month", desc: "Bedrock inference only — no subscription markup." },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="rounded-2xl p-4 flex flex-col gap-2"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(124,58,237,0.15)" }}>
                <Icon size={18} weight="duotone" style={{ color: "#a78bfa" }} />
              </div>
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
