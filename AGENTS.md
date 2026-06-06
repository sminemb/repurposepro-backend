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
- Redis for background job queues later
- S3-compatible storage for video assets later

## Main Architecture

Use a monorepo-style backend structure:

```txt
repurposepro-backend/
├── AGENTS.md
├── README.md
├── docker-compose.yml
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
- Processing job records
- Generated video metadata
- Notification records
- Templates later
- Export records later
- Admin features later
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

The frontend should call the Express API Gateway only. The FastAPI AI Service is an internal backend service and should not be exposed directly to end users.

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
- Multer for local MVP video uploads
- Redis/BullMQ for queues later
- Axios or fetch for internal API calls

### AI Service

Use:

- Python
- FastAPI
- Pydantic for request and response validation
- Celery or RQ for workers later
- Redis as broker later
- FFmpeg for video/audio processing
- faster-whisper for transcription
- PySceneDetect for scene detection
- OpenCV for video analysis
- MediaPipe or YOLO later for subject tracking
- pytest for testing FastAPI logic

### AI Service Additional Tools

Use these tools gradually as the pipeline becomes real:

- FFmpeg for audio extraction, cutting, concatenation, scaling, and rendering
- faster-whisper for speech-to-text transcription
- PySceneDetect for scene detection
- OpenCV for video analysis
- MediaPipe or YOLO later for face/person tracking
- Pydantic for request and response validation
- pytest for testing FastAPI logic

Do not add all AI tools at once. Add them only when the matching phase requires them.

## Database Strategy

Use Neon Serverless Postgres as the primary PostgreSQL database provider.

The database should store:

- Better Auth user/session/account data
- Users and roles
- Projects
- Processing jobs
- Generated video metadata
- Notification records
- Templates later
- Export records later
- Admin-related metadata later

The database should not store video files directly.

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

Use Better Auth for authentication instead of building custom JWT authentication from scratch.

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

Use Arcjet for API protection in the Express.js API Gateway.

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
- 3 to 5 uploads per hour per authenticated user or IP

Processing routes:
- 2 to 5 processing jobs per hour per authenticated user or IP
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

## Notification Strategy

RepurposePro should support notifications after the core processing flow is connected.

Notifications should be owned by the Express.js API Gateway, not the FastAPI AI Service.

The backend should:

- Create notification records
- Store notifications in Neon/PostgreSQL
- Associate notifications with users
- Track read/unread status
- Trigger notifications when important project/job events happen
- Provide notification API routes for the frontend

The frontend should:

- Display notification bell/count
- Display notification dropdown or notification page
- Show toast messages when useful
- Mark notifications as read
- Poll the API or later subscribe to real-time events

For MVP, use REST-based notifications first. Real-time notifications using Server-Sent Events or WebSockets can be added later.

### Notification Events

Create notifications for events such as:

- Video uploaded successfully
- Processing job started
- Processing job completed
- Processing job failed
- Summary video is ready
- Reels are ready

Recommended notification types:

```txt
video_uploaded
processing_started
processing_completed
processing_failed
generated_video_ready
```

### Notification Database Model

Add a `Notification` model when the notification phase begins.

Recommended Prisma model:

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String
  read      Boolean          @default(false)
  metadata  Json?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum NotificationType {
  video_uploaded
  processing_started
  processing_completed
  processing_failed
  generated_video_ready
}
```

Also add the reverse relation to the `User` model:

```prisma
notifications Notification[]
```

### Notification API Routes

Recommended notification routes:

```txt
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/:id/read
PATCH /api/notifications/read-all
```

Rules:

- All notification routes must be protected by Better Auth session middleware.
- Users can only access their own notifications.
- Admin users may access all notifications only if an admin-specific route is added later.
- Use Zod validation for params and query inputs.
- Use the existing response helper.
- Use the existing centralized error handler.

### Notification Folder Structure

Add these files during the notification phase:

```txt
services/api-gateway/src/
├── routes/
│   └── notifications.routes.ts
├── controllers/
│   └── notifications.controller.ts
├── services/
│   └── notifications.service.ts
├── validators/
│   └── notification.validator.ts
```

Optional later:

