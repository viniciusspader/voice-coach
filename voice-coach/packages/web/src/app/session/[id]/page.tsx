"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSession } from "@/lib/api";

interface SessionData {
  sessionId: string;
  promptText: string;
  suggestedFramework: string;
  transcript: string;
  createdAt: string;
  metrics: {
    durationSeconds: number;
    wordCount: number;
    wordsPerMinute: number;
    fillerWordCount: number;
    pauseCount: number;
    avgPauseDuration: number;
    longestPause: number;
    silenceRatio: number;
  };
  feedback: {
    overallScore: number;
    scores: Record<string, number>;
    frameworkAnalysis: {
      framework: string;
      elementsPresent: string[];
      elementsMissing: string[];
    };
    transcriptHighlights: { phrase: string; type: "strength" | "filler" | "improvement"; note: string }[];
    strengths: string[];
    primaryImprovement: { area: string; why: string; drill: string };
    secondaryImprovements: string[];
    progressNote: string;
  };
}

function getScoreColor(score: number): string {
  if (score >= 8) return "#4ade80";
  if (score >= 6) return "#fbbf24";
  if (score >= 4) return "#fb923c";
  return "#ef4444";
}

function getHighlightColor(type: string): string {
  if (type === "strength") return "#4ade80";
  if (type === "filler") return "#ef4444";
  return "#fbbf24";
}

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (id) loadSession(); }, [id]);

  async function loadSession() {
    setLoading(true);
    try {
      const data = await getSession(id);
      setSession(data);
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-deep">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-deep p-5">
        <p className="text-red-400 text-base text-center mb-4">{error || "Session not found"}</p>
        {error && (
          <button onClick={loadSession} className="px-6 py-2.5 border border-brand rounded-lg text-brand text-sm">
            Retry
          </button>
        )}
      </div>
    );
  }

  const { feedback, metrics } = session;
  const scoreEntries = Object.entries(feedback.scores || {});

  return (
    <div className="min-h-dvh bg-deep">
      {/* Back button */}
      <div className="sticky top-0 bg-deep border-b border-navy px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={() => router.back()} className="text-brand text-sm font-semibold">
          ← Back
        </button>
        <span className="text-muted text-sm truncate">Session Details</span>
      </div>

      <div className="p-5 pb-10">
        <p className="text-white text-base font-semibold leading-6 mb-1">{session.promptText}</p>
        <p className="text-brand text-xs font-semibold mb-5">{session.suggestedFramework}</p>

        {/* Overall score */}
        <div className="bg-card rounded-2xl p-6 text-center mb-5 border border-navy">
          <p className="text-6xl font-bold" style={{ color: getScoreColor(feedback.overallScore) }}>
            {feedback.overallScore}
          </p>
          <p className="text-muted text-base -mt-1">/10 Overall</p>
        </div>

        {/* Score breakdown */}
        <h2 className="text-white text-base font-bold mb-2.5 mt-5">Scores</h2>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {scoreEntries.map(([key, value]) => (
            <div key={key} className="bg-card rounded-xl p-3 text-center border border-navy">
              <p className="text-xl font-bold" style={{ color: getScoreColor(value as number) }}>
                {value as number}
              </p>
              <p className="text-muted text-[10px] mt-1 leading-3">
                {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              </p>
            </div>
          ))}
        </div>

        {/* Metrics */}
        <h2 className="text-white text-base font-bold mb-2.5 mt-5">Delivery Metrics</h2>
        <div className="bg-card rounded-xl p-4 border border-navy mb-5">
          {[
            { label: "Duration", value: `${Math.round(metrics.durationSeconds)}s` },
            { label: "Words per minute", value: metrics.wordsPerMinute, color: metrics.wordsPerMinute >= 140 && metrics.wordsPerMinute <= 160 ? "#4ade80" : "#fbbf24" },
            { label: "Filler words", value: metrics.fillerWordCount, color: metrics.fillerWordCount <= 2 ? "#4ade80" : "#ef4444" },
            { label: "Pauses", value: metrics.pauseCount },
            { label: "Avg pause", value: `${metrics.avgPauseDuration}s` },
            { label: "Silence ratio", value: `${Math.round(metrics.silenceRatio * 100)}%` },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} className={`flex justify-between py-1.5 ${i < arr.length - 1 ? "border-b border-navy" : ""}`}>
              <span className="text-muted text-sm">{label}</span>
              <span className="text-sm font-semibold" style={{ color: (color as string) || "#fff" }}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Framework */}
        {feedback.frameworkAnalysis && (
          <>
            <h2 className="text-white text-base font-bold mb-2.5 mt-5">
              Framework: {feedback.frameworkAnalysis.framework}
            </h2>
            <div className="bg-card rounded-xl p-4 border border-navy mb-5">
              {feedback.frameworkAnalysis.elementsPresent?.length > 0 && (
                <div className="mb-3">
                  <p className="text-green-400 text-xs font-bold mb-1.5">Elements Present</p>
                  {feedback.frameworkAnalysis.elementsPresent.map((el, i) => (
                    <p key={i} className="text-green-400 text-sm leading-5 pl-2">+ {el}</p>
                  ))}
                </div>
              )}
              {feedback.frameworkAnalysis.elementsMissing?.length > 0 && (
                <div>
                  <p className="text-amber-400 text-xs font-bold mb-1.5">Elements Missing</p>
                  {feedback.frameworkAnalysis.elementsMissing.map((el, i) => (
                    <p key={i} className="text-amber-400 text-sm leading-5 pl-2">- {el}</p>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Highlights */}
        {feedback.transcriptHighlights?.length > 0 && (
          <>
            <h2 className="text-white text-base font-bold mb-2.5 mt-5">Key Moments</h2>
            {feedback.transcriptHighlights.map((h, i) => (
              <div
                key={i}
                className="bg-card rounded-lg p-3 mb-2 border-l-4"
                style={{ borderLeftColor: getHighlightColor(h.type) }}
              >
                <p className="text-[10px] font-bold mb-1" style={{ color: getHighlightColor(h.type) }}>
                  {h.type.toUpperCase()}
                </p>
                <p className="text-white text-sm italic mb-1">"{h.phrase}"</p>
                <p className="text-muted text-xs">{h.note}</p>
              </div>
            ))}
          </>
        )}

        {/* Strengths */}
        {feedback.strengths?.length > 0 && (
          <>
            <h2 className="text-white text-base font-bold mb-2.5 mt-5">Strengths</h2>
            {feedback.strengths.map((s, i) => (
              <div key={i} className="bg-card rounded-lg p-3 mb-1.5 border-l-4 border-green-400">
                <p className="text-subtle text-sm leading-5">{s}</p>
              </div>
            ))}
          </>
        )}

        {/* Primary improvement */}
        {feedback.primaryImprovement && (
          <>
            <h2 className="text-white text-base font-bold mb-2.5 mt-5">Focus Area</h2>
            <div className="bg-card rounded-xl p-4 border border-brand mb-5">
              <p className="text-brand text-base font-bold mb-2">{feedback.primaryImprovement.area}</p>
              <p className="text-subtle text-sm leading-5 mb-3">{feedback.primaryImprovement.why}</p>
              <div className="bg-navy rounded-lg p-3">
                <p className="text-brand text-xs font-bold mb-1.5">Practice Drill</p>
                <p className="text-white text-sm leading-5">{feedback.primaryImprovement.drill}</p>
              </div>
            </div>
          </>
        )}

        {/* Secondary improvements */}
        {feedback.secondaryImprovements?.length > 0 && (
          <>
            <h2 className="text-white text-base font-bold mb-2.5 mt-5">Also Consider</h2>
            {feedback.secondaryImprovements.map((imp, i) => (
              <p key={i} className="text-muted text-sm leading-5 pl-2 mb-1">{imp}</p>
            ))}
          </>
        )}

        {/* Progress note */}
        {feedback.progressNote && (
          <div className="bg-navy rounded-lg p-3 mt-5 mb-5">
            <p className="text-subtle text-sm italic">{feedback.progressNote}</p>
          </div>
        )}

        {/* Transcript */}
        <h2 className="text-white text-base font-bold mb-2.5 mt-5">Full Transcript</h2>
        <div className="bg-card rounded-xl p-4 border border-navy">
          <p className="text-subtle text-sm leading-6">{session.transcript}</p>
        </div>
      </div>
    </div>
  );
}
