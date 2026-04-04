import { Audio } from "expo-av";
import { Platform } from "react-native";

// Recording preset optimized for speech
const RECORDING_OPTIONS: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: ".wav",
    outputFormat: Audio.AndroidOutputFormat.DEFAULT,
    audioEncoder: Audio.AndroidAudioEncoder.DEFAULT,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
  },
  ios: {
    extension: ".wav",
    outputFormat: Audio.IOSOutputFormat.LINEARPCM,
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 16000,
    numberOfChannels: 1,
    bitRate: 256000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

export interface RecordingResult {
  uri: string;
  durationMs: number;
}

let currentRecording: Audio.Recording | null = null;

export async function requestPermissions(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  if (granted) {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  }
  return granted;
}

export async function startRecording(): Promise<void> {
  if (currentRecording) {
    await currentRecording.stopAndUnloadAsync();
    currentRecording = null;
  }

  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(RECORDING_OPTIONS);
  await recording.startAsync();
  currentRecording = recording;
}

export async function stopRecording(): Promise<RecordingResult | null> {
  if (!currentRecording) return null;

  await currentRecording.stopAndUnloadAsync();
  const uri = currentRecording.getURI();
  const status = await currentRecording.getStatusAsync();
  const durationMs = status.durationMillis || 0;

  currentRecording = null;

  if (!uri) return null;
  return { uri, durationMs };
}

export function isRecording(): boolean {
  return currentRecording !== null;
}
