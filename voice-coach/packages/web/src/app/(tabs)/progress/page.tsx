"use client";

import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { getProgress } from "@/lib/api";

interface TrendEntry {
  date: string;
  overallScore: number;
  wpm: number;
  fillerCount: number;
}

interface ProgressData {
  totalSessions: number;
  avgOverallScore: number;
  avgWpm: number;
  avgFillerCount: number;
  recentTrend: TrendEntry[];
}

function getWpmColor(wpm: number): string {
  if (wpm >= 140 && wpm <= 160) return "#4ade80";
  if (wpm >= 120 && wpm <= 180) return "#fbbf24";
  return "#ef4444";
}

function getFillerColor(count: number): string {
  if (count <= 2) return "#4ade80";
  if (count <= 5) return "#fbbf24";
  return "#ef4444";
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadProgress();
  }, []);

  async function loadProgress() {
    setLoading(true);
    setError(null);
    try {
      const result = await getProgress();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5">
        <p className="text-red-400 text-base mb-4">{error}</p>
        <button
          onClick={loadProgress}
          className="px-6 py-2.5 border border-brand rounded-lg text-brand text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.totalSessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5">
        <p className="text-white text-xl font-semibold mb-2">No data yet</p>
        <p className="text-muted text-sm text-center">
          Complete a few practice sessions to start tracking your progress.
        </p>
      </div>
    );
  }

  const trend = data.recentTrend.slice(-15);
  const scoreData = trend.map((e, i) => ({ x: i + 1, y: e.overallScore }));
  const wpmData = trend.map((e, i) => ({ x: i + 1, y: e.wpm }));
  const fillerData = trend.map((e, i) => ({ x: i + 1, y: e.fillerCount }));

  return (
    <div className="p-5 pb-10">
      <h2 className="text-white text-lg font-bold mb-3 mt-2">Overview</h2>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[
          { value: data.totalSessions, label: "Sessions", color: "#fff" },
          { value: data.avgOverallScore.toFixed(1), label: "Avg Score", color: "#e94560" },
        ].map(({ value, label, color }) => (
          <div key={label} className="bg-card rounded-xl p-4 border border-navy text-center">
            <p className="text-3xl font-bold" style={{ color }}>{value}</p>
            <p className="text-muted text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-card rounded-xl p-4 border border-navy text-center">
          <p className="text-3xl font-bold" style={{ color: getWpmColor(data.avgWpm) }}>
            {data.avgWpm}
          </p>
          <p className="text-muted text-xs mt-1">Avg WPM</p>
          <p className="text-[#555] text-[10px] mt-0.5">Optimal: 140–160</p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-navy text-center">
          <p className="text-3xl font-bold" style={{ color: getFillerColor(data.avgFillerCount) }}>
            {data.avgFillerCount.toFixed(1)}
          </p>
          <p className="text-muted text-xs mt-1">Avg Fillers</p>
          <p className="text-[#555] text-[10px] mt-0.5">Goal: 0–2</p>
        </div>
      </div>

      {trend.length >= 2 && mounted && (
        <>
          <h2 className="text-white text-lg font-bold mb-3">Overall Score</h2>
          <div className="bg-card rounded-xl border border-navy mb-4 p-3">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={scoreData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
                <XAxis dataKey="x" stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                <Line type="monotoneX" dataKey="y" stroke="#e94560" strokeWidth={2} dot={{ fill: "#e94560", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-[#555] text-[10px] text-center mt-1">Session number (oldest → newest)</p>
          </div>

          <h2 className="text-white text-lg font-bold mb-3">Words per Minute</h2>
          <div className="bg-card rounded-xl border border-navy mb-4 p-3">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={wpmData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
                <XAxis dataKey="x" stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                <Bar dataKey="y">
                  {wpmData.map((entry, i) => (
                    <Cell key={i} fill={getWpmColor(entry.y)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-3 mt-1 flex-wrap">
              {[["#4ade80", "140–160 WPM"], ["#fbbf24", "120–180 WPM"], ["#ef4444", "Out of range"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                  <span className="text-muted text-[10px]">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <h2 className="text-white text-lg font-bold mb-3">Filler Words</h2>
          <div className="bg-card rounded-xl border border-navy mb-4 p-3">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={fillerData} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f3460" />
                <XAxis dataKey="x" stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis stroke="#888" tick={{ fill: "#888", fontSize: 10 }} />
                <Bar dataKey="y">
                  {fillerData.map((entry, i) => (
                    <Cell key={i} fill={getFillerColor(entry.y)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-3 mt-1 flex-wrap">
              {[["#4ade80", "0–2 (great)"], ["#fbbf24", "3–5 (ok)"], ["#ef4444", "6+ (work on it)"]].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                  <span className="text-muted text-[10px]">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {trend.length === 1 && (
        <p className="text-[#555] text-sm text-center mt-4">
          Complete at least 2 sessions to see trend charts.
        </p>
      )}
    </div>
  );
}
