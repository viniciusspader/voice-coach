import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { getRandomPrompt, getCategoryLabel, type Prompt, type PromptCategory } from "../../lib/prompts";
import { requestPermissions, startRecording, stopRecording } from "../../lib/audio";
import { computeMetrics } from "../../lib/metrics";
import { analyze, listSessions } from "../../lib/api";
import {
  requestSpeechPermissions,
  startSpeechRecognition,
  stopSpeechRecognition,
} from "../../lib/speech";

type Phase = "prompt" | "recording" | "processing" | "result";

const CATEGORIES: PromptCategory[] = [
  "idea-communication",
  "storytelling",
  "public-speaking",
  "sales-persuasion",
];

export default function PracticeScreen() {
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

  function shufflePrompt() {
    setPrompt(getRandomPrompt(selectedCategory));
  }

  function selectCategory(cat: PromptCategory | undefined) {
    setSelectedCategory(cat);
    setPrompt(getRandomPrompt(cat));
  }

  async function handleStartRecording() {
    const micGranted = await requestPermissions();
    const speechGranted = await requestSpeechPermissions();
    if (!micGranted || !speechGranted) {
      Alert.alert("Permission needed", "Microphone and speech recognition access are required.");
      return;
    }

    setError(null);
    setRecordingTime(0);
    setPartialTranscript("");
    setAccumulatedTranscript("");

    // Start audio recording (for duration tracking) and speech recognition in parallel
    await startRecording();

    speechPromiseRef.current = startSpeechRecognition({
      onPartialResult: setPartialTranscript,
      onSegmentComplete: (accumulated) => {
        setAccumulatedTranscript(accumulated);
        setPartialTranscript("");
      },
    });

    setPhase("recording");

    timerRef.current = setInterval(() => {
      setRecordingTime((t) => t + 1);
    }, 1000);
  }

  async function handleStopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setPhase("processing");

    try {
      // Stop both audio recording and speech recognition
      const result = await stopRecording();
      stopSpeechRecognition();

      const transcription = await speechPromiseRef.current;
      speechPromiseRef.current = null;

      if (!result) {
        setError("Recording failed. Please try again.");
        setPhase("prompt");
        return;
      }

      if (!transcription?.text) {
        setError("No speech detected. Please try again and speak clearly.");
        setPhase("prompt");
        return;
      }

      const metrics = computeMetrics(transcription.text, transcription.segments, result.durationMs);

      // Fetch previous scores for progress comparison
      let previousScores: any[] = [];
      try {
        const history = await listSessions(5);
        previousScores = (history.sessions || [])
          .filter((s: any) => s.feedback?.scores)
          .map((s: any) => s.feedback.scores);
      } catch {
        // No history yet, that's fine
      }

      // Send to API for AI coaching
      const response = await analyze({
        promptId: prompt.id,
        promptText: prompt.text,
        suggestedFramework: prompt.suggestedFramework,
        transcript: transcription.text,
        metrics,
        previousScores,
      });

      // Navigate to session detail
      router.push(`/session/${response.sessionId}`);
      setPhase("prompt");
    } catch (err: any) {
      console.error("Processing error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setPhase("prompt");
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Category Filter */}
      {phase === "prompt" && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            <TouchableOpacity
              style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
              onPress={() => selectCategory(undefined)}
            >
              <Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => selectCategory(cat)}
              >
                <Text
                  style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}
                >
                  {getCategoryLabel(cat)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Prompt Card */}
          <View style={styles.promptCard}>
            <Text style={styles.categoryLabel}>{getCategoryLabel(prompt.category)}</Text>
            <Text style={styles.promptText}>{prompt.text}</Text>
            {prompt.timeLimitSeconds && (
              <Text style={styles.timeLimit}>
                Target: {Math.floor(prompt.timeLimitSeconds / 60)}:{(prompt.timeLimitSeconds % 60).toString().padStart(2, "0")}
              </Text>
            )}
          </View>

          {/* Framework Tip */}
          <View style={styles.tipCard}>
            <Text style={styles.tipFramework}>{prompt.suggestedFramework}</Text>
            <Text style={styles.tipText}>{prompt.tip}</Text>
          </View>

          {/* Actions */}
          <TouchableOpacity style={styles.recordButton} onPress={handleStartRecording}>
            <Text style={styles.recordButtonText}>Start Recording</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shuffleButton} onPress={shufflePrompt}>
            <Text style={styles.shuffleButtonText}>Different Prompt</Text>
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </>
      )}

      {/* Recording Phase */}
      {phase === "recording" && (() => {
        const target = prompt.timeLimitSeconds ?? 90;
        const remaining = target - recordingTime;
        const isOver = remaining < 0;
        return (
        <View style={styles.recordingContainer}>
          <View style={styles.recordingDot} />
          <View style={styles.timerRow}>
            <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
            <Text style={[styles.countdown, isOver && styles.countdownOver]}>
              {isOver ? `+${formatTime(-remaining)}` : `-${formatTime(remaining)}`}
            </Text>
          </View>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (recordingTime / target) * 100)}%` as any,
                    backgroundColor: isOver ? "#fb923c" : "#e94560",
                  },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {isOver ? "Over target" : `Target: ${formatTime(target)}`}
            </Text>
          </View>

          <Text style={styles.promptTextSmall}>{prompt.text}</Text>

          <View style={styles.tipCard}>
            <Text style={styles.tipFramework}>{prompt.suggestedFramework}</Text>
            <Text style={styles.tipText}>{prompt.tip}</Text>
          </View>

          {(accumulatedTranscript || partialTranscript) ? (
            <Text style={styles.liveTranscript}>
              {accumulatedTranscript}{accumulatedTranscript && partialTranscript ? " " : ""}{partialTranscript}
            </Text>
          ) : null}

          <TouchableOpacity style={styles.stopButton} onPress={handleStopRecording}>
            <Text style={styles.stopButtonText}>Stop Recording</Text>
          </TouchableOpacity>
        </View>
        );
      })()}

      {/* Processing Phase */}
      {phase === "processing" && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#e94560" />
          <Text style={styles.processingText}>Analyzing your speech...</Text>
          <Text style={styles.processingSubtext}>
            Transcribing and generating coaching feedback
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: { padding: 20, paddingBottom: 40 },

  categories: { flexDirection: "row", marginBottom: 20 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#16213e",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  categoryChipActive: { backgroundColor: "#e94560", borderColor: "#e94560" },
  categoryText: { color: "#888", fontSize: 13 },
  categoryTextActive: { color: "#fff", fontWeight: "600" },

  promptCard: {
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  categoryLabel: { color: "#e94560", fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase" },
  promptText: { color: "#fff", fontSize: 20, fontWeight: "600", lineHeight: 28 },
  timeLimit: { color: "#888", fontSize: 13, marginTop: 12 },

  tipCard: {
    backgroundColor: "#0f3460",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#e94560",
  },
  tipFramework: { color: "#e94560", fontSize: 13, fontWeight: "700", marginBottom: 6 },
  tipText: { color: "#ccc", fontSize: 14, lineHeight: 20 },

  recordButton: {
    backgroundColor: "#e94560",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  recordButtonText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  shuffleButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  shuffleButtonText: { color: "#888", fontSize: 15 },

  errorText: { color: "#ff6b6b", textAlign: "center", marginTop: 16, fontSize: 14 },

  // Recording
  recordingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  recordingDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#e94560",
    marginBottom: 16,
  },
  timerRow: { flexDirection: "row", alignItems: "baseline", gap: 16, marginBottom: 24 },
  recordingTime: { color: "#fff", fontSize: 48, fontWeight: "200" },
  countdown: { color: "#888", fontSize: 22, fontWeight: "300" },
  countdownOver: { color: "#fb923c" },
  promptTextSmall: { color: "#888", fontSize: 14, textAlign: "center", paddingHorizontal: 20, marginBottom: 40 },
  stopButton: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderWidth: 2,
    borderColor: "#e94560",
  },
  stopButtonText: { color: "#e94560", fontSize: 18, fontWeight: "700" },
  liveTranscript: { color: "#aaa", fontSize: 14, textAlign: "center", paddingHorizontal: 20, marginBottom: 24, fontStyle: "italic" },

  progressRow: { width: "100%", paddingHorizontal: 20, marginBottom: 20 },
  progressTrack: { height: 4, backgroundColor: "#16213e", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  progressFill: { height: "100%", borderRadius: 2 },
  progressLabel: { color: "#888", fontSize: 12, textAlign: "center" },

  // Processing
  processingContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 },
  processingText: { color: "#fff", fontSize: 18, marginTop: 20 },
  processingSubtext: { color: "#888", fontSize: 14, marginTop: 8 },
});
