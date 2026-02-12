# Klaus Task Dashboard

Simple local kanban board to track tasks across sub-agents.

## Open it (real-time mode)
From this folder:
- `node server.js`
Then open: `http://127.0.0.1:8787`

(You can still double-click `index.html`, but live auto-sync needs the server.)

## Notes
- Data is stored in browser localStorage (`klaus.tasks.v1`)
- You can export/import tasks as JSON
- Click **Sync Snapshot** to merge from `tasks-live.json`
- Current sync is snapshot-based (simple and reliable); live auto-sync can be added next via webhook/session feed.