```txt
services/api-gateway/src/
├── services/
│   └── realtime.service.ts
```

### Notification Rules

- Express API Gateway owns notification logic.
- FastAPI AI Service should not directly create notifications.
- FastAPI can return processing results to Express.
- Express should decide which notification records to create.
- Notifications should be stored in Neon/PostgreSQL.
- Notifications should not block video processing if notification creation fails.
- Notification failures should be logged but should not crash the processing workflow.

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
- Do not jump ahead to later phases unless explicitly requested.
- Make sure each phase builds and runs before moving to the next phase.

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
- Avoid using `any` unless absolutely necessary.
- Add or update Express request typing when authentication data is attached to `req`.

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
├── prisma/
│   └── schema.prisma
├── storage/
│   └── uploads/
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
    │   ├── me.routes.ts
    │   ├── users.routes.ts
    │   ├── projects.routes.ts
    │   ├── videos.routes.ts
    │   ├── jobs.routes.ts
    │   ├── generated-videos.routes.ts
    │   ├── notifications.routes.ts
    │   └── admin.routes.ts
    ├── controllers/
    ├── services/
    ├── middlewares/
    │   ├── arcjet.middleware.ts
    │   ├── auth.middleware.ts
    │   ├── role.middleware.ts
    │   ├── upload.middleware.ts
    │   ├── validate.middleware.ts
    │   ├── error.middleware.ts
    │   └── not-found.middleware.ts
    ├── validators/
    ├── utils/
    ├── types/
    └── tests/
```

## FastAPI / Python Rules

- Use FastAPI for the AI service.
- Use Pydantic schemas for request and response validation.
- Keep API routes thin.
- Put AI/video logic inside services, pipelines, or algorithms.
- Do not run long video processing directly inside a blocking request in production.
- Prefer background jobs for long-running tasks later.
- Use structured logging.
- Use typed Python where practical.
- Keep FFmpeg commands isolated in utility functions.
- Store generated files using a storage service abstraction.
- Keep the FastAPI service internal to the backend system.

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
    │   ├── processing_schema.py
    │   ├── transcript_schema.py
    │   ├── highlight_schema.py
    │   ├── summary_schema.py
    │   └── reel_schema.py
    ├── services/
    │   ├── processing_service.py
    │   ├── audio_service.py
    │   ├── transcription_service.py
    │   ├── highlight_service.py
    │   ├── summary_service.py
    │   ├── reel_service.py
    │   ├── caption_service.py
    │   └── storage_service.py
    ├── workers/
    ├── pipelines/
    │   ├── full_video_pipeline.py
    │   ├── summary_pipeline.py
    │   └── reels_pipeline.py
    ├── algorithms/
    │   ├── segmenter.py
    │   ├── highlight_scoring.py
    │   ├── mmr_selector.py
    │   ├── hook_detector.py
    │   └── vertical_crop_tracker.py
    ├── utils/
    │   ├── ffmpeg_utils.py
    │   ├── file_utils.py
    │   ├── time_utils.py
    │   └── exceptions.py
    └── tests/
```

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
- Notification

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

Notification types:

```txt
video_uploaded
processing_started
processing_completed
processing_failed
generated_video_ready
```

User roles:

```txt
admin
creator
editor
```

## User Role Guidance

Use one `User` table with a `role` field.

The roles are:

### admin

Admin users can manage the system.

Typical admin permissions:

- View all users
- View all projects
- Manage system-level records
- Access admin routes
- Debug or review processing jobs
- Manage future templates/settings

### creator

Creator users are the main normal users.

Typical creator permissions:

- Create projects
- Upload videos
- Start processing jobs
- View their own generated videos
- Edit or delete their own projects
- Export/download their own outputs later

### editor

Editor users are collaborators.

Typical editor permissions:

- View assigned or owned projects depending on MVP rules
- Edit content metadata
- Preview generated outputs
- Assist creators with content review

For MVP, it is acceptable to store the `editor` role but treat it similarly to `creator` until collaboration/assignment features are built.

## API Route Style

Use RESTful routes for non-auth application routes.

Better Auth should own the auth routes under:

```txt
/api/auth/*
```

