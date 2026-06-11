# Project Name

RepurposePro

## Project Description

RepurposePro is an AI-powered video repurposing platform that transforms long-form videos into:

- A 7–10 minute short-form summary video
- Multiple vertical highlight reels optimized for TikTok, Instagram Reels, and YouTube Shorts

The backend uses a hybrid architecture:

- Express.js + TypeScript for the main application backend/API Gateway
- FastAPI + Python for AI and video processing
- Neon Serverless Postgres for persistent data
- Prisma ORM for database access
- Better Auth for authentication and session management
- Arcjet for API protection, bot protection, and rate limiting
- Redis/BullMQ for background job queues later
- S3-compatible storage for video assets later

The backend should be built phase by phase.

Do not build multiple phases at once.

Do not jump ahead to later phases unless explicitly requested.

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
- Communication with the FastAPI AI Service
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

The frontend should call the Express API Gateway only.

The FastAPI AI Service is an internal backend service and should not be exposed directly to end users.

Allowed flow:

```txt
Frontend → Express API Gateway → FastAPI AI Service
```

Disallowed flow:

```txt
Frontend → FastAPI AI Service
```

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
- Axios or native fetch for internal API calls

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

Do not add all AI tools at once.

Add them only when the matching phase requires them.

## Backend Quality Rules

RepurposePro backend should feel like a real production backend, not an AI-generated demo project.

Every backend feature must be:

- Secure by default
- Typed where practical
- Validated at the API boundary
- Protected by authentication when user-specific
- Protected by ownership checks when project-specific
- Consistent with the existing architecture
- Small enough to review
- Easy to test
- Free from fake, unused, or decorative logic

Do not create backend code just to make the project look bigger.

Do not add unused services, unused abstractions, fake analytics, fake AI scores, fake admin data, mock records, or placeholder business logic unless the current phase explicitly requires mock behavior.

Mock behavior is only acceptable when the phase explicitly says it is mock-based.

## Backend Anti-AI-Slop Rules

Do not generate:

```txt
Fake metrics
Fake analytics
Fake AI quality scores
Fake engagement predictions
Fake user activity
Fake admin stats
Unused routes
Unused services
Unused database models
Unused middleware
Overly generic helper functions
Over-engineered abstractions
Placeholder business logic
Decorative comments
Console logs everywhere
Hard-coded sample users
Hard-coded sample projects
Hard-coded generated videos
```

Every backend file must have a clear purpose.

Before adding any file, route, service, model, or helper, ask:

```txt
Does this directly support authentication, project management, video upload, processing, generated outputs, notifications, or security?
```

If not, do not add it.

## Secure-by-Default Backend Rules

Security is not optional.

For every protected feature, enforce:

```txt
Authentication
Authorization
Ownership checks
Input validation
Rate limiting where appropriate
Safe error handling
Safe logging
Environment-based secrets
```

Never trust:

```txt
Request body
Request params
Request query
Uploaded filenames
Uploaded MIME types alone
Client-provided user IDs
Client-provided role values
Client-provided project ownership
Client-provided file paths
Client-provided output URLs
```

The backend must verify everything server-side.

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

## Database Safety Rules

Use Prisma for database access.

Do not use raw SQL unless necessary.

If raw SQL is required:

- Explain why.
- Use parameterized queries.
- Never interpolate user input directly.

Use transactions when multiple related writes must succeed together.

Examples:

```txt
Create processing job + update project status
Save generated videos + update job status + update project status
Delete project + related cleanup metadata
```

Avoid orphaned records.

Use indexes for frequently queried fields.

Use cascade deletes carefully and intentionally.

Do not store video files directly in PostgreSQL.

Store file metadata and safe paths/URLs only.

## Prisma Model Rules

Do not add models before they are needed by a phase.

Do not add fields “just in case.”

When adding a model:

- Add clear relations.
- Add useful indexes.
- Add enums for controlled statuses/types.
- Update Prisma Client.
- Update `.env.example` if needed.
- Document migration commands.

