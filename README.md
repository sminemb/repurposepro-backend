# RepurposePro Backend

RepurposePro is an AI-powered video repurposing platform designed to turn
long-form videos into summary videos and short vertical reels.

This repository contains the Express.js API Gateway and the internal FastAPI AI
service. The API Gateway owns authentication, business data, uploads, processing
jobs, generated-video metadata, and notifications. The AI service currently
returns validated mock processing results; real transcription, video analysis,
and rendering are not implemented yet.

## Current Features

- Express.js 5 API Gateway written in TypeScript
- Better Auth email/password authentication and cookie-based sessions
- Prisma ORM with Neon Serverless Postgres
- Arcjet bot protection, shield rules, and route-level rate limiting
- Authenticated project CRUD with service-layer ownership enforcement
- Secure local video uploads for `.mp4`, `.mov`, `.mkv`, and `.webm` files
- FastAPI-backed mock asynchronous processing jobs with progress tracking
- Generated summary and reel metadata persisted by the API Gateway
- User-owned REST notifications for upload and processing events
- Optional internal API-key protection between Express and FastAPI, required in production
- Zod and Pydantic request validation
- Vitest, Supertest, and pytest test suites

## Architecture

```txt
Frontend
   |
   v
Express API Gateway (:5000)
   |-- Better Auth
   |-- Arcjet
   |-- Prisma --> PostgreSQL
   |-- Local upload storage
   |
   v
Internal FastAPI AI Service (:8000)
```

Frontend applications must communicate only with the API Gateway. The FastAPI
AI service is internal and should not be exposed directly to end users.

```txt
repurposepro-backend/
|-- AGENTS.md
|-- README.md
`-- services/
    |-- api-gateway/
    |   |-- prisma/
    |   |-- src/
    |   |-- storage/uploads/
    |   |-- .env.example
    |   |-- Dockerfile
    |   `-- package.json
    `-- ai-service/
        |-- app/
        |-- .env.example
        |-- Dockerfile
        `-- requirements.txt
```

## Prerequisites

- Node.js 22 or later
- npm
- Python 3.11 or later
- A Neon Postgres database, or another PostgreSQL database for local
  development
- An Arcjet key if API protection should be enabled locally

## Local Setup

### API Gateway

Run these commands from `services/api-gateway`:

```powershell
npm install
Copy-Item .env.example .env
```

Configure `.env`, then generate the Prisma client and apply migrations:

```powershell
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

The API Gateway runs at `http://localhost:5000` by default.

### AI Service

In another terminal, run these commands from `services/ai-service`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn app.main:app --reload --port 8000
```

The AI service runs at `http://localhost:8000` by default.

Set the same `AI_SERVICE_API_KEY` in both services when internal service
authentication is enabled. The key is optional in development and must be at
least 32 characters in production.

Check both services:

```powershell
curl.exe http://localhost:5000/api/health
curl.exe http://localhost:8000/health
```

When `AI_SERVICE_API_KEY` is configured, include it when calling FastAPI
directly:

```powershell
curl.exe -H "X-Internal-API-Key: your-key" http://localhost:8000/health
```

## Environment Variables

### API Gateway

Configure `services/api-gateway/.env`:

