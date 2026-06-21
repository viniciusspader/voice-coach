# Voice Coach

AI-powered communication coaching app. Users submit speaking recordings/transcripts and receive structured feedback using frameworks from Carmine Gallo, Chip & Dan Heath (SUCCES), Monroe's Motivated Sequence, and Toastmasters.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (deployed to Vercel) |
| Auth | AWS Cognito User Pool (`selfSignUpEnabled: true` — open sign-up) |
| API | AWS API Gateway + Lambda (Node, `index.mjs`) with Cognito authorizer |
| AI | AWS Bedrock (Claude via Lambda) |
| Database | DynamoDB (`SessionsTable` — coaching session history per user) |
| IaC | AWS CDK v2 (TypeScript, `voice-coach/packages/aws/cdk.ts`) |
| Hosting | Vercel (frontend) + AWS (API + Lambda) |

## Monorepo structure (npm workspaces)

```
voice-coach/
├── voice-coach/
│   └── packages/
│       ├── shared/     Shared types/utilities
│       ├── aws/        CDK stack + Lambda handler (index.mjs)
│       └── web/        Next.js frontend (deployed to Vercel, vercel.json present)
└── CLAUDE.md
```

> Note: the repo root is `voice-coach/` but the actual workspace root is the nested `voice-coach/voice-coach/`.

## DynamoDB (us-east-1, account 246848344354)

| Table | PK | Notes |
|---|---|---|
| SessionsTable | Cognito `sub` (userId) | Coaching session history, keyed by user |

## Key decisions

- **Open sign-up (unlike other projects)**: `selfSignUpEnabled: true` — anyone can register. This is intentional (public SaaS tool vs. invite-only family apps).
- **Vercel for frontend**: Like madrid-family-planner, the Next.js frontend is on Vercel. AWS handles only the API + Lambda + auth.
- **Bedrock in Lambda**: Claude is called from Lambda (not directly from the frontend), keeping the Anthropic model access server-side.
- **Nested monorepo**: The workspace is double-nested (`voice-coach/voice-coach/`).

## Dev workflow

```bash
# Frontend
cd voice-coach/packages/web && npm run dev

# Deploy infra
cd voice-coach/packages/aws && npx cdk deploy
```