Do not break Better Auth models.

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
- Future plugins such as organizations, teams, 2FA, social login, passkeys, or email verification

The API Gateway should use session-based authentication through Better Auth.

Do not manually create custom JWT authentication unless explicitly requested.

Email verification is not required for the MVP unless explicitly added later.

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

## Authentication and Session Security Rules

Use Better Auth for authentication and sessions.

Do not build custom JWT authentication unless explicitly requested.

Rules:

- Do not store passwords manually.
- Do not log passwords.
- Do not log cookies.
- Do not log session IDs.
- Do not log auth headers.
- Do not expose session secrets.
- Do not expose Better Auth secrets.
- Do not manually trust a user ID sent from the frontend.
- Always derive the authenticated user from the verified session.
- All user-specific routes must require authentication.
- Dashboard, project, upload, job, generated-video, and notification routes must be protected.

If a route uses `req.user`, `req.session`, or similar authenticated context, make sure the auth middleware populated it safely.

## Authorization and Ownership Rules

Most creator routes must enforce ownership.

Normal users may only access their own:

```txt
Projects
Uploads
Processing jobs
Generated videos
Notifications
```

Admin users may access broader records only when the route is explicitly designed as an admin route.

Do not silently allow admin bypasses in normal user routes unless the phase requires it.

Ownership must be checked in the service layer, not only in the controller.

For project-owned resources, verify ownership through the project relation.

Example:

```txt
GeneratedVideo → Project → userId
ProcessingJob → Project → userId
Notification → userId
```

Do not trust IDs alone.

## User Role Guidance

Use one `User` table with a `role` field.

The roles are:

```txt
admin
creator
editor
```

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

## Arcjet and Rate Limit Rules

Use Arcjet for API protection in the Express API Gateway.

Apply strict protection to:

```txt
/api/auth/*
/api/projects/:id/upload
/api/projects/:id/process
/api/jobs/*
```

Recommended protections:

```txt
Auth routes: strict login/signup abuse prevention
Upload routes: low hourly limit
Processing routes: low hourly limit
General API routes: reasonable per-minute limit
```

When rate-limited, return a clear `429 Too Many Requests` response.

Do not remove Arcjet protection once added unless explicitly requested.

Do not bypass Arcjet for expensive routes.

## CORS and Cookie Rules

Use strict CORS configuration.

For local development, allow the frontend origin:

```txt
http://localhost:3000
```

Use credentials carefully with cookie-based sessions.

Do not use wildcard `*` CORS with credentials.

Production CORS must use explicit allowed origins.

Do not expose cookies to untrusted origins.

Use HTTPS in production.

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

## Notification Events

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

## Notification Database Model

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

  @@index([userId])
  @@index([read])
  @@index([createdAt])
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

## Notification API Routes

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

## Notification Safety Rules

Notifications are backend-owned.

Express creates notification records.

FastAPI must not create notifications directly.

Notification failures should not crash upload or processing workflows.

Notification metadata should contain useful IDs, such as:

```txt
projectId
jobId
generatedVideoId
```

Do not store secrets or sensitive data in notification metadata.

Users can only read or update their own notifications unless an explicit admin route exists.

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

## Input Validation Rules

Use Zod validation for Express request input.

Validate:

```txt
Request body
Route params
Query params
Uploaded file metadata
Pagination input
Filter input
Enum values
```

Reject invalid input early.

Do not pass raw request data directly into Prisma or service logic.

Do not rely only on TypeScript types for runtime validation.

Validation errors should return clear, safe messages.

## API Response Rules

Use consistent API responses for custom routes.

Success response:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

Do not leak stack traces in production.

Do not leak database internals.

Do not leak Prisma error details to end users.

Do not expose filesystem paths unless they are safe public paths.

Better Auth routes may use Better Auth’s own response format.

## Error Handling Rules

Use centralized error handling.

Do not scatter raw `try/catch` responses everywhere.

Services may throw clean application errors.

Controllers should stay thin.