```dotenv
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

DATABASE_URL=
DIRECT_URL=

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5000

ARCJET_KEY=
ARCJET_ENV=development

UPLOAD_DIR=storage/uploads
MAX_UPLOAD_SIZE_MB=2048

AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_KEY=
AI_SERVICE_TIMEOUT_MS=30000
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL connection used by the application |
| `DIRECT_URL` | Direct PostgreSQL connection used by Prisma migrations |
| `BETTER_AUTH_SECRET` | Better Auth secret; must be at least 32 characters in production |
| `BETTER_AUTH_URL` | Public base URL of the API Gateway |
| `CORS_ORIGIN` | Single explicit frontend origin allowed to send credentials |
| `ARCJET_KEY` | Optional in development; required in production |
| `ARCJET_ENV` | Arcjet mode: `development` or `production` |
| `UPLOAD_DIR` | Local upload directory within the API Gateway service |
| `MAX_UPLOAD_SIZE_MB` | Maximum accepted video upload size in megabytes |
| `AI_SERVICE_URL` | Internal FastAPI AI service base URL |
| `AI_SERVICE_API_KEY` | Shared key sent to the internal AI service |
| `AI_SERVICE_TIMEOUT_MS` | Timeout for internal AI service requests |

### AI Service

Configure `services/ai-service/.env`:

```dotenv
APP_NAME=RepurposePro AI Service
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
API_PREFIX=
AI_SERVICE_API_KEY=
```

Do not commit `.env` files or credentials.

## API Routes

Better Auth owns all authentication routes under `/api/auth/*`. Application
routes use cookie-based sessions and return a consistent success or error
response shape.

| Method | Route | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | API Gateway health check |
| `GET` | `/api/me` | Required | Get the authenticated user |
| `GET` | `/api/internal/ai/health` | Required | Check the internal AI service through Express |
| `POST` | `/api/projects` | Required | Create a project |
| `GET` | `/api/projects` | Required | List the user's projects |
| `GET` | `/api/projects/:id` | Required | Get an owned project |
| `PATCH` | `/api/projects/:id` | Required | Update an owned project |
| `DELETE` | `/api/projects/:id` | Required | Delete an owned project |
| `POST` | `/api/projects/:id/upload` | Required | Upload a project video |
| `POST` | `/api/projects/:id/process` | Required | Start a mock processing job |
| `GET` | `/api/jobs/:id` | Required | Get an owned processing job |
| `GET` | `/api/projects/:id/jobs` | Required | List an owned project's jobs |
| `POST` | `/api/jobs/:id/cancel` | Required | Cancel a queued or processing job |
| `GET` | `/api/notifications` | Required | List the user's notifications |
| `GET` | `/api/notifications/unread-count` | Required | Get the unread count |
| `PATCH` | `/api/notifications/:id/read` | Required | Mark an owned notification as read |
| `PATCH` | `/api/notifications/read-all` | Required | Mark all owned notifications as read |

The jobs list route accepts an optional `status` query parameter:

```txt
GET /api/projects/:id/jobs?status=processing
```

The notifications list route accepts `read`, `type`, `page`, and `limit`
filters. `limit` defaults to `20` and cannot exceed `100`.

```txt
GET /api/notifications?read=false&type=processing_completed&page=1&limit=20
```

The internal FastAPI service exposes:

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | AI service health check |
| `POST` | `/process-video` | Return validated mock processing outputs |

Both FastAPI routes require the `X-Internal-API-Key` header when
`AI_SERVICE_API_KEY` is configured.

## Response Format

Non-auth API Gateway success responses use this shape:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Error responses use this shape:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

Better Auth routes use Better Auth's response format.

## Video Uploads

Upload one video using `multipart/form-data` with the field name `video`.
Supported formats are:

- `.mp4` (`video/mp4`)
- `.mov` (`video/quicktime`)
- `.mkv` (`video/x-matroska`)
- `.webm` (`video/webm`)

Files are stored locally under `services/api-gateway/storage/uploads` by
default. The upload middleware validates both extension and MIME type, enforces
the configured size limit, and generates a safe stored filename.

## Mock Processing

Starting processing creates a queued database-backed job and launches a
temporary in-process background runner. Express calls FastAPI's mock
`POST /process-video` endpoint, validates its response, replaces the project's
old generated-video metadata, updates project and job statuses, and creates
notifications for processing events.

The returned output paths are metadata only; the mock service does not create
video files. Cancellation updates the database job but does not abort an
in-flight FastAPI request. The runner checks job status before saving results.

This implementation does not run FFmpeg, transcribe audio, analyze scenes, or
generate real outputs. A later phase will replace the in-process runner with a
durable queue and real processing pipeline.

## Notifications

Notifications are created by the API Gateway and stored in PostgreSQL. Current
events are:

- `video_uploaded`
- `processing_started`
- `processing_completed`
- `processing_failed`
- `generated_video_ready`

Notification creation is best-effort: a notification failure is logged but
does not fail the upload or processing workflow. Users can only list or update
their own notifications.

## Commands

Run API Gateway commands from `services/api-gateway`:

```powershell
npm run dev             # Start the development server with watch mode
npm run build           # Compile TypeScript
npm start               # Run the compiled server
npm run lint            # Run ESLint
npm test                # Run all API Gateway tests
npm run prisma:generate # Generate the Prisma client
npm run prisma:migrate  # Apply development migrations
npm run prisma:studio   # Open Prisma Studio
```

Run AI service commands from `services/ai-service`:

```powershell
uvicorn app.main:app --reload --port 8000
python -m pytest
```

## Verification

Before submitting backend changes, run:

```powershell
cd services/api-gateway
npm run build
npm run lint
npm test

cd ../ai-service
python -m pytest
```

## Not Yet Implemented

- Durable Redis/BullMQ processing workers
- Real FFmpeg audio and video processing
- Speech-to-text transcription
- Scene detection and highlight scoring
- Summary and reel rendering
- Captions and vertical reframing
- Generated-video retrieval routes
- Object storage and signed asset URLs
- Real-time notifications
