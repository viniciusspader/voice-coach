import { getIdToken } from "./auth";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 600;

interface AnalyzeRequest {
  promptId: string;
  promptText: string;
  suggestedFramework: string;
  transcript: string;
  metrics: any;
  previousScores?: any[];
}

async function apiFetch(path: string, options: RequestInit = {}, attempt = 0): Promise<any> {
  const token = await getIdToken();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
        ...options.headers,
      },
    });
  } catch (networkErr) {
    // Network failure — retry on transient connectivity issues
    if (attempt < MAX_RETRIES) {
      await delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
      return apiFetch(path, options, attempt + 1);
    }
    throw new Error("Network error. Check your connection and try again.");
  }

  // Retry on server errors (5xx) but not client errors (4xx)
  if (res.status >= 500 && attempt < MAX_RETRIES) {
    await delay(BASE_RETRY_DELAY_MS * 2 ** attempt);
    return apiFetch(path, options, attempt + 1);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }
    throw new Error(`Request failed (${res.status})${text ? `: ${text}` : ""}`);
  }

  return res.json();
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function analyze(data: AnalyzeRequest) {
  return apiFetch("/analyze", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listSessions(limit = 20) {
  return apiFetch(`/sessions?limit=${limit}`);
}

export async function getSession(id: string) {
  return apiFetch(`/sessions/${id}`);
}

export async function getProgress() {
  return apiFetch("/progress");
}
