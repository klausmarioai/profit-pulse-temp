---
name: youtube-analytics-toolkit
description: Analyze YouTube channels, videos, and search results via YouTube Data API v3. Use when comparing channels, checking video/channel stats, searching topics, and building competitor benchmarks.
---

# YouTube Analytics Toolkit

## Setup
- Add `YOUTUBE_API_KEY` for scripts under `scripts/`.
- Install deps once: `cd scripts && npm install`.

## Use
- Prefer high-level functions in `scripts/src/index.ts`:
  - `analyzeChannel(channelId)`
  - `compareChannels(channelIds)`
  - `analyzeVideo(videoId)`
  - `searchAndAnalyze(query, maxResults)`

## Outputs
Results auto-save under `results/` when scripts are used.
