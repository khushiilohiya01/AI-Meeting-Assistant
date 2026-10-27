# MeetTrack AI — Complete Meeting Intelligence Platform

MeetTrack AI is an end-to-end meeting intelligence SaaS platform. It continuously captures meeting audio from Chrome browser tabs (with optional microphone mixing), performs real-time audio transcription via OpenAI, extracts structured intelligence (summaries, decisions, action items, unresolved hindrances), tracks cross-meeting topic memory, and provides calendar synchronization and secure shareable reports.

---

## Architecture Overview

```
                                      +------------------------------------+
                                      |         Next.js Frontend           |
                                      |  (Dashboard, Reports, Tasks, Cal)  |
                                      +-----------------+------------------+
                                                        |
                         REST API Requests (Fetch)      |   Socket.IO Audio Stream
                       +--------------------------------+   (24kHz Mono Signed PCM16)
                       |                                |
                       v                                v
+-------------------------------------------------------------------------------+
|                             NestJS Backend                                    |
|                                                                               |
|  +--------------------+   +----------------------+   +---------------------+  |
|  |  REST Controllers  |   | CaptureGateway (WS)  |   | TranscriptionService|  |
|  | Meetings / Reports |   | Audio resampler / VAD|   | OpenAI Realtime WS  |  |
|  | Tasks / Calendar   |   +----------+-----------+   +----------+----------+  |
|  +---------+----------+              |                          |             |
|            |                         v                          v             |
|            |              +----------------------+   +---------------------+  |
|            |              |   AnalysisService    |   | gpt-live-transcribe |  |
|            |              | Structured Outputs   |   | Upstream Audio Buff |  |
|            |              +----------+-----------+   +---------------------+  |
|            |                         |                                        |
|            v                         v                                        |
|  +-------------------------------------------------------------------------+  |
|  |                     TypeORM + Persistent SQLite                         |  |
|  |   meetings | capture_sessions | transcript_segments | meeting_reports   |  |
|  |   tasks | topic_memories | topic_occurrences | share_links              |  |
|  +-------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## Key Features & Security Guarantees

1. **Continuous Tab Audio & Mic Capture**:
   - Uses Chrome's `navigator.mediaDevices.getDisplayMedia` with mandatory audio track validation.
   - Web Audio API `AudioContext` & downmixing to mono signed 16-bit PCM at 24,000 Hz.
   - Participant consent notice displayed prior to capture initialization.

2. **Server-Side OpenAI Realtime Protocol**:
   - Upstream connection `wss://api.openai.com/v1/realtime?intent=transcription` owned exclusively by NestJS.
   - **Zero Transcript Leakage**: Raw transcript text is NEVER emitted over WebSockets during active meetings. Only telemetry (duration, topics, draft decisions) is broadcast. Full dialogue is accessible only after processing.

3. **Structured Meeting Intelligence**:
   - OpenAI Responses API using strict JSON Schema Structured Outputs.
   - Generates executive summary, chronological walkthrough, canonical topics, explicit decisions with source excerpts, actionable tasks with nullable owners/deadlines, open questions, recurring hindrances, and follow-up events.

4. **Cross-Meeting Topic Memory**:
   - Canonical representation of recurring discussions and blockers.
   - Detects repeated hindrances without vector database overhead.

5. **Local Calendar & Secure Sharing**:
   - RFC 5545 compliant `.ics` calendar feed and export for Google Calendar, Outlook, and Apple Calendar.
   - Unguessable cryptographically random share tokens with SHA-256 hash persistence, configurable expiration, and transcript access control.

---

