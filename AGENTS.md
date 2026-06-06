## Project Name

RepurposePro

## Project Description

RepurposePro is an AI-powered video repurposing platform that transforms long-form videos into:

- A 7–10 minute short-form summary video
- Multiple vertical highlight reels optimized for TikTok, Instagram Reels, and YouTube Shorts

The backend uses a hybrid architecture:

- Express.js + TypeScript for the main application backend/API gateway
- FastAPI + Python for AI and video processing
- Neon Serverless Postgres for persistent data
- Better Auth for authentication and session management
- Arcjet for API protection, bot protection, and rate limiting
- Redis for background job queues
- S3-compatible storage for video assets

## Main Architecture

Use a monorepo-style backend structure:

```txt
repurposepro-backend/
├── services/
│   ├── api-gateway/      # Express.js + TypeScript main backend
│   └── ai-service/       # FastAPI + Python AI/video service
├── database/
├── storage/
├── docs/
└── scripts/
```

## Service Responsibilities

### Express.js API Gateway

The `services/api-gateway` service handles:

- Authentication using Better Auth
- Session management
- Authorization and role checks
- API protection using Arcjet
- Rate limiting and bot protection
- Users and roles
- Project CRUD
- Video upload coordination
- Dashboard data
- Templates
- Generated video records
- Export records
- Admin features
- Communication with the FastAPI AI service
- Database ownership
- User-facing REST API

### FastAPI AI Service

The `services/ai-service` service handles:

- Audio extraction
- Speech-to-text transcription
- Scene detection
- Topic segmentation
- Highlight scoring
- Summary generation
- Reel generation
- Caption generation
- Vertical reframing
- FFmpeg rendering
- AI/video processing pipelines

## Technology Stack

### API Gateway

Use:

- Node.js
- Express.js
- TypeScript
- Better Auth
- Arcjet
- Neon Serverless Postgres
- Prisma ORM
- Zod for validation
- Multer or presigned uploads for video uploads
- Redis/BullMQ for queues later
- Axios or fetch for internal API calls

### AI Service

Use:

- Python
- FastAPI
- Celery or RQ for workers
- Redis as broker
- FFmpeg for video/audio processing
- faster-whisper for transcription
- PySceneDetect for scene detection
- OpenCV for video analysis
- MediaPipe or YOLO later for subject tracking
- Pydantic for validation

## Database Strategy

Use **Neon Serverless Postgres** as the primary PostgreSQL database provider.

The database should store:

- Better Auth user/session/account data
- Users and roles
- Projects
- Processing jobs
- Generated video metadata
- Templates
- Export records
- Admin-related metadata

The database should **not** store video files directly.

Store actual video/audio/caption/output files in:

- Local storage for MVP development
- S3-compatible storage later, such as AWS S3, Cloudflare R2, or MinIO

## Neon + Prisma Requirements

Use Prisma ORM with Neon Serverless Postgres.

Recommended environment variables:

```txt
DATABASE_URL=
DIRECT_URL=
```

Use:

- `DATABASE_URL` for the pooled Neon connection string used by the application
- `DIRECT_URL` for the direct/unpooled Neon connection string used by Prisma migrations

Prisma schema should include:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Do not hard-code Neon credentials.

Always update `.env.example` when adding or changing database environment variables.

For local development, a Neon development branch is acceptable. A local Docker PostgreSQL instance may also be used when offline development is needed.

## Authentication Strategy

Use **Better Auth** for authentication instead of building custom JWT authentication from scratch.

Better Auth should handle:

- User registration
- User login
- User logout
- Session management
- Password hashing
- Auth route handlers
- Session validation
- Future plugins such as organizations, teams, 2FA, social login, or passkeys

The API Gateway should use session-based authentication through Better Auth.

Do not manually create custom JWT authentication unless explicitly requested.

## Better Auth Requirements

When implementing Better Auth:

- Use Better Auth with Express.js.
- Use Prisma as the database adapter when practical.
- Use Neon Serverless Postgres as the database.
- Configure Better Auth inside the API Gateway service.
- Keep auth-related configuration inside `src/lib/auth.ts` or `src/config/auth.ts`.
- Mount Better Auth routes under `/api/auth`.
- Use secure cookie/session settings for production.
- Use environment variables for auth secrets and URLs.
- Do not hard-code auth secrets.
- Do not log passwords, tokens, cookies, or session data.
- Update `.env.example` whenever new auth environment variables are added.

