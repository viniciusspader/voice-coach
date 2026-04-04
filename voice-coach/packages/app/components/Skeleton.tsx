import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, type ViewStyle } from "react-native";

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height, borderRadius = 6, style }: SkeletonBoxProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.box,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SessionCardSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonBox width={56} height={28} borderRadius={8} />
        <SkeletonBox width={100} height={14} />
      </View>
      <SkeletonBox height={16} style={{ marginTop: 10 }} />
      <SkeletonBox width="60%" height={12} style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: "#0f3460" },
  card: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
