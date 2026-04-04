import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup) {
      router.replace("/auth/sign-in");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#1a1a2e" }, headerTintColor: "#fff" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="session/[id]" options={{ title: "Session Details" }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
