"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listSessions } from "@/lib/api";

interface SessionSummary {
  sessionId: string;
  promptText: string;
  createdAt: string;
  feedback: {
    overallScore: number;
    primaryImprovement?: { area: string };
  };
}

function getScoreColor(score: number): string {
  if (score >= 8) return "#4ade80";
  if (score >= 6) return "#fbbf24";
  if (score >= 4) return "#fb923c";
  return "#ef4444";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    setLoading(true);
    setError(null);
    try {
      const data = await listSessions(50);
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-card rounded-xl p-4 mb-3 border border-navy animate-pulse">
            <div className="h-4 bg-navy rounded mb-3 w-1/3" />
            <div className="h-3 bg-navy rounded mb-2" />
            <div className="h-3 bg-navy rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5">
        <p className="text-red-400 text-base mb-4">{error}</p>
        <button
          onClick={loadSessions}
          className="px-6 py-2.5 border border-brand rounded-lg text-brand text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5">
        <p className="text-white text-xl font-semibold mb-2">No sessions yet</p>
        <p className="text-muted text-sm text-center">
          Complete your first practice session to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 pb-10">
      {sessions.map((item) => {
        const score = item.feedback?.overallScore || 0;
        const color = getScoreColor(score);
        return (
          <button
            key={item.sessionId}
            onClick={() => router.push(`/session/${item.sessionId}`)}
            className="w-full bg-card rounded-xl p-4 mb-3 border border-navy text-left"
          >
            <div className="flex justify-between items-center mb-2">
              <span
                className="px-2.5 py-1 rounded-lg text-sm font-bold"
                style={{ color, backgroundColor: color + "20" }}
              >
                {score}/10
              </span>
              <span className="text-muted text-xs">{formatDate(item.createdAt)}</span>
            </div>
            <p className="text-white text-sm leading-5 line-clamp-2">{item.promptText}</p>
            {item.feedback?.primaryImprovement?.area && (
              <p className="text-brand text-xs mt-2">
                Focus: {item.feedback.primaryImprovement.area}
              </p>
            )}
          </button>
        );
      })}
    </div>
  );
}
