export interface FillerWordInstance {
  word: string;
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

interface WhisperSegment {
  text: string;
  t0: number; // start time in ms
  t1: number; // end time in ms
}

const FILLER_WORDS = [
  "um", "uh", "uhh", "umm", "hmm",
  "like", "you know", "so", "basically",
  "actually", "right", "i mean", "well",
  "kind of", "sort of", "literally",
];

const FILLER_PATTERN = new RegExp(
  `\\b(${FILLER_WORDS.join("|")})\\b`,
  "gi"
);

export function computeMetrics(
  transcript: string,
  segments: WhisperSegment[],
  totalDurationMs: number
): Metrics {
  const durationSeconds = totalDurationMs / 1000;

  // Word and sentence counts
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentenceCount = (transcript.match(/[.!?]+/g) || []).length || 1;

  // WPM
  const speakingMinutes = durationSeconds / 60;
  const wordsPerMinute = speakingMinutes > 0 ? Math.round(wordCount / speakingMinutes) : 0;

  // Filler words
  const fillerWords: FillerWordInstance[] = [];
  let match: RegExpExecArray | null;
  const searchText = transcript.toLowerCase();
  const regex = new RegExp(`\\b(${FILLER_WORDS.join("|")})\\b`, "gi");
  while ((match = regex.exec(searchText)) !== null) {
    fillerWords.push({ word: match[1], position: match.index });
  }

  // Pause detection from segments (gaps > 1 second between segments)
  const pauses: number[] = [];
  for (let i = 1; i < segments.length; i++) {
    const gap = (segments[i].t0 - segments[i - 1].t1) / 1000; // convert ms to seconds
    if (gap > 1.0) {
      pauses.push(gap);
    }
  }

  const pauseCount = pauses.length;
  const avgPauseDuration = pauseCount > 0 ? pauses.reduce((a, b) => a + b, 0) / pauseCount : 0;
  const longestPause = pauseCount > 0 ? Math.max(...pauses) : 0;

  // Silence ratio: total gap time / total duration
  const totalSpeechTime = segments.reduce((sum, s) => sum + (s.t1 - s.t0), 0) / 1000;
  const silenceRatio = durationSeconds > 0 ? Math.max(0, 1 - totalSpeechTime / durationSeconds) : 0;

  return {
    durationSeconds: Math.round(durationSeconds * 10) / 10,
    wordCount,
    sentenceCount,
    wordsPerMinute,
    fillerWordCount: fillerWords.length,
    fillerWords,
    pauseCount,
    avgPauseDuration: Math.round(avgPauseDuration * 10) / 10,
    longestPause: Math.round(longestPause * 10) / 10,
    silenceRatio: Math.round(silenceRatio * 100) / 100,
    segmentCount: segments.length,
  };
}
