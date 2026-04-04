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

type Step = "request" | "confirm";

export default function ForgotPasswordScreen() {
  const { forgotPassword, confirmForgotPassword, signIn } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest() {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep("confirm");
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!code.trim() || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await confirmForgotPassword(email.trim(), code.trim(), newPassword);
      await signIn(email.trim(), newPassword);
      // Navigation handled by auth guard
    } catch (err: any) {
      setError(err.message ?? "Password reset failed. Please try again.");
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
        <Text style={styles.logo}>🔑</Text>
        <Text style={styles.title}>Reset Password</Text>

        {step === "request" ? (
          <>
            <Text style={styles.subtitle}>
              Enter your email and we'll send you a verification code
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#555"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={handleRequest}
              returnKeyType="go"
              autoFocus
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequest}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Code</Text>
              )}
            </TouchableOpacity>

            <Link href="/auth/sign-in" asChild>
              <TouchableOpacity style={styles.link}>
                <Text style={styles.linkText}>
                  <Text style={styles.linkAccent}>Back to sign in</Text>
                </Text>
              </TouchableOpacity>
            </Link>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>
              Enter the code sent to{"\n"}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor="#555"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
              autoFocus
            />
            <TextInput
              style={styles.input}
              placeholder="New password (min. 8 characters)"
              placeholderTextColor="#555"
              secureTextEntry
              autoComplete="new-password"
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor="#555"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onSubmitEditing={handleConfirm}
              returnKeyType="go"
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
                <Text style={styles.buttonText}>Reset & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.link} onPress={() => { setStep("request"); setError(null); }}>
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
