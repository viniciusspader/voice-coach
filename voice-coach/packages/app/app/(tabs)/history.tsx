import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { listSessions } from "../../lib/api";
import { SessionCardSkeleton } from "../../components/Skeleton";

interface SessionSummary {
  sessionId: string;
  promptText: string;
  createdAt: string;
  feedback: {
    overallScore: number;
    primaryImprovement?: { area: string };
  };
}

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [])
  );

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

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getScoreColor(score: number): string {
    if (score >= 8) return "#4ade80";
    if (score >= 6) return "#fbbf24";
    if (score >= 4) return "#fb923c";
    return "#ef4444";
  }

  function renderSession({ item }: { item: SessionSummary }) {
    const score = item.feedback?.overallScore || 0;
    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => router.push(`/session/${item.sessionId}`)}
      >
        <View style={styles.sessionHeader}>
          <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(score) + "20" }]}>
            <Text style={[styles.scoreText, { color: getScoreColor(score) }]}>
              {score}/10
            </Text>
          </View>
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.sessionPrompt} numberOfLines={2}>
          {item.promptText}
        </Text>
        {item.feedback?.primaryImprovement?.area && (
          <Text style={styles.focusArea}>
            Focus: {item.feedback.primaryImprovement.area}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { padding: 16, paddingTop: 16 }]}>
        {[...Array(6)].map((_, i) => (
          <SessionCardSkeleton key={i} />
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSessions}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (sessions.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No sessions yet</Text>
        <Text style={styles.emptySubtext}>
          Complete your first practice session to see it here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.listContent}
      data={sessions}
      keyExtractor={(item) => item.sessionId}
      renderItem={renderSession}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  listContent: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: "#1a1a2e", alignItems: "center", justifyContent: "center", padding: 20 },

  sessionCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  sessionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  scoreText: { fontSize: 14, fontWeight: "700" },
  dateText: { color: "#888", fontSize: 12 },
  sessionPrompt: { color: "#fff", fontSize: 15, lineHeight: 20 },
  focusArea: { color: "#e94560", fontSize: 12, marginTop: 8 },

  errorText: { color: "#ff6b6b", fontSize: 16, marginBottom: 16 },
  retryButton: { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: "#e94560" },
  retryText: { color: "#e94560", fontSize: 14 },

  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  emptySubtext: { color: "#888", fontSize: 14, textAlign: "center" },
});
