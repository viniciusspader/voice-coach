// ── Practice Prompts ──

export type PromptCategory = "idea-communication" | "storytelling" | "public-speaking" | "sales-persuasion";

export interface Prompt {
  id: string;
  text: string;
  category: PromptCategory;
  suggestedFramework: string;
  tip: string;
  timeLimitSeconds?: number;
}

// ── Metrics (computed client-side) ──

export interface FillerWordInstance {
  word: string;
  /** Approximate position in transcript (character index) */
  position: number;
}

export interface Metrics {
  durationSeconds: number;
  wordCount: number;
  sentenceCount: number;
  wordsPerMinute: number;
  fillerWordCount: number;
  fillerWords: FillerWordInstance[];
  pauseCount: number;
  avgPauseDuration: number;
  longestPause: number;
  silenceRatio: number;
  segmentCount: number;
}

// ── AI Feedback (from Bedrock) ──

export interface Scores {
  messageClarity: number;
  structure: number;
  pacing: number;
  vocalConfidence: number;
  engagement: number;
  languageQuality: number;
}

export interface FrameworkAnalysis {
  framework: string;
  elementsPresent: string[];
  elementsMissing: string[];
}

export interface TranscriptHighlight {
  phrase: string;
  type: "strength" | "filler" | "improvement";
  note: string;
}

export interface PrimaryImprovement {
  area: string;
  why: string;
  drill: string;
}

export interface Feedback {
  overallScore: number;
  scores: Scores;
  frameworkAnalysis: FrameworkAnalysis;
  transcriptHighlights: TranscriptHighlight[];
  strengths: string[];
  primaryImprovement: PrimaryImprovement;
  secondaryImprovements: string[];
  progressNote: string;
}

// ── Session (stored in DynamoDB) ──

export interface Session {
  userId: string;
  sessionId: string;
  promptId: string;
  promptText: string;
  suggestedFramework: string;
  transcript: string;
  metrics: Metrics;
  feedback: Feedback;
  createdAt: string;
}

// ── API request/response types ──

export interface AnalyzeRequest {
  promptId: string;
  promptText: string;
  suggestedFramework: string;
  transcript: string;
  metrics: Metrics;
  previousScores?: Scores[];
}

export interface AnalyzeResponse {
  sessionId: string;
  feedback: Feedback;
}

export interface ListSessionsResponse {
  sessions: Pick<Session, "sessionId" | "promptText" | "createdAt" | "feedback">[];
}

export interface ProgressResponse {
  totalSessions: number;
  avgOverallScore: number;
  avgWpm: number;
  avgFillerCount: number;
  recentTrend: {
    date: string;
    overallScore: number;
    wpm: number;
    fillerCount: number;
  }[];
}