## Quick Start & Installation

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Set your OPENAI_API_KEY in .env (if available; backend features full offline mock resilience if omitted)
npm run build
npm run start:prod
# Server starts on http://localhost:5000 (REST: /api, WebSocket Gateway: ws://localhost:5000)
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run build
npm run start
# Client starts on http://localhost:3000
```

---

## Environment Variables (`backend/.env`)

```ini
PORT=5000
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_PATH=./data/meettrack.sqlite
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_TRANSCRIPTION_MODEL=gpt-live-transcribe
OPENAI_ANALYSIS_MODEL=gpt-4o
OPENAI_TRANSCRIPTION_DELAY=medium
CAPTURE_MAX_CONNECTIONS=1
MAX_AUDIO_PACKET_BYTES=65536
LIVE_INSIGHTS_ENABLED=true
LIVE_INSIGHTS_INTERVAL_SECONDS=90
SHARE_LINK_DEFAULT_EXPIRY_HOURS=168
```

---

## REST API Specification

### Meetings
- `POST   /api/meetings` — Create scheduled or live meeting
- `GET    /api/meetings` — List meetings with filters (`status`, `platform`, `search`)
- `GET    /api/meetings/:id` — Retrieve meeting by ID
- `PATCH  /api/meetings/:id` — Update meeting metadata
- `DELETE /api/meetings/:id` — Delete meeting and related entities
- `POST   /api/meetings/:id/capture-session` — Initialize capture session and obtain token
- `GET    /api/meetings/:id/status` — Get meeting capture and processing state
- `POST   /api/meetings/:id/finalize` — Finalize capture and generate intelligence
- `POST   /api/meetings/:id/reprocess` — Re-analyze transcript without re-recording

### Reports & Sharing
- `GET    /api/reports` — List all intelligence dossiers
- `GET    /api/reports/:id` — Retrieve specific intelligence report
- `GET    /api/meetings/:id/report` — Retrieve report for a meeting
- `GET    /api/meetings/:id/transcript` — Retrieve transcript (denied while capturing)
- `POST   /api/reports/:id/share` — Create revocable unguessable public share link
- `DELETE /api/reports/:id/share/:shareId` — Revoke share link
- `GET    /api/public/shares/:token` — Access shared report using token hash lookup

### Tasks & Action Items
- `GET    /api/tasks` — List tasks with filters (`status`, `priority`, `assignee`, `overdue`, `search`)
- `POST   /api/tasks` — Create task with nullable assignee and deadline
- `GET    /api/tasks/:id` — Retrieve task
- `PATCH  /api/tasks/:id` — Update status, priority, due date, or notes
- `DELETE /api/tasks/:id` — Delete task

### Calendar, Dashboard & Health
- `GET    /api/calendar/events` — Derive calendar events from meetings & deadlines
- `GET    /api/calendar/export.ics` — Export RFC 5545 iCalendar feed
- `GET    /api/deadlines` — Deadlines grouped by overdue, today, this week, later
- `GET    /api/dashboard/overview` — Dashboard summary metrics & recurring topics
- `GET    /api/search?q=` — Global search across meetings, reports, and tasks
- `GET    /api/health` — System status, database connection, and sanitized AI state

---

## WebSocket Capture Protocol (Socket.IO)

- `capture:join` (`client -> server`): Join capture session with `{ meetingId, captureToken }`
- `capture:status` (`server -> client`): Emits session readiness
- `capture:audio` (`client -> server`): 24kHz mono PCM16 buffer chunk with sequence number
- `capture:stop` (`client -> server`): Request immediate buffer flush and finalization
- `insights:update` (`server -> client`): Incremental topics & draft decisions (NO raw transcript)
- `meeting:finalizing` (`server -> client`): Indicates audio buffer committed and analysis underway
- `meeting:ready` (`server -> client`): Emitted when report is persisted with `{ reportId }`

---

## Testing & Verification

1. **Unit & Service Tests**:
   ```bash
   cd backend && npm test
   # Passes 3/3 suites: calendar.service.spec.ts, reports.service.spec.ts, tasks.service.spec.ts
   ```

2. **Frontend Linter & Typecheck**:
   ```bash
   cd frontend && npm run lint && npm run build
   # 0 errors, successful Turbopack partial prerender build for all routes
   ```

3. **End-to-End Simulation**:
   ```bash
   cd backend && node test-e2e-simulation.js
   # Validates real meeting creation -> audio streaming -> buffer flush -> report generation -> public sharing -> calendar export
   ```

4. **Cross-Meeting Topic Memory Test**:
   ```bash
   cd backend && node test-cross-meeting-memory.js
   # Validates recurring blocker identification, bogus token 404 rejection, and meeting reprocessing
   ```
