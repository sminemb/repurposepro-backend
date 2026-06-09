# RepurposePro Backend

RepurposePro is an AI-powered video repurposing platform designed to turn
long-form videos into summary videos and short vertical reels.

This repository currently contains the Express.js API Gateway and internal
FastAPI AI service through Phase 9 of the backend roadmap. Express coordinates
mock asynchronous processing through FastAPI and owns all business data. Real
AI and video processing are not implemented yet.

## Current Features

- Express.js 5 API Gateway written in TypeScript
- Better Auth email/password authentication and session management
- Prisma ORM with Neon Serverless Postgres
- Arcjet bot protection, shield rules, and route-level rate limiting
- Authenticated project CRUD with ownership enforcement
- Local video uploads for `.mp4`, `.mov`, `.mkv`, and `.webm` files
- FastAPI-backed mock asynchronous video-processing jobs with progress tracking
- Generated summary and reel metadata persisted by the API Gateway
- Consistent validation, error handling, and API responses
- Vitest and Supertest integration tests

## Repository Structure

```txt
repurposepro-backend/
├── AGENTS.md
├── README.md
└── services/
    ├── api-gateway/
        ├── prisma/
        ├── src/
        ├── storage/uploads/
        ├── .env.example
        ├── Dockerfile
        └── package.json
    └── ai-service/
        ├── app/
        ├── .env.example
        ├── Dockerfile
        └── requirements.txt
```

Frontend applications should communicate only with the API Gateway. The
FastAPI AI service is internal and runs at `http://localhost:8000` by default.

## Prerequisites

- Node.js 22 or later
- npm
- Python 3.11 or later
- A Neon Postgres database, or another PostgreSQL database for local
  development
- An Arcjet key if API protection should be enabled locally

## Local Setup

1. Install the API Gateway dependencies:

   ```bash
   cd services/api-gateway
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Configure the required values in `.env`.

4. Generate the Prisma client and apply migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. In another terminal, install and start the internal AI service:

   ```bash
   cd services/ai-service
   python -m venv .venv
   .venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   ```

The API Gateway runs at `http://localhost:5000` and the internal AI service
runs at `http://localhost:8000` by default. Check them with:

```bash
curl http://localhost:5000/api/health
curl http://localhost:8000/health
```

## Environment Variables

Configure these values in `services/api-gateway/.env`:

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
AI_SERVICE_TIMEOUT_MS=30000
```

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Pooled PostgreSQL connection used by the application |
| `DIRECT_URL` | Direct PostgreSQL connection used by Prisma migrations |
| `BETTER_AUTH_SECRET` | Secret used by Better Auth; use a strong random value |
| `BETTER_AUTH_URL` | Public base URL of the API Gateway |
| `CORS_ORIGIN` | Allowed credentialed frontend origin |
| `ARCJET_KEY` | Optional in development; required in production |
| `ARCJET_ENV` | Arcjet mode: `development` or `production` |
| `UPLOAD_DIR` | Local upload directory, relative to the API Gateway |
| `MAX_UPLOAD_SIZE_MB` | Maximum accepted video upload size in megabytes |
| `AI_SERVICE_URL` | Internal FastAPI AI service base URL |
| `AI_SERVICE_TIMEOUT_MS` | Timeout for internal AI service requests |

Do not commit `.env` files or credentials.

## API Routes

Better Auth owns all authentication routes under `/api/auth/*`. Application
routes use cookie-based sessions and return a consistent success or error
response shape.

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/health` | API Gateway health check |
| `GET` | `/api/me` | Get the authenticated user |
| `POST` | `/api/projects` | Create a project |
| `GET` | `/api/projects` | List accessible projects |
| `GET` | `/api/projects/:id` | Get a project |
| `PATCH` | `/api/projects/:id` | Update a project |
| `DELETE` | `/api/projects/:id` | Delete a project |
| `POST` | `/api/projects/:id/upload` | Upload a project video |
| `POST` | `/api/projects/:id/process` | Start a FastAPI-backed mock processing job |
| `GET` | `/api/jobs/:id` | Get a processing job |
| `GET` | `/api/projects/:id/jobs` | List a project's jobs |
| `POST` | `/api/jobs/:id/cancel` | Cancel a queued or processing job |

The jobs list route accepts an optional `status` query parameter:

```txt
GET /api/projects/:id/jobs?status=processing
```

Non-auth route success responses use this shape:

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

## Video Uploads

Upload a single video using `multipart/form-data` with the field name `video`.
Supported formats are:

- `.mp4` (`video/mp4`)
- `.mov` (`video/quicktime`)
- `.mkv` (`video/x-matroska`)
- `.webm` (`video/webm`)

Files are stored locally under `services/api-gateway/storage/uploads` by
default. The original filename is not used as the stored filename.

## Mock Processing

Starting processing creates a queued database-backed job and launches a
temporary in-process background runner. Express calls FastAPI's mock
`POST /process-video` endpoint, replaces the project's old generated-video
metadata with the returned summary and reels, and completes the job.

Cancellation updates the database job but does not stop an in-flight FastAPI
request yet. The runner checks job status before saving results. This
implementation does not run FFmpeg, transcribe audio, or generate real output
files. A later phase will replace the in-process runner with durable workers.

## Available Commands

Run commands from `services/api-gateway`:

```bash
npm run dev             # Start the development server with watch mode
npm run build           # Compile TypeScript
npm start               # Run the compiled server
npm run lint            # Run ESLint
npm test                # Run all tests
npm run prisma:generate # Generate the Prisma client
npm run prisma:migrate  # Apply development migrations
npm run prisma:studio   # Open Prisma Studio
```

## Verification

Before submitting backend changes, run:

```bash
npm run build
npm run lint
npm test
```

## Roadmap

The next planned phase is notifications. Later phases will add FFmpeg audio
extraction, transcription, highlight scoring, summary generation, reel
generation, captions, and vertical formatting.
