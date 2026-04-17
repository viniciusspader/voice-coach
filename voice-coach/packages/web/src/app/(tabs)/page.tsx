"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRandomPrompt, getCategoryLabel, type Prompt, type PromptCategory } from "@/lib/prompts";
import { requestPermissions, startRecording, stopRecording } from "@/lib/audio";
import { computeMetrics } from "@/lib/metrics";
import { analyze, listSessions } from "@/lib/api";
import { requestSpeechPermissions, startSpeechRecognition, stopSpeechRecognition } from "@/lib/speech";

type Phase = "prompt" | "recording" | "processing" | "result";

const CATEGORIES: PromptCategory[] = [
  "idea-communication",
  "storytelling",
  "public-speaking",
  "sales-persuasion",
];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PracticePage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("prompt");
  const [prompt, setPrompt] = useState<Prompt>(getRandomPrompt);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | undefined>();
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [partialTranscript, setPartialTranscript] = useState("");
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function selectCategory(cat: PromptCategory | undefined) {
    setSelectedCategory(cat);
    setPrompt(getRandomPrompt(cat));
  }

  async function handleStartRecording() {
    const micGranted = await requestPermissions();
    const speechGranted = await requestSpeechPermissions();
    if (!micGranted || !speechGranted) {
      setError("Microphone and speech recognition access are required.");
      return;
    }

    setError(null);
    setRecordingTime(0);
    setPartialTranscript("");
    setAccumulatedTranscript("");

    await startRecording();

    speechPromiseRef.current = startSpeechRecognition({
      onPartialResult: setPartialTranscript,
      onSegmentComplete: (accumulated) => {
        setAccumulatedTranscript(accumulated);
        setPartialTranscript("");
      },
    });

    setPhase("recording");
    timerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  }

  async function handleStopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("processing");

    try {
      const result = await stopRecording();
      stopSpeechRecognition();
      const transcription = await speechPromiseRef.current;
      speechPromiseRef.current = null;

      if (!result || !transcription?.text) {
        setError("No speech detected. Please try again and speak clearly.");
        setPhase("prompt");
        return;
      }

      const metrics = computeMetrics(transcription.text, transcription.segments, result.durationMs);

      let previousScores: any[] = [];
      try {
        const history = await listSessions(5);
        previousScores = (history.sessions || [])
          .filter((s: any) => s.feedback?.scores)
          .map((s: any) => s.feedback.scores);
      } catch {
        // no history yet
      }

      const response = await analyze({
        promptId: prompt.id,
        promptText: prompt.text,
        suggestedFramework: prompt.suggestedFramework,
        transcript: transcription.text,
        metrics,
        previousScores,
      });

      router.push(`/session/${response.sessionId}`);
      setPhase("prompt");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setPhase("prompt");
    }
  }

  return (
    <div className="min-h-full bg-deep">
      <div className="p-5 pb-10">

        {/* Prompt phase */}
        {phase === "prompt" && (
          <>
            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
              {[undefined, ...CATEGORIES].map((cat) => (
                <button
                  key={cat ?? "all"}
                  onClick={() => selectCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    selectedCategory === cat
                      ? "bg-brand border-brand text-white"
                      : "bg-card border-navy text-muted"
                  }`}
                >
                  {cat ? getCategoryLabel(cat) : "All"}
                </button>
              ))}
            </div>

            {/* Prompt card */}
            <div className="bg-card rounded-2xl p-6 mb-4 border border-navy">
              <p className="text-brand text-xs font-bold uppercase tracking-wide mb-2">
                {getCategoryLabel(prompt.category)}
              </p>
              <p className="text-white text-xl font-semibold leading-7">{prompt.text}</p>
              {prompt.timeLimitSeconds && (
                <p className="text-muted text-xs mt-3">
                  Target: {formatTime(prompt.timeLimitSeconds)}
                </p>
              )}
            </div>

            {/* Tip card */}
            <div className="bg-navy rounded-xl p-4 mb-6 border-l-4 border-brand">
              <p className="text-brand text-xs font-bold mb-1.5">{prompt.suggestedFramework}</p>
              <p className="text-subtle text-sm leading-5">{prompt.tip}</p>
            </div>

            <button
              onClick={handleStartRecording}
              className="w-full bg-brand text-white rounded-xl py-4 font-bold text-lg mb-3"
            >
              Start Recording
            </button>
            <button
              onClick={() => setPrompt(getRandomPrompt(selectedCategory))}
              className="w-full border border-navy rounded-xl py-3.5 text-muted text-sm"
            >
              Different Prompt
            </button>

            {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          </>
        )}

        {/* Recording phase */}
        {phase === "recording" && (() => {
          const target = prompt.timeLimitSeconds ?? 90;
          const remaining = target - recordingTime;
          const isOver = remaining < 0;
          const pct = Math.min(100, (recordingTime / target) * 100);
          return (
            <div className="flex flex-col items-center pt-16">
              <div className="w-4 h-4 rounded-full bg-brand mb-4 animate-pulse" />
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-white text-5xl font-extralight">{formatTime(recordingTime)}</span>
                <span className={`text-2xl font-light ${isOver ? "text-orange-400" : "text-muted"}`}>
                  {isOver ? `+${formatTime(-remaining)}` : `-${formatTime(remaining)}`}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full mb-5">
                <div className="h-1 bg-card rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isOver ? "#fb923c" : "#e94560",
                    }}
                  />
                </div>
                <p className="text-muted text-xs text-center">
                  {isOver ? "Over target" : `Target: ${formatTime(target)}`}
                </p>
              </div>

              <p className="text-muted text-sm text-center px-5 mb-8">{prompt.text}</p>

              <div className="bg-navy rounded-xl p-4 mb-8 border-l-4 border-brand w-full">
                <p className="text-brand text-xs font-bold mb-1">{prompt.suggestedFramework}</p>
                <p className="text-subtle text-sm leading-5">{prompt.tip}</p>
              </div>

              {(accumulatedTranscript || partialTranscript) && (
                <p className="text-muted text-sm text-center italic px-5 mb-6">
                  {accumulatedTranscript}
                  {accumulatedTranscript && partialTranscript ? " " : ""}
                  {partialTranscript}
                </p>
              )}

              <button
                onClick={handleStopRecording}
                className="border-2 border-brand text-brand rounded-xl py-4 px-10 font-bold text-lg"
              >
                Stop Recording
              </button>
            </div>
          );
        })()}

        {/* Processing phase */}
        {phase === "processing" && (
          <div className="flex flex-col items-center justify-center pt-24">
            <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin mb-5" />
            <p className="text-white text-lg">Analyzing your speech…</p>
            <p className="text-muted text-sm mt-2">Transcribing and generating coaching feedback</p>
          </div>
        )}
      </div>
    </div>
  );
}