Errors should be:

```txt
Readable
Safe
Actionable
Consistent
```

Avoid:

```txt
throw new Error("failed")
throw new Error(JSON.stringify(error))
res.status(500).send(error)
console.log(error)
```

If logging internal errors, sanitize sensitive values first.

## Logging Rules

Logs should help debugging without leaking secrets.

Do not log:

```txt
Passwords
Cookies
Session IDs
Auth tokens
API keys
Arcjet keys
Database URLs
Email provider keys
Full request bodies containing sensitive data
Raw uploaded file contents
```

Allowed logs:

```txt
Request method and path
Job ID
Project ID
User ID when needed for debugging
Sanitized error message
Processing step
Timing information
```

Use structured logging when practical.

Remove noisy debug logs before completing a phase.

## Environment Variable Rules

All secrets and environment-specific values must come from environment variables.

Do not hard-code:

```txt
Database URLs
Auth secrets
Arcjet keys
API keys
Email provider credentials
Storage credentials
Internal service URLs
Upload limits
CORS origins
```

Always update `.env.example` when adding a new environment variable.

`.env` files must never be committed.

Recommended pattern:

```txt
Read env variables in config files.
Validate required env variables on startup.
Use safe defaults only for local development.
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

Do not invent new status strings unless the schema is intentionally updated.

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

```txt
.mp4
.mov
.mkv
.webm
```

Allowed MIME types:

```txt
video/mp4
video/quicktime
video/x-matroska
video/webm
```

Default maximum video duration:

```txt
2 hours
```

Default maximum upload size:

```txt
2048 MB
```

Default output formats:

```txt
.mp4
.srt
.vtt
.json
```

Upload field name must be:

```txt
video
```

Do not use the original filename directly as the stored filename. Use a safe generated filename.

Recommended filename format:

```txt
projectId-timestamp-random.ext
```

## Upload Security Rules

Uploads are high-risk and must be handled carefully.

Rules:

- Use `multer` or the approved upload middleware.
- Upload field name must be `video`.
- Validate file extension.
- Validate MIME type.
- Enforce maximum upload size.
- Generate safe filenames.
- Never trust the original filename.
- Prevent path traversal.
- Store files only in the configured upload directory.
- Clean up uploaded files if the request fails after upload.
- Do not execute uploaded files.
- Do not expose local filesystem paths directly to users.

## File Path and Storage Safety Rules

All file paths must be normalized and controlled.

Do not allow the frontend to decide storage paths.

Do not allow `../` path traversal.

Do not allow absolute user-provided paths.

Do not expose internal local paths as public URLs unless intentionally mapped.

Use storage service helpers when practical.

Later S3/R2/MinIO support should use signed URLs where appropriate.

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

## FastAPI Internal Service Security Rules

The frontend must never call FastAPI directly.

Express should validate user permissions before calling FastAPI.

FastAPI should treat requests as internal but still validate payloads.

FastAPI should not own business database records during MVP.

Express owns:

```txt
Users
Projects
Processing jobs
Generated videos
Notifications
```

FastAPI returns processing results.

Express decides what to save.

## AI and Video Processing Safety Rules

Do not add real AI/video processing before the assigned phase.

Do not add LLM provider integration until the optional LLM phase.

Do not add FFmpeg, Whisper, OpenCV, PySceneDetect, or ML libraries before their phases.

When FFmpeg is added:

- Isolate commands in utility functions.
- Never concatenate unsanitized user input into shell commands.
- Prefer argument arrays over shell strings.
- Validate input and output paths.
- Restrict processing to allowed directories.
- Handle timeouts and failures.
- Log only sanitized command context.
- Do not expose raw FFmpeg errors directly to users.

When Whisper/transcription is added:

- Store transcript outputs safely.
- Do not assume transcript text is safe HTML.
- Escape transcript/caption text before rendering in frontend later.
- Treat transcript content as user-generated content.

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

## LLM Safety Rules

LLM integration is optional and later.

Do not make the LLM required for the MVP.

If LLM support is added later:

- Keep provider keys in environment variables.
- Do not hard-code prompts in controllers.
- Do not send secrets to the LLM.
- Do not send unnecessary user data to the LLM.
- Treat LLM output as untrusted.
- Validate and sanitize LLM output.
- Do not let LLM output directly control file paths, shell commands, SQL queries, or authorization decisions.
- Do not claim outputs are guaranteed to go viral.

LLM must not decide security-sensitive behavior.

## Background Job Safety Rules

For MVP, mock async processing may use fire-and-forget functions only when the phase allows it.

All async background functions must:

- Catch errors.
- Log sanitized failures.
- Update job status on failure.
- Avoid unhandled promise rejections.
- Avoid leaving jobs stuck in `processing`.

Before starting a new processing job, check for an active job:

```txt
queued
processing
```

If active job exists, return a clean error:

```txt
Project already has an active processing job
```

Later, replace fire-and-forget processing with Redis/BullMQ or another real queue.

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

Required FastAPI routes:

```txt
GET  /health
POST /process-video
```

### Phase 8 — Express-to-FastAPI Communication

For Phase 8:

- Add internal communication from Express API Gateway to FastAPI AI Service.
- Create an AI client service inside Express.
- Add environment variable for FastAPI base URL.
- Do not replace the mock processing workflow yet unless requested.
- Do not add real FFmpeg or Whisper.

Recommended environment variable:

```txt
AI_SERVICE_URL=http://localhost:8000
```

### Phase 9 — Replace Express Mock Processing with FastAPI Mock Processing

For Phase 9:

- Replace the local Express mock processing simulation with a FastAPI mock processing call.
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

For Phase 10.5:

- Security and Quality Audit

### Phase 11 — FFmpeg Audio Extraction

For Phase 11:

- Add real FFmpeg support inside the FastAPI AI Service.
- Extract audio from uploaded video files.
- Do not add Whisper transcription yet.
- Keep output as an extracted `.wav` or `.mp3` file.
- Isolate FFmpeg commands in utility functions.

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

```txt
Use Jest or Vitest with Supertest.
```

For FastAPI:

```txt
Use pytest and FastAPI TestClient.
```

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

## Secure Development Checklist

Before completing any backend phase, verify:

```txt
No secrets are hard-coded.
.env.example is updated.
All new routes are protected when needed.
Ownership checks are enforced.
Inputs are validated with Zod or Pydantic.
Prisma queries do not trust client ownership claims.
Upload paths are safe.
Errors are handled centrally.
Logs do not expose secrets.
Arcjet is applied to sensitive routes where available.
Build passes.
Tests are added where practical.
No fake or unused backend features were added.
```

## Backend Anti-Slop Checklist

Before completing any backend phase, verify:

```txt
No unused files were added.
No unused routes were added.
No fake analytics were added.
No fake AI scores were added.
No placeholder admin data was added.
No sample users/projects/videos were hard-coded.
No random helper abstractions were added.
No business logic was placed in controllers.
No route bypasses auth accidentally.
No user can access another user’s data.
No internal FastAPI route is exposed to frontend users.
```

## Do Not Do Unless Asked

Do not:

- Build multiple phases at once
- Add fake metrics or fake analytics
- Add fake AI scoring
- Add unused database models
- Add unused services or routes
- Add unnecessary abstractions
- Add custom JWT authentication
- Store auth tokens in localStorage
- Hard-code secrets or credentials
- Commit `.env` files
- Log passwords, cookies, sessions, tokens, or API keys
- Trust client-provided user IDs or roles
- Skip ownership checks
- Skip input validation
- Expose FastAPI directly to frontend users
- Store video files directly in PostgreSQL
- Run shell commands with unsanitized input
- Add FFmpeg before its phase
- Add Whisper before its phase
- Add LLM integration before its phase
- Add payment features before core workflow works
- Add social media publishing before core workflow works
- Add admin tools before core workflow works
- Change the product name from RepurposePro