Recommended auth environment variables:

```txt
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5000
DATABASE_URL=
DIRECT_URL=
CORS_ORIGIN=http://localhost:3000
```

For local development, the API Gateway should run on port `5000`.

## API Protection Strategy

Use **Arcjet** for API protection in the Express.js API Gateway.

Arcjet should be added after the base API Gateway and Better Auth setup are working.

Arcjet should be used for:

- Rate limiting
- Bot protection
- Signup/login abuse prevention
- Upload abuse prevention
- Expensive processing-job abuse prevention
- General API shield/attack protection

Do not add Arcjet in Phase 1 unless explicitly requested.

## Arcjet Requirements

When implementing Arcjet:

- Configure Arcjet inside the API Gateway service.
- Keep Arcjet configuration inside `src/lib/arcjet.ts` or `src/config/arcjet.ts`.
- Use environment variables for Arcjet keys.
- Do not hard-code Arcjet credentials.
- Do not log Arcjet secrets.
- Update `.env.example` whenever Arcjet environment variables are added.
- Apply Arcjet middleware selectively to sensitive routes first, then expand globally if needed.
- Return clear `429 Too Many Requests` responses when rate limits are exceeded.
- Keep route-level rate limits strict for expensive operations.

Recommended Arcjet environment variables:

```txt
ARCJET_KEY=
ARCJET_ENV=development
```

Recommended initial protection policy:

```txt
General API routes:
- 100 requests per minute per IP or user

Auth routes:
- 5 to 10 attempts per minute per IP

Upload routes:
- 3 to 5 uploads per hour per authenticated user

Processing routes:
- 2 to 5 processing jobs per hour per authenticated user
```

Recommended protected routes:

```txt
/api/auth/*
/api/projects/:id/upload
/api/projects/:id/process
/api/jobs/*
/api/*
```

For MVP, prioritize Arcjet protection on:

```txt
/api/auth/*
/api/projects/:id/upload
/api/projects/:id/process
```

## Coding Rules

### General Rules

- Keep code modular, readable, and maintainable.
- Do not create unnecessary files.
- Do not build unrelated features unless requested.
- Prefer small, testable changes.
- Preserve existing file structure unless explicitly asked to refactor.
- Do not hard-code secrets, ports, credentials, tokens, or API keys.
- Use environment variables for configuration.
- Always update `.env.example` when adding new environment variables.
- Use clear and consistent naming.
- Avoid overly clever code.
- Add comments only when they clarify important logic.
- Use production-style error handling.
- Do not change the product name from RepurposePro.

## Express.js / TypeScript Rules

- Use TypeScript for all Express code.
- Use ES Modules.
- Use `async/await`.
- Use centralized error handling.
- Use controller-service-route separation.
- Keep business logic inside services, not controllers.
- Keep route handlers thin.
- Validate request bodies, params, and query strings.
- Use consistent API responses for non-Better Auth routes.
- Let Better Auth manage its own auth route responses.

Recommended response shape for custom API routes:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Recommended error response shape for custom API routes:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

## Express Folder Structure

Use this structure for the API Gateway:

```txt
services/api-gateway/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .env.example
└── src/
    ├── app.ts
    ├── server.ts
    ├── config/
    │   ├── env.ts
    │   ├── database.ts
    │   ├── redis.ts
    │   └── storage.ts
    ├── lib/
    │   ├── auth.ts
    │   ├── arcjet.ts
    │   └── prisma.ts
    ├── routes/
    │   ├── index.routes.ts
    │   ├── health.routes.ts
    │   ├── users.routes.ts
    │   ├── projects.routes.ts
    │   ├── videos.routes.ts
    │   ├── jobs.routes.ts
    │   ├── generated-videos.routes.ts
    │   └── admin.routes.ts
    ├── controllers/
    ├── services/
    ├── middlewares/
    │   ├── arcjet.middleware.ts
    │   ├── auth.middleware.ts
    │   ├── role.middleware.ts
    │   ├── error.middleware.ts
    │   └── not-found.middleware.ts
    ├── validators/
    ├── utils/
    └── tests/
```

