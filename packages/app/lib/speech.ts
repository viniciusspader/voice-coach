import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export interface TranscriptionResult {
  text: string;
  segments: { text: string; t0: number; t1: number }[];
}

/**
 * Request speech recognition permissions (microphone + speech recognizer).
 */
export async function requestSpeechPermissions(): Promise<boolean> {
  const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
  return result.granted;
}

/**
 * Check if on-device recognition is available.
 */
export async function isOnDeviceAvailable(): Promise<boolean> {
  try {
    const locales = await ExpoSpeechRecognitionModule.getSupportedLocales({});
    return locales.locales.some((l) => l.startsWith("en"));
  } catch {
    return false;
  }
}

/**
 * Start speech recognition and return the final transcript.
 * Uses Android's native on-device recognizer (no model download needed).
 */
export function startSpeechRecognition(options?: {
  onPartialResult?: (text: string) => void;
}): Promise<TranscriptionResult> {
  return new Promise((resolve, reject) => {
    const segments: { text: string; t0: number; t1: number }[] = [];
    let finalText = "";
    let segmentStart = Date.now();
    const sessionStart = Date.now();

    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      requiresOnDeviceRecognition: true,
      continuous: true,
      addsPunctuation: true,
    });

    // We need to use the module's event listeners directly
    const resultSub = ExpoSpeechRecognitionModule.addListener(
      "result",
      (event: any) => {
        const transcript = event.results?.[0]?.transcript || "";
        if (event.isFinal) {
          const now = Date.now();
          segments.push({
            text: transcript,
            t0: segmentStart - sessionStart,
            t1: now - sessionStart,
          });
          segmentStart = now;
          finalText = transcript;
        } else {
          options?.onPartialResult?.(transcript);
        }
      }
    );

    const endSub = ExpoSpeechRecognitionModule.addListener(
      "end",
      () => {
        resultSub.remove();
        endSub.remove();
        errorSub.remove();
        resolve({ text: finalText, segments });
      }
    );

    const errorSub = ExpoSpeechRecognitionModule.addListener(
      "error",
      (event: any) => {
        resultSub.remove();
        endSub.remove();
        errorSub.remove();
        reject(new Error(event.error || "Speech recognition failed"));
      }
    );
  });
}

/**
 * Stop the current speech recognition session.
 */
export function stopSpeechRecognition(): void {
  ExpoSpeechRecognitionModule.stop();
}

// Re-export the hook for components that want real-time updates
export { useSpeechRecognitionEvent };
