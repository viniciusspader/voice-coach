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
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext";

type Step = "register" | "confirm";

export default function SignUpScreen() {
  const { signUp, confirmSignUp, signIn } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(email.trim(), password);
      setStep("confirm");
    } catch (err: any) {
      setError(err.message ?? "Sign-up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmSignUp(email.trim(), code.trim());
      // Auto sign-in after successful confirmation
      await signIn(email.trim(), password);
      // Navigation handled by auth guard
    } catch (err: any) {
      setError(err.message ?? "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🎙</Text>
        <Text style={styles.title}>Create Account</Text>

        {step === "register" ? (
          <>
            <Text style={styles.subtitle}>Start improving your communication</Text>

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
              placeholder="Password (min. 8 characters)"
              placeholderTextColor="#555"
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#555"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleRegister}
              returnKeyType="go"
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <Link href="/auth/sign-in" asChild>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkAccent}>Sign in</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              We sent a verification code to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              onSubmitEditing={handleConfirm}
              returnKeyType="go"
              autoFocus
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={() => { setStep("register"); setError(null); }}>
              <Text style={styles.linkText}>
                <Text style={styles.linkAccent}>Go back</Text>
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a1a2e" },
  inner: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
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
    lineHeight: 22,
  },
  emailHighlight: { color: "#e94560", fontWeight: "600" },
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
  linkText: { color: "#888", fontSize: 14 },
  linkAccent: { color: "#e94560", fontWeight: "600" },
});
