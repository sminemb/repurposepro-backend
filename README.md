# RepurposePro Backend

RepurposePro is an AI-powered video repurposing platform designed to turn
long-form videos into summary videos and short vertical reels.

This repository currently contains the Express.js API Gateway through Phase 6
of the backend roadmap. It includes authentication, API protection, project
management, local video uploads, and mock processing jobs. Real AI and video
processing are not implemented yet.

## Current Features

- Express.js 5 API Gateway written in TypeScript
- Better Auth email/password authentication and session management
- Prisma ORM with Neon Serverless Postgres
- Arcjet bot protection, shield rules, and route-level rate limiting
- Authenticated project CRUD with ownership enforcement
- Local video uploads for `.mp4`, `.mov`, `.mkv`, and `.webm` files
- Mock asynchronous video-processing jobs with progress tracking
- Consistent validation, error handling, and API responses
- Vitest and Supertest integration tests

## Repository Structure

```txt
repurposepro-backend/
├── AGENTS.md
├── README.md
└── services/
    └── api-gateway/
        ├── prisma/
        ├── src/
        ├── storage/uploads/
        ├── .env.example
        ├── Dockerfile
        └── package.json
```

The FastAPI AI service will be added in a later phase. Frontend applications
should communicate only with the API Gateway.

## Prerequisites

- Node.js 22 or later
- npm
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

The API Gateway runs at `http://localhost:5000` by default. Check it with:

```bash
curl http://localhost:5000/api/health
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
| `POST` | `/api/projects/:id/process` | Start a mock processing job |
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

Starting processing creates a database-backed job and runs a temporary
timer-based mock workflow. The job moves through mock preparation,
transcription, highlight detection, and generation steps before completing.

This implementation does not run FFmpeg, transcribe audio, or generate output
videos. A later phase will replace it with the internal FastAPI AI service and
background workers.

## Available Commands

Run commands from `services/api-gateway`:

```bash
npm run dev             # Start the development server with watch mode
npm run build           # Compile TypeScript
npm start               # Run the compiled server
npm run lint            # Run ESLint
npm test                # Run all tests
npm run test:phase1-6   # Run the Phase 1-6 integration suite
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

The next planned phase is the FastAPI AI Service foundation. Later phases will
connect Express to FastAPI, add FFmpeg audio extraction, transcription,
highlight scoring, summary generation, reel generation, captions, and vertical
formatting.