Recommended custom Express routes:

```txt
GET    /api/health

GET    /api/me

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
POST   /api/jobs/:id/cancel

GET    /api/projects/:id/generated-videos
GET    /api/generated-videos/:id

GET    /api/notifications
GET    /api/notifications/unread-count
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
```

Do not manually implement these custom auth routes unless specifically requested:

```txt
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

Better Auth should provide the correct auth endpoints.

## FastAPI AI Service Route Style

The FastAPI AI Service should use simple internal API routes.

Initial routes:

```txt
GET  /health
POST /process-video
```

Future routes may include:

```txt
POST /transcribe
POST /detect-highlights
POST /generate-summary
POST /generate-reels
```

These FastAPI routes are internal service routes and should not be exposed directly to end users.

The frontend should call the Express API Gateway, not the FastAPI AI Service directly.

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

Allowed MIME types:

- `video/mp4`
- `video/quicktime`
- `video/x-matroska`
- `video/webm`

Default maximum video duration:

- 2 hours

Default maximum upload size:

```txt
2048 MB
```

Default output formats:

- `.mp4`
- `.srt`
- `.vtt`
- `.json`

Upload field name must be:

```txt
video
```

Do not use the original filename directly as the stored filename. Use a safe generated filename.

Recommended filename format:

```txt
projectId-timestamp-random.ext
```

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

## Recommended Highlight Algorithm

Use a hybrid multimodal approach later.

For MVP, start with transcript-based scoring first.

Initial highlight scoring signals:

- Strong hook phrases
- Questions
- Numbered tips
- Important statements
- Summary/conclusion phrases
- High information density
- Emotional or opinionated language

Later scoring signals:

- Transcript semantic importance
- Audio energy
- Speaker emotion
- Scene changes
- Visual activity
- Face/person presence
- Topic importance
- Platform-specific engagement signals

For summary selection, prefer:

```txt
Importance + Coverage + Diversity + Coherence
```

For reels, prefer:

```txt
Hook strength + Standalone clarity + Emotional impact + Shareability
```

## LLM Strategy

An LLM may be used later, but it should not be required for the MVP.

For MVP, prefer:

```txt
Whisper/faster-whisper → transcript
FFmpeg → clip cutting/rendering
rule-based scoring → highlight detection
basic selection algorithm → summary/reels
```

Use an LLM later for:

- Transcript summarization
- Topic extraction
- Highlight ranking
- Summary planning
- Reel title generation
- Hook generation
- Caption copy improvement
- Social post descriptions
- Explaining why a segment was selected

The LLM should live inside the FastAPI AI Service, not the Express API Gateway.

Do not add LLM provider integration until the basic rule-based pipeline works.

## Build Order

Build the backend in this order:

1. Express.js API Gateway foundation
2. Better Auth setup
3. Prisma and Neon Serverless Postgres setup
4. User session verification and protected routes
5. Arcjet API protection
6. Project CRUD
7. Video upload
8. Processing job system with mock processing
9. FastAPI AI Service foundation
10. Express-to-FastAPI communication
11. Replace Express mock processing with FastAPI mock processing
12. Notifications
13. Real FFmpeg audio extraction
14. Whisper transcription
15. Transcript segmentation
16. Basic highlight scoring
17. Summary clip generation
18. Reel clip generation
19. Captions
20. Vertical formatting
21. Optional LLM enhancement
22. Templates, publishing, analytics, and admin tools

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
- Add `ProcessingJob` model.
- Add `GeneratedVideo` placeholder model.
- Add routes for starting, viewing, listing, and cancelling jobs.
- Do not implement real FFmpeg or Whisper.
- Do not add FastAPI yet.

### Phase 7 — FastAPI AI Service Foundation

For Phase 7:

- Create the FastAPI AI service under `services/ai-service`.
- Build only the service foundation.
- Include a health check endpoint.
- Include a mock video-processing endpoint.
- Do not connect Express to FastAPI yet.
- Do not add real FFmpeg.
- Do not add Whisper.
- Do not add real AI/video processing yet.

Required structure:

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
    │   │   └── processing.py
    │   └── dependencies.py
    ├── core/
    │   ├── config.py
    │   └── logging.py
    ├── schemas/
    │   └── processing_schema.py
    ├── services/
    │   └── processing_service.py
    └── utils/
        └── exceptions.py
```

