import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const bedrock = new BedrockRuntimeClient();
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient());

const TABLE = process.env.SESSIONS_TABLE;

// ── Auth helper ──

function getUserId(event) {
  return event.requestContext?.authorizer?.claims?.sub ?? null;
}

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(body),
  };
}

// ── Coaching Prompt ──

const SYSTEM_PROMPT = `You are an expert communication coach trained in the methodologies of Carmine Gallo (Talk Like TED), Chip & Dan Heath (Made to Stick - SUCCES), Monroe's Motivated Sequence, and Toastmasters evaluation frameworks.

Your role is to analyze a speaking performance and provide specific, actionable feedback.
You MUST:
- Reference exact phrases or sentences from the transcript
- Evaluate against the suggested framework for this scenario
- Ground your feedback in established communication principles
- Be encouraging but direct — one key improvement focus per session
- Provide a specific drill or exercise to practice the improvement

EVALUATION DIMENSIONS:

1. CONTENT & STRUCTURE (What was said)
   - Core message clarity: Is there ONE clear thesis? (Made to Stick: Simple)
   - Structure: Does it follow the suggested framework? (PREP, Monroe's, Rule of 3, Hero's Journey)
   - Opening hook: Does it capture attention in first 15 seconds?
   - Specificity: Concrete examples vs. vague abstractions? (Made to Stick: Concrete)
   - Emotional resonance: Connection before data? (Made to Stick: Emotional, Stories)
   - Call to action: What should the audience do/think/feel?

2. DELIVERY & PACING (How it was said — based on provided metrics)
   - Speaking pace: 140-160 WPM is optimal; >180 reduces comprehension by 20-30%
   - Pause usage: Strategic pauses improve memorability by up to 38% (micro: 0.5-1s after key points, standard: 1-2s between sections, dramatic: 2-4s before revelations)
   - Filler words: Each filler erodes perceived confidence; suggest replacing with pauses
   - Pace variation: Monotone pace vs. dynamic variation

3. LANGUAGE & WORD CHOICE
   - Active vs. passive voice
   - Sensory/concrete language vs. abstract ("the budget is $2K for 5 campaigns" > "the budget is tight")
   - Conversational tone vs. "presentation voice"
   - Sentence variety (short punchy + longer explanatory)

4. ENGAGEMENT & CONNECTION
   - Does it feel authentic and passionate? (Talk Like TED: Passion)
   - Any surprise/unexpected elements? (Made to Stick: Unexpected)
   - Story quality if narrative present: protagonist, conflict, transformation

Respond ONLY with valid JSON, no markdown fences or extra text.`;

function buildUserPrompt(data) {
  const { promptText, suggestedFramework, transcript, metrics, previousScores } = data;
  const m = metrics;

  let prompt = `SCENARIO: ${promptText}
SUGGESTED FRAMEWORK: ${suggestedFramework}
TRANSCRIPT: ${transcript}
DURATION: ${m.durationSeconds}s
METRICS:
- Words: ${m.wordCount}, WPM: ${m.wordsPerMinute}
- Filler words (${m.fillerWordCount}): ${m.fillerWords.map((f) => f.word).join(", ") || "none"}
- Pauses: ${m.pauseCount}, avg ${m.avgPauseDuration.toFixed(1)}s, longest ${m.longestPause.toFixed(1)}s
- Silence ratio: ${(m.silenceRatio * 100).toFixed(1)}%
- Segments: ${m.segmentCount}`;

  if (previousScores?.length) {
    prompt += `\n\nPREVIOUS SESSION SCORES (most recent first):\n${previousScores
      .map(
        (s, i) =>
          `Session ${i + 1}: clarity=${s.messageClarity}, structure=${s.structure}, pacing=${s.pacing}, confidence=${s.vocalConfidence}, engagement=${s.engagement}, language=${s.languageQuality}`
      )
      .join("\n")}`;
  }

  prompt += `\n\nRespond in this exact JSON structure:
{
  "overallScore": <1-10>,
  "scores": {
    "messageClarity": <1-10>,
    "structure": <1-10>,
    "pacing": <1-10>,
    "vocalConfidence": <1-10>,
    "engagement": <1-10>,
    "languageQuality": <1-10>
  },
  "frameworkAnalysis": {
    "framework": "<name>",
    "elementsPresent": ["<which parts they nailed>"],
    "elementsMissing": ["<which parts were weak or absent>"]
  },
  "transcriptHighlights": [
    {"phrase": "<exact quote>", "type": "<strength|filler|improvement>", "note": "<why>"}
  ],
  "strengths": ["<3 specific things done well, referencing exact phrases>"],
  "primaryImprovement": {
    "area": "<the ONE thing to focus on>",
    "why": "<grounded in communication science>",
    "drill": "<specific 2-minute exercise to practice this>"
  },
  "secondaryImprovements": ["<2 other areas to work on later>"],
  "progressNote": "<comparison to previous sessions if data available>"
}`;

  return prompt;
}

