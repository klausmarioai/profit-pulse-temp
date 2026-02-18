# Klaus Task Dashboard

Simple local kanban board to track tasks across sub-agents.

## Open it (real-time mode)
From this folder:
- `node server.js`
Then open: `http://127.0.0.1:8787`

(You can still double-click `index.html`, but live auto-sync needs the server.)

## Notes
- Data is stored in browser localStorage (`klaus.work.dashboard.v2`)
- You can export/import tasks as JSON
- Click **Sync** to merge from `tasks-live.json`
- Click **Publish** to write the current board to `tasks-live.json` via `POST /api/tasks`
- `GET /api/live` returns tasks + active OpenClaw sessions
- `/events` streams live snapshots every 3 seconds (SSE)