Required FastAPI routes:

```txt
GET  /health
POST /process-video
```

The `/process-video` route should accept mock processing input and return mock output metadata.

Example mock response:

```json
{
  "success": true,
  "message": "Mock video processing completed",
  "data": {
    "summaryVideo": {
      "type": "summary",
      "title": "Generated Summary Video",
      "outputUrl": "processed/mock-summary.mp4",
      "durationSeconds": 480,
      "aspectRatio": "16:9"
    },
    "reels": [
      {
        "type": "reel",
        "title": "Generated Reel 1",
        "outputUrl": "processed/mock-reel-1.mp4",
        "durationSeconds": 45,
        "aspectRatio": "9:16"
      }
    ]
  }
}
```

### Phase 8 — Express-to-FastAPI Communication

For Phase 8:

- Add internal communication from Express API Gateway to FastAPI AI Service.
- Create an AI client service inside Express.
- Add environment variable for FastAPI base URL.
- Do not replace the mock processing workflow yet unless requested.
- Do not add real FFmpeg or Whisper.

In Express, create or update:

```txt
services/api-gateway/src/services/ai-client.service.ts
```

Recommended environment variable:

```txt
AI_SERVICE_URL=http://localhost:8000
```

The AI client should be responsible for calling:

```txt
POST /process-video
```

The Express service should not contain AI/video-processing logic.

### Phase 9 — Replace Express Mock Processing with FastAPI Mock Processing

For Phase 9:

- Replace the local Express mock processing simulation with a FastAPI mock processing call.
- When the user starts processing:
  - Express creates a `ProcessingJob`.
  - Express updates the project status to `queued`.
  - Express calls the FastAPI mock processing endpoint.
  - Express saves returned mock generated video metadata.
  - Express updates the job status and project status.

- Keep this mock-based.
- Do not add real FFmpeg yet.
- Do not add Whisper yet.

Expected flow:

```txt
POST /api/projects/:id/process
→ Express validates project ownership
→ Express creates ProcessingJob
→ Express calls FastAPI /process-video
→ FastAPI returns mock summary/reels
→ Express saves GeneratedVideo records
→ Express marks job/project completed
```

### Phase 10 — Notifications

For Phase 10:

- Add notification support to the Express API Gateway.
- Add a `Notification` Prisma model.
- Add notification service, controller, routes, and validators.
- Add notification creation helpers.
- Create notifications when:
  - a video is uploaded
  - a processing job starts
  - a processing job completes
  - a processing job fails
  - generated videos are ready

- Add unread count endpoint.
- Add mark-as-read endpoint.
- Add mark-all-as-read endpoint.
- Keep notifications REST-based first.
- Do not add WebSockets yet unless explicitly requested.
- Do not add email notifications yet unless explicitly requested.
- Do not add push notifications yet unless explicitly requested.

Expected MVP notification flow:

```txt
Processing job completed
→ Express saves GeneratedVideo records
→ Express creates Notification record
→ Frontend calls GET /api/notifications
→ Frontend displays "Your summary and reels are ready"
```

### Phase 11 — FFmpeg Audio Extraction

For Phase 11:

- Add real FFmpeg support inside the FastAPI AI Service.
- Extract audio from uploaded video files.
- Do not add Whisper transcription yet.
- Keep output as an extracted `.wav` or `.mp3` file.
- Isolate FFmpeg commands in utility functions.

Add or update:

```txt
services/ai-service/app/utils/ffmpeg_utils.py
services/ai-service/app/services/audio_service.py
```

Required behavior:

```txt
input video → extracted audio file
```

### Phase 12 — Whisper Transcription

For Phase 12:

- Add faster-whisper or Whisper transcription inside the FastAPI AI Service.
- Use extracted audio from Phase 11.
- Generate timestamped transcript output.
- Save transcript as JSON.
- Do not generate highlights yet.

Add or update:

```txt
services/ai-service/app/services/transcription_service.py
services/ai-service/app/schemas/transcript_schema.py
```

