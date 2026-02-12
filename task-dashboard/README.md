# Klaus Task Dashboard

Simple local kanban board to track tasks across sub-agents.

## Open it
- Double-click `index.html`

## Optional (serve via local URL)
From this folder:
- `python -m http.server 8787`
Then open: `http://127.0.0.1:8787`

## Notes
- Data is stored in browser localStorage (`klaus.tasks.v1`)
- You can export/import tasks as JSON
- Click **Sync Snapshot** to merge from `tasks-live.json`
- Current sync is snapshot-based (simple and reliable); live auto-sync can be added next via webhook/session feed.