## FastAPI / Python Rules

- Use FastAPI for the AI service.
- Use Pydantic schemas for request and response validation.
- Keep API routes thin.
- Put AI/video logic inside services, pipelines, or algorithms.
- Do not run long video processing directly inside a blocking request in production.
- Prefer background jobs for long-running tasks.
- Use structured logging.
- Use typed Python where practical.
- Keep FFmpeg commands isolated in utility functions.
- Store generated files using a storage service abstraction.

## FastAPI Folder Structure

Use this structure for the AI service:

```txt
services/ai-service/
├── requirements.txt
├── Dockerfile
├── .env.example
└── app/
    ├── main.py
    ├── api/
    │   ├── routes/
    │   │   ├── health.py
    │   │   ├── processing.py
    │   │   ├── transcription.py
    │   │   ├── highlights.py
    │   │   ├── summaries.py
    │   │   └── reels.py
    │   └── dependencies.py
    ├── core/
    │   ├── config.py
    │   ├── logging.py
    │   └── security.py
    ├── schemas/
    ├── services/
    ├── workers/
    ├── pipelines/
    ├── algorithms/
    ├── utils/
    └── tests/
```

## Build Order

Build the backend in this order:

1. Express.js API Gateway foundation
2. Better Auth setup
3. Prisma and Neon Serverless Postgres setup
4. User session verification and protected routes
5. Arcjet API protection
6. Project CRUD
7. Video upload
8. Processing job system
9. Mock FastAPI AI service
10. Express-to-FastAPI communication
11. Real FFmpeg audio extraction
12. Whisper transcription
13. Transcript segmentation
14. Basic highlight scoring
15. Summary clip generation
16. Reel clip generation
17. Captions
18. Vertical formatting
19. Templates, publishing, analytics, and admin tools

## Current Phase Guidance

When working on early phases, do not jump ahead.

### Phase 1 — API Gateway Foundation

For Phase 1:

- Build only the Express TypeScript foundation.
- Include health check.
- Include config loading.
- Include error handling.
- Include routing structure.
- Use ES Modules.
- Do not add database.
- Do not add Better Auth yet.
- Do not add Arcjet yet.
- Do not add authentication.
- Do not add FastAPI.
- Do not add AI processing.

### Phase 2 — Better Auth and Database

For Phase 2:

- Add Better Auth.
- Add Prisma.
- Add Neon Serverless Postgres.
- Add the required Better Auth database schema.
- Add auth and database environment variables.
- Add auth routes under `/api/auth`.
- Add session verification middleware for protected routes.
- Add a basic authenticated route for testing.

Do not build project CRUD until Better Auth is working.

### Phase 3 — Arcjet API Protection

For Phase 3:

- Add Arcjet to the API Gateway.
- Add Arcjet environment variables.
- Add Arcjet configuration in `src/lib/arcjet.ts` or `src/config/arcjet.ts`.
- Add route-level Arcjet middleware.
- Protect `/api/auth/*`.
- Protect future upload and processing routes once they exist.
- Add proper `429 Too Many Requests` error responses.
- Do not add project CRUD unless Arcjet setup is complete.

### Phase 4 — Project CRUD

For Phase 4:

- Add project CRUD.
- Projects must belong to authenticated users.
- Protect project routes with Better Auth session middleware.
- Enforce project ownership.
- Add role-based access where needed.

### Phase 5 — Video Upload

For Phase 5:

- Add video upload.
- Store uploaded video path or URL.
- Validate video file type and size.
- Update project status after upload.
- Keep actual video processing separate.

### Phase 6 — Processing Jobs

For Phase 6:

- Add processing jobs.
- Add job status tracking.
- Use mock processing before real AI.
- Do not implement real FFmpeg or Whisper until the job workflow works.

## Database Ownership

The Express.js API Gateway should own the main Neon PostgreSQL database.

FastAPI should not directly own business data during the MVP.

Preferred communication:

```txt
Express → FastAPI → returns results → Express saves results
```

or:

```txt
FastAPI → Express internal API → PostgreSQL
```

Avoid having both Express and FastAPI independently write to the same business tables unless specifically requested.

## Initial Database Models