Required output:

```txt
transcript.json
```

Each transcript segment should include:

```txt
start
end
text
confidence if available
```

### Phase 13 — Transcript Segmentation

For Phase 13:

- Convert timestamped transcript into logical segments.
- Start with simple fixed-window or sentence-based segmentation.
- Segment size should usually be 30–60 seconds.
- Do not add advanced ML highlight detection yet.

Add or update:

```txt
services/ai-service/app/algorithms/segmenter.py
```

Each segment should include:

```txt
startTime
endTime
text
wordCount
```

### Phase 14 — Basic Highlight Scoring

For Phase 14:

- Add a simple rule-based highlight scoring algorithm.
- Use transcript signals first.
- Do not add complex ML models yet.

Add or update:

```txt
services/ai-service/app/algorithms/highlight_scoring.py
```

Score based on:

- Strong hook phrases
- Questions
- Numbered tips
- Important statements
- Summary/conclusion phrases
- High information density
- Emotional or opinionated language

Each highlight candidate should include:

```txt
startTime
endTime
score
reason
text
```

### Phase 15 — Summary Clip Generation

For Phase 15:

- Generate a 7–10 minute summary video using selected highlight segments.
- Use FFmpeg to cut and concatenate clips.
- Prefer coherence and coverage over only highest score.
- Do not add advanced captions yet.
- Do not add vertical reels yet.

Required behavior:

```txt
original video + selected segments → summary.mp4
```

### Phase 16 — Reel Clip Generation

For Phase 16:

- Generate multiple short reel clips from top highlight candidates.
- Clips should be self-contained.
- Recommended duration: 20–60 seconds.
- Use FFmpeg to cut clips.
- Do not add smart vertical reframing yet.
- Center crop is acceptable initially.

Required behavior:

```txt
original video + highlight timestamps → reel-1.mp4, reel-2.mp4, reel-3.mp4
```

### Phase 17 — Captions

For Phase 17:

- Generate captions from transcript timestamps.
- Export captions as `.srt` and/or `.vtt`.
- Optionally burn captions into generated videos using FFmpeg.
- Keep caption styling simple first.

Required outputs:

```txt
summary.srt
reel-1.srt
reel-2.srt
```

### Phase 18 — Vertical Formatting

For Phase 18:

- Format reels for vertical 9:16 output.
- Start with center crop.
- Later improve with face/person tracking.
- Use FFmpeg for crop and scale.

Required output:

```txt
vertical reel mp4 files, 9:16 aspect ratio
```

### Phase 19 — Optional LLM Enhancement

For Phase 19:

- Add optional LLM support inside the FastAPI AI Service.
- Use the LLM only after the basic rule-based pipeline works.
- Use the LLM for:
  - topic extraction
  - summary planning
  - highlight reranking
  - reel title generation
  - hook generation
  - social caption generation

- Do not make the LLM required for the whole pipeline unless explicitly requested.
- Keep provider keys in environment variables.
- Do not hard-code LLM prompts or secrets in controllers.

### Phase 20 — Templates, Publishing, Analytics, and Admin Tools

For Phase 20:

- Add branding templates.
- Add caption styles.
- Add publish scheduling.
- Add analytics.
- Add admin controls.
- Only build these after the core processing pipeline works end-to-end.

## Testing Rules

When adding backend features:

- Add at least basic tests where practical.
- Test success cases.
- Test validation errors.
- Test authorization errors.
- Test rate-limit errors where Arcjet is applied.
- Test not-found cases.

For Express:

- Use Jest or Vitest with Supertest.

For FastAPI:

- Use pytest and FastAPI TestClient.

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
- Add social media publishing before the core pipeline works
- Add complex AI models before the MVP rule-based pipeline works
- Add Kubernetes
- Add cloud deployment config
- Add unnecessary abstractions
- Rewrite working code without reason
- Change the product name from RepurposePro
- Replace Better Auth with custom JWT authentication unless explicitly requested
- Remove Arcjet once it is added unless explicitly requested
- Store video files directly in PostgreSQL
- Expose the FastAPI AI Service directly to frontend users
