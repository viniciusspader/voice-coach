export interface RecordingResult {
  uri: string;
  durationMs: number;
}

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let startTime = 0;
let activeStream: MediaStream | null = null;

export async function requestPermissions(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export async function startRecording(): Promise<void> {
  activeStream = await navigator.mediaDevices.getUserMedia({
    audio: { sampleRate: 16000, channelCount: 1 } as MediaTrackConstraints,
  });
  chunks = [];

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  mediaRecorder = new MediaRecorder(activeStream, { mimeType });
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  mediaRecorder.start(250);
  startTime = performance.now();
}

export function isRecording(): boolean {
  return mediaRecorder?.state === "recording";
}

export function stopRecording(): Promise<RecordingResult> {
  return new Promise((resolve) => {
    if (!mediaRecorder) {
      resolve({ uri: "", durationMs: 0 });
      return;
    }
    const durationMs = performance.now() - startTime;
    mediaRecorder.onstop = () => {
      const mimeType = mediaRecorder!.mimeType;
      const blob = new Blob(chunks, { type: mimeType });
      const uri = URL.createObjectURL(blob);
      activeStream?.getTracks().forEach((t) => t.stop());
      activeStream = null;
      chunks = [];
      mediaRecorder = null;
      resolve({ uri, durationMs });
    };
    mediaRecorder.stop();
  });
}