Start with:

- User
- Session
- Account
- Verification
- Project
- ProcessingJob
- GeneratedVideo

The first four auth-related models may be generated or required by Better Auth.

Do not add billing, publishing, analytics, or advanced admin models until the core processing flow works.

## Suggested Status Values

Project status values:

```txt
draft
uploaded
queued
processing
completed
failed
```

Processing job status values:

```txt
queued
processing
completed
failed
cancelled
```

Generated video status values:

```txt
pending
rendering
ready
failed
```

Generated video types:

```txt
summary
reel
```

User roles:

```txt
admin
creator
editor
```

## API Route Style

Use RESTful routes for non-auth application routes.

Better Auth should own the auth routes under:

```txt
/api/auth/*
```

Recommended custom routes:

```txt
GET    /api/health

GET    /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id

POST   /api/projects/:id/upload
POST   /api/projects/:id/process

GET    /api/jobs/:id
GET    /api/projects/:id/jobs

GET    /api/projects/:id/generated-videos
GET    /api/generated-videos/:id
```

Do not manually implement these custom auth routes unless specifically requested:

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

Better Auth should provide the correct auth endpoints.

## Security Requirements

- Use Better Auth for authentication and sessions.
- Use Arcjet for API protection where appropriate.
- Use secure auth secrets.
- Protect all user-specific routes.
- Enforce project ownership.
- Add role-based authorization where needed.
- Validate all input.
- Restrict uploaded file types.
- Restrict uploaded file size.
- Never expose internal stack traces in production responses.
- Never commit `.env` files.
- Never log passwords, cookies, session IDs, tokens, or secrets.
- Never log Arcjet keys or security tokens.
- Use CORS carefully with credentials when using cookie-based sessions.
- Use HTTPS in production.

## Upload Requirements

For MVP, local storage is acceptable.

Later, switch to:

- AWS S3
- Cloudflare R2
- MinIO

Allowed input video formats:

- `.mp4`
- `.mov`
- `.mkv`
- `.webm`

Default maximum video duration:

- 2 hours

Default output formats:

- `.mp4`
- `.srt`
- `.vtt`
- `.json`

## Video Processing Requirements

The real AI pipeline should eventually follow this flow:

```txt
Input video
→ Extract audio
→ Transcribe audio
→ Generate timestamped transcript
→ Segment transcript
→ Detect scenes
→ Score highlight candidates
→ Select clips for summary
→ Select clips for reels
→ Render summary video
→ Render vertical reels
→ Generate captions
→ Store outputs
→ Return output metadata
```

## Summary Video Requirements

The summary video should:

- Be approximately 7–10 minutes long
- Preserve the main message of the original video
- Avoid repeated ideas
- Follow a coherent structure
- Use selected high-value segments
- Include captions where practical

## Reel Requirements

Reels should:

- Be vertical, preferably 9:16
- Be short and self-contained
- Start with a strong hook
- Contain one clear idea
- Include captions
- Be suitable for TikTok, Instagram Reels, and YouTube Shorts

## Testing Rules

When adding backend features:

- Add at least basic tests where practical.
- Test success cases.
- Test validation errors.
- Test authorization errors.
- Test rate-limit errors where Arcjet is applied.
- Test not-found cases.

For Express:

- Use Jest or Vitest with Supertest if tests are requested.

For FastAPI:

- Use pytest and FastAPI TestClient if tests are requested.

## Documentation Rules

Update documentation when adding:

- New environment variables
- New API routes
- New database models
- New processing pipeline steps
- New security middleware
- New setup commands

Keep `README.md` accurate.

## Command Expectations

After making code changes, run the relevant checks when possible.

For Express:

```bash
npm run build
npm run test
npm run lint
```

For FastAPI:

```bash
pytest
python -m compileall app
```

If a command fails, fix the issue or explain why it failed.

## Do Not Do Unless Asked

Do not:

- Add frontend code
- Add payment features
- Add social media publishing
- Add complex AI models
- Add Kubernetes
- Add cloud deployment config
- Add unnecessary abstractions
- Rewrite working code without reason
- Change the product name from RepurposePro
- Replace Better Auth with custom JWT authentication unless explicitly requested
- Remove Arcjet once it is added unless explicitly requested
