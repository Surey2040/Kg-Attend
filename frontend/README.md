# KGiSL-IIM Smart Attendance — Frontend

React + Vite + Tailwind frontend matching the reference dashboard and portal
screens, wired to the `kgisl-attendance` backend (WebSocket live QR + REST).

## Pages

- `/` — Portal select (Admin / Student)
- `/admin/login`, `/student/login` — login forms, call `POST /api/v1/auth/*`
- `/faculty/dashboard` — live session control: start/end session, live QR via
  Socket.IO (`qr_updated`), countdown ring, live present/absent stats and
  recent-scans feed (`attendance_marked`), validation status strip, bottom
  stat tiles.
- `/student/scan` — camera-based QR scanner (`jsQR`) that decodes the QR,
  fetches the session's batch/subject via `GET /sessions/:id/public` (the QR
  itself carries no attendance data, per the backend spec), grabs the
  device's GPS, and submits `POST /api/v1/scan`.

## Setup

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to localhost:4000
```

Requires the backend running on port 4000 (see the backend's own README) with
Socket.IO reachable at the same origin `/socket.io` path (Vite's dev proxy
only forwards `/api` — for WebSocket in dev, run frontend and backend on the
same origin via a reverse proxy, or point `services/socket.js` at the
backend's absolute URL, e.g. `io('http://localhost:4000', {...})`).

## Integration note

`SessionConfigBar` currently sends human-readable labels ("Java Programming",
"302 - MCA Lab") as `subjectId`/`roomId`/`batchId` for demo purposes, but the
backend's `startSessionHandler` validates these as UUID foreign keys into
`Subject`/`Room`/`Batch` tables. Before going live, replace the static option
arrays in `SessionConfigBar` with real dropdowns populated from
`GET /api/v1/subjects`, `/rooms`, `/batches` (add these simple list endpoints
to the backend — they weren't in the original spec, which focused on the QR
security pipeline) so real UUIDs get submitted.

## Design

Dark navy surface (`ink-*` scale) with a single red accent (`signal-red`),
matching the brand reference. The one deliberate animated moment is the
`scan-frame` component (corner brackets + a sweeping scan-line) used around
both the faculty's live QR and the student's camera viewfinder — everything
else stays still, `prefers-reduced-motion` is respected.
