import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // Navigation is handled by the auth guard in _layout.tsx
    } catch (err: any) {
      setError(err.message ?? "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🎙</Text>
        <Text style={styles.title}>Voice Coach</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#555"
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#555"
          secureTextEntry
          autoComplete="password"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleSignIn}
          returnKeyType="go"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Link href="/auth/forgot-password" asChild>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>
              <Text style={styles.linkAccent}>Forgot password?</Text>
            </Text>
          </TouchableOpacity>
        </Link>

        <Link href="/auth/sign-up" asChild>
          <TouchableOpacity style={styles.signUpLink}>
            <Text style={styles.linkText}>
              Don't have an account? <Text style={styles.linkAccent}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  logo: { fontSize: 56, textAlign: "center", marginBottom: 12 },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: "#888",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 40,
  },
  input: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0f3460",
    color: "#fff",
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  error: {
    color: "#ff6b6b",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#e94560",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  link: { alignItems: "center" },
  signUpLink: { alignItems: "center", marginTop: 16 },
  linkText: { color: "#888", fontSize: 14 },
  linkAccent: { color: "#e94560", fontWeight: "600" },
});
