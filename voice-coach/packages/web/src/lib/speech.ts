export interface SpeechSegment {
  text: string;
  t0: number;
  t1: number;
}

export interface SpeechResult {
  text: string;
  segments: SpeechSegment[];
}

interface SpeechCallbacks {
  onPartialResult: (partial: string) => void;
  onSegmentComplete: (accumulated: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognition: any = null;
let stopRequested = false;

export async function requestSpeechPermissions(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export function startSpeechRecognition(callbacks: SpeechCallbacks): Promise<SpeechResult> {
  return new Promise((resolve, reject) => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      reject(new Error("Speech recognition is not supported in this browser."));
      return;
    }

    recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let accumulatedText = "";
    const segments: SpeechSegment[] = [];
    let segmentStart = Date.now();
    stopRequested = false;

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          const t0 = segmentStart;
          const t1 = Date.now();
          accumulatedText += (accumulatedText ? " " : "") + text;
          segments.push({ text, t0, t1 });
          segmentStart = t1;
          callbacks.onSegmentComplete(accumulatedText);
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) callbacks.onPartialResult(interim);
    };

    recognition.onend = () => {
      if (!stopRequested) {
        // Chrome Android auto-stops after silence; restart to keep recording
        try {
          recognition?.start();
        } catch {
          // already starting
        }
        return;
      }
      resolve({ text: accumulatedText, segments });
    };

    recognition.onerror = (event: any) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        if (stopRequested) resolve({ text: accumulatedText, segments });
        return;
      }
      reject(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.start();
  });
}

export function stopSpeechRecognition(): void {
  stopRequested = true;
  recognition?.stop();
  recognition = null;
}
