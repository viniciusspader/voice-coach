import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { VictoryChart, VictoryLine, VictoryBar, VictoryAxis, VictoryScatter } from "victory-native";
import { getProgress } from "../../lib/api";

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

const CHART_WIDTH = Dimensions.get("window").width - 40;
const CHART_HEIGHT = 180;

const darkTheme = {
  axis: {
    style: {
      axis: { stroke: "#0f3460" },
      tickLabels: { fill: "#888", fontSize: 11 },
      grid: { stroke: "#16213e", strokeDasharray: "4,4" },
    },
  },
};

export default function ProgressScreen() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

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

  function getBarFill(value: number, type: "wpm" | "filler"): string {
    return type === "wpm" ? getWpmColor(value) : getFillerColor(value);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#e94560" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadProgress}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data || data.totalSessions === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No data yet</Text>
        <Text style={styles.emptySubtext}>
          Complete a few practice sessions to start tracking your progress.
        </Text>
      </View>
    );
  }

  const trend = data.recentTrend.slice(-15); // cap at 15 for readability
  const scoreData = trend.map((e, i) => ({ x: i + 1, y: e.overallScore }));
  const wpmData = trend.map((e, i) => ({ x: i + 1, y: e.wpm }));
  const fillerData = trend.map((e, i) => ({ x: i + 1, y: e.fillerCount }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Cards */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{data.totalSessions}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#e94560" }]}>
            {data.avgOverallScore.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getWpmColor(data.avgWpm) }]}>
            {data.avgWpm}
          </Text>
          <Text style={styles.statLabel}>Avg WPM</Text>
          <Text style={styles.statHint}>Optimal: 140–160</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: getFillerColor(data.avgFillerCount) }]}>
            {data.avgFillerCount.toFixed(1)}
          </Text>
          <Text style={styles.statLabel}>Avg Fillers</Text>
          <Text style={styles.statHint}>Goal: 0–2</Text>
        </View>
      </View>

      {trend.length >= 2 && (
        <>
          {/* Score Chart */}
          <Text style={styles.sectionTitle}>Overall Score</Text>
          <View style={styles.chartCard}>
            <VictoryChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              padding={{ top: 16, bottom: 36, left: 40, right: 16 }}
              domain={{ y: [0, 10] }}
            >
              <VictoryAxis
                tickFormat={(t: number) => (Number.isInteger(t) ? String(t) : "")}
                style={darkTheme.axis.style}
              />
              <VictoryAxis
                dependentAxis
                tickValues={[0, 2, 4, 6, 8, 10]}
                style={darkTheme.axis.style}
              />
              <VictoryLine
                data={scoreData}
                style={{ data: { stroke: "#e94560", strokeWidth: 2 } }}
                interpolation="monotoneX"
              />
              <VictoryScatter
                data={scoreData}
                size={4}
                style={{ data: { fill: "#e94560" } }}
              />
            </VictoryChart>
            <Text style={styles.chartHint}>Session number (oldest → newest)</Text>
          </View>

          {/* WPM Chart */}
          <Text style={styles.sectionTitle}>Words per Minute</Text>
          <View style={styles.chartCard}>
            <VictoryChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              padding={{ top: 16, bottom: 36, left: 44, right: 16 }}
            >
              <VictoryAxis
                tickFormat={(t: number) => (Number.isInteger(t) ? String(t) : "")}
                style={darkTheme.axis.style}
              />
              <VictoryAxis dependentAxis style={darkTheme.axis.style} />
              <VictoryBar
                data={wpmData}
                style={{
                  data: {
                    fill: ({ datum }: any) => getBarFill(datum?.y ?? 0, "wpm"),
                    width: Math.max(6, Math.min(18, (CHART_WIDTH - 60) / trend.length - 4)),
                  },
                }}
              />
            </VictoryChart>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: "#4ade80" }]} />
              <Text style={styles.legendText}>140–160 WPM</Text>
              <View style={[styles.legendDot, { backgroundColor: "#fbbf24", marginLeft: 12 }]} />
              <Text style={styles.legendText}>120–180 WPM</Text>
              <View style={[styles.legendDot, { backgroundColor: "#ef4444", marginLeft: 12 }]} />
              <Text style={styles.legendText}>Out of range</Text>
            </View>
          </View>

          {/* Filler Words Chart */}
          <Text style={styles.sectionTitle}>Filler Words</Text>
          <View style={styles.chartCard}>
            <VictoryChart
              width={CHART_WIDTH}
              height={CHART_HEIGHT}
              padding={{ top: 16, bottom: 36, left: 40, right: 16 }}
            >
              <VictoryAxis
                tickFormat={(t: number) => (Number.isInteger(t) ? String(t) : "")}
                style={darkTheme.axis.style}
              />
              <VictoryAxis dependentAxis style={darkTheme.axis.style} />
              <VictoryBar
                data={fillerData}
                style={{
                  data: {
                    fill: ({ datum }: any) => getBarFill(datum?.y ?? 0, "filler"),
                    width: Math.max(6, Math.min(18, (CHART_WIDTH - 60) / trend.length - 4)),
                  },
                }}
              />
            </VictoryChart>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: "#4ade80" }]} />
              <Text style={styles.legendText}>0–2 (great)</Text>
              <View style={[styles.legendDot, { backgroundColor: "#fbbf24", marginLeft: 12 }]} />
              <Text style={styles.legendText}>3–5 (ok)</Text>
              <View style={[styles.legendDot, { backgroundColor: "#ef4444", marginLeft: 12 }]} />
              <Text style={styles.legendText}>6+ (work on it)</Text>
            </View>
          </View>
        </>
      )}

      {trend.length === 1 && (
        <View style={styles.notEnoughData}>
          <Text style={styles.notEnoughDataText}>
            Complete at least 2 sessions to see trend charts.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  content: { padding: 20, paddingBottom: 40 },
  centered: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 8 },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  statValue: { color: "#fff", fontSize: 28, fontWeight: "700" },
  statLabel: { color: "#888", fontSize: 12, marginTop: 4 },
  statHint: { color: "#555", fontSize: 10, marginTop: 2 },

  chartCard: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
    marginBottom: 16,
    overflow: "hidden",
    alignItems: "center",
    paddingBottom: 8,
  },
  chartHint: { color: "#555", fontSize: 10, textAlign: "center", marginTop: 2, marginBottom: 4 },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { color: "#888", fontSize: 10 },

  errorText: { color: "#ff6b6b", fontSize: 16, marginBottom: 16 },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e94560",
  },
  retryText: { color: "#e94560", fontSize: 14 },

  emptyTitle: { color: "#fff", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  emptySubtext: { color: "#888", fontSize: 14, textAlign: "center" },

  notEnoughData: { alignItems: "center", paddingVertical: 20 },
  notEnoughDataText: { color: "#555", fontSize: 13, textAlign: "center" },
});
