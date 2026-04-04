import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getSession } from "../../lib/api";

interface TranscriptHighlight {
  phrase: string;
  type: "strength" | "filler" | "improvement";
  note: string;
}

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
    transcriptHighlights: TranscriptHighlight[];
    strengths: string[];
    primaryImprovement: {
      area: string;
      why: string;
      drill: string;
    };
    secondaryImprovements: string[];
    progressNote: string;
  };
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSession();
  }, [id]);

  async function loadSession() {
    if (!id) return;
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (error || !session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || "Session not found"}</Text>
        {error && (
          <TouchableOpacity style={styles.retryButton} onPress={loadSession}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const { feedback, metrics } = session;
  const scoreEntries = Object.entries(feedback.scores || {});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Prompt */}
      <Text style={styles.promptText}>{session.promptText}</Text>
      <Text style={styles.frameworkLabel}>{session.suggestedFramework}</Text>

      {/* Overall Score */}
      <View style={styles.overallScoreCard}>
        <Text style={[styles.overallScore, { color: getScoreColor(feedback.overallScore) }]}>
          {feedback.overallScore}
        </Text>
        <Text style={styles.overallScoreLabel}>/10 Overall</Text>
      </View>

      {/* Score Breakdown */}
      <Text style={styles.sectionTitle}>Scores</Text>
      <View style={styles.scoresGrid}>
        {scoreEntries.map(([key, value]) => (
          <View key={key} style={styles.scoreItem}>
            <Text style={[styles.scoreValue, { color: getScoreColor(value as number) }]}>
              {value as number}
            </Text>
            <Text style={styles.scoreLabel}>
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
            </Text>
          </View>
        ))}
      </View>

      {/* Metrics */}
      <Text style={styles.sectionTitle}>Delivery Metrics</Text>
      <View style={styles.metricsCard}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Duration</Text>
          <Text style={styles.metricValue}>{Math.round(metrics.durationSeconds)}s</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Words per minute</Text>
          <Text style={[styles.metricValue, {
            color: metrics.wordsPerMinute >= 140 && metrics.wordsPerMinute <= 160 ? "#4ade80" : "#fbbf24",
          }]}>
            {metrics.wordsPerMinute}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Filler words</Text>
          <Text style={[styles.metricValue, {
            color: metrics.fillerWordCount <= 2 ? "#4ade80" : "#ef4444",
          }]}>
            {metrics.fillerWordCount}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Pauses</Text>
          <Text style={styles.metricValue}>{metrics.pauseCount}</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Avg pause</Text>
          <Text style={styles.metricValue}>{metrics.avgPauseDuration}s</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Silence ratio</Text>
          <Text style={styles.metricValue}>{Math.round(metrics.silenceRatio * 100)}%</Text>
        </View>
      </View>

      {/* Framework Analysis */}
      {feedback.frameworkAnalysis && (
        <>
          <Text style={styles.sectionTitle}>Framework: {feedback.frameworkAnalysis.framework}</Text>
          <View style={styles.frameworkCard}>
            {feedback.frameworkAnalysis.elementsPresent?.length > 0 && (
              <View style={styles.frameworkSection}>
                <Text style={styles.frameworkSectionTitle}>Elements Present</Text>
                {feedback.frameworkAnalysis.elementsPresent.map((el, i) => (
                  <Text key={i} style={styles.frameworkElement}>+ {el}</Text>
                ))}
              </View>
            )}
            {feedback.frameworkAnalysis.elementsMissing?.length > 0 && (
              <View style={styles.frameworkSection}>
                <Text style={styles.frameworkSectionTitleWarn}>Elements Missing</Text>
                {feedback.frameworkAnalysis.elementsMissing.map((el, i) => (
                  <Text key={i} style={styles.frameworkElementWarn}>- {el}</Text>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* Transcript Highlights */}
      {feedback.transcriptHighlights?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Key Moments</Text>
          {feedback.transcriptHighlights.map((h, i) => (
            <View key={i} style={[styles.highlightCard, { borderLeftColor: getHighlightColor(h.type) }]}>
              <Text style={[styles.highlightType, { color: getHighlightColor(h.type) }]}>
                {h.type.toUpperCase()}
              </Text>
              <Text style={styles.highlightPhrase}>"{h.phrase}"</Text>
              <Text style={styles.highlightNote}>{h.note}</Text>
            </View>
          ))}
        </>
      )}

      {/* Strengths */}
      {feedback.strengths?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Strengths</Text>
          {feedback.strengths.map((s, i) => (
            <View key={i} style={styles.strengthItem}>
              <Text style={styles.strengthText}>{s}</Text>
            </View>
          ))}
        </>
      )}

      {/* Primary Improvement + Drill */}
      {feedback.primaryImprovement && (
        <>
          <Text style={styles.sectionTitle}>Focus Area</Text>
          <View style={styles.improvementCard}>
            <Text style={styles.improvementArea}>{feedback.primaryImprovement.area}</Text>
            <Text style={styles.improvementWhy}>{feedback.primaryImprovement.why}</Text>
            <View style={styles.drillCard}>
              <Text style={styles.drillTitle}>Practice Drill</Text>
              <Text style={styles.drillText}>{feedback.primaryImprovement.drill}</Text>
            </View>
          </View>
        </>
      )}

      {/* Secondary Improvements */}
      {feedback.secondaryImprovements?.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Also Consider</Text>
          {feedback.secondaryImprovements.map((imp, i) => (
            <Text key={i} style={styles.secondaryItem}>
              {imp}
            </Text>
          ))}
        </>
      )}

      {/* Progress Note */}
      {feedback.progressNote && (
        <View style={styles.progressNote}>
          <Text style={styles.progressNoteText}>{feedback.progressNote}</Text>
        </View>
      )}

      {/* Transcript */}
      <Text style={styles.sectionTitle}>Full Transcript</Text>
      <View style={styles.transcriptCard}>
        <Text style={styles.transcriptText}>{session.transcript}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: { padding: 20, paddingBottom: 60 },
  centered: { flex: 1, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center", padding: 20 },
  errorText: { color: "#ff6b6b", fontSize: 16, textAlign: "center", marginBottom: 16 },
  retryButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: "#e94560" },
  retryText: { color: "#e94560", fontSize: 14 },

  promptText: { color: "#fff", fontSize: 17, fontWeight: "600", lineHeight: 24 },
  frameworkLabel: { color: "#e94560", fontSize: 12, fontWeight: "600", marginTop: 6, marginBottom: 20 },

  overallScoreCard: {
    alignItems: "center",
    backgroundColor: "#16213e",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  overallScore: { fontSize: 56, fontWeight: "700" },
  overallScoreLabel: { color: "#888", fontSize: 16, marginTop: -4 },

  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 10, marginTop: 20 },

  scoresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  scoreItem: {
    width: "31%",
    backgroundColor: "#16213e",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  scoreValue: { fontSize: 22, fontWeight: "700" },
  scoreLabel: { color: "#888", fontSize: 10, marginTop: 4, textAlign: "center" },

  metricsCard: { backgroundColor: "#16213e", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#0f3460" },
  metricRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  metricLabel: { color: "#888", fontSize: 14 },
  metricValue: { color: "#fff", fontSize: 14, fontWeight: "600" },

  frameworkCard: { backgroundColor: "#16213e", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#0f3460" },
  frameworkSection: { marginBottom: 12 },
  frameworkSectionTitle: { color: "#4ade80", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  frameworkSectionTitleWarn: { color: "#fbbf24", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  frameworkElement: { color: "#4ade80", fontSize: 13, lineHeight: 20, paddingLeft: 8 },
  frameworkElementWarn: { color: "#fbbf24", fontSize: 13, lineHeight: 20, paddingLeft: 8 },

  highlightCard: {
    backgroundColor: "#16213e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
  },
  highlightType: { fontSize: 10, fontWeight: "700", marginBottom: 4 },
  highlightPhrase: { color: "#fff", fontSize: 14, fontStyle: "italic", marginBottom: 4 },
  highlightNote: { color: "#888", fontSize: 12 },

  strengthItem: {
    backgroundColor: "#16213e",
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#4ade80",
  },
  strengthText: { color: "#ccc", fontSize: 13, lineHeight: 18 },

  improvementCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e94560",
  },
  improvementArea: { color: "#e94560", fontSize: 16, fontWeight: "700", marginBottom: 8 },
  improvementWhy: { color: "#ccc", fontSize: 13, lineHeight: 18, marginBottom: 12 },

  drillCard: {
    backgroundColor: "#0f3460",
    borderRadius: 8,
    padding: 12,
  },
  drillTitle: { color: "#e94560", fontSize: 12, fontWeight: "700", marginBottom: 6 },
  drillText: { color: "#fff", fontSize: 13, lineHeight: 18 },

  secondaryItem: {
    color: "#888",
    fontSize: 13,
    lineHeight: 20,
    paddingLeft: 8,
    marginBottom: 4,
  },

  progressNote: {
    backgroundColor: "#0f3460",
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  progressNoteText: { color: "#ccc", fontSize: 13, fontStyle: "italic" },

  transcriptCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  transcriptText: { color: "#ccc", fontSize: 14, lineHeight: 22 },
});