// ── Action handlers ──

async function handleAnalyze(body, userId) {
  const { promptId, promptText, suggestedFramework, transcript, metrics, previousScores } = body;

  // Call Bedrock
  const userPrompt = buildUserPrompt({ promptText, suggestedFramework, transcript, metrics, previousScores });

  const bedrockResponse = await bedrock.send(
    new InvokeModelCommand({
      modelId: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    })
  );

  const bedrockResult = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
  let feedbackText = bedrockResult.content[0].text;
  // Strip markdown code fences if present
  feedbackText = feedbackText.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  const feedback = JSON.parse(feedbackText);

  // Generate session ID (timestamp-based)
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Save to DynamoDB
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        userId,
        sessionId,
        promptId,
        promptText,
        suggestedFramework,
        transcript,
        metrics,
        feedback,
        createdAt: new Date().toISOString(),
      },
    })
  );

  return response(200, { sessionId, feedback });
}

async function handleListSessions(queryParams, userId) {
  const limit = parseInt(queryParams?.limit || "20", 10);

  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      ScanIndexForward: false, // newest first
      Limit: limit,
      ProjectionExpression: "sessionId, promptText, createdAt, feedback",
    })
  );

  return response(200, { sessions: result.Items || [] });
}

async function handleGetSession(sessionId, userId) {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { userId, sessionId },
    })
  );

  if (!result.Item) return response(404, { error: "Session not found" });
  return response(200, result.Item);
}

async function handleGetProgress(userId) {
  // Fetch last 30 sessions for trend data
  const result = await ddb.send(
    new QueryCommand({
      TableName: TABLE,
      IndexName: "userId-createdAt-index",
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: { ":uid": userId },
      ExpressionAttributeNames: { "#m": "metrics" },
      ScanIndexForward: false,
      Limit: 30,
      ProjectionExpression: "createdAt, #m, feedback",
    })
  );

  const sessions = result.Items || [];
  if (sessions.length === 0) {
    return response(200, {
      totalSessions: 0,
      avgOverallScore: 0,
      avgWpm: 0,
      avgFillerCount: 0,
      recentTrend: [],
    });
  }

  const totalSessions = sessions.length;
  const avgOverallScore =
    sessions.reduce((sum, s) => sum + (s.feedback?.overallScore || 0), 0) / totalSessions;
  const avgWpm =
    sessions.reduce((sum, s) => sum + (s.metrics?.wordsPerMinute || 0), 0) / totalSessions;
  const avgFillerCount =
    sessions.reduce((sum, s) => sum + (s.metrics?.fillerWordCount || 0), 0) / totalSessions;

  const recentTrend = sessions
    .map((s) => ({
      date: s.createdAt,
      overallScore: s.feedback?.overallScore || 0,
      wpm: s.metrics?.wordsPerMinute || 0,
      fillerCount: s.metrics?.fillerWordCount || 0,
    }))
    .reverse(); // chronological order for charts

  return response(200, {
    totalSessions,
    avgOverallScore: Math.round(avgOverallScore * 10) / 10,
    avgWpm: Math.round(avgWpm),
    avgFillerCount: Math.round(avgFillerCount * 10) / 10,
    recentTrend,
  });
}

// ── Main handler ──

export async function handler(event) {
  console.log("Event:", JSON.stringify(event));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return response(401, { error: "Unauthorized" });
    }

    const method = event.httpMethod;
    const path = event.resource;

    if (method === "POST" && path === "/analyze") {
      const body = JSON.parse(event.body);
      return await handleAnalyze(body, userId);
    }

    if (method === "GET" && path === "/sessions") {
      return await handleListSessions(event.queryStringParameters, userId);
    }

    if (method === "GET" && path === "/sessions/{id}") {
      return await handleGetSession(event.pathParameters.id, userId);
    }

    if (method === "GET" && path === "/progress") {
      return await handleGetProgress(userId);
    }

    return response(404, { error: "Not found" });
  } catch (err) {
    console.error("Handler error:", err);
    return response(500, { error: "Internal server error" });
  }
}
