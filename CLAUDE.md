# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HomeFlix is a LAN-only video streaming platform for locally owned media. It provides a Netflix-like UI for browsing and playing videos stored on your local network. Currently in planning/scaffolding phase with the video normalization utility complete.

## Current Commands

### Video Normalization
```bash
bash video-normalization/video_normalizer.sh /path/to/video/folder
```
Converts all `.avi` files to normalized `.mp4` files (H.264/AAC) in a sibling directory named `{input}_normalized_mp4/`. Requires `ffmpeg` on PATH.

### Planned Commands (Next.js - not yet scaffolded)
```bash
npm install          # Install dependencies
npm run dev          # Development server
npm run build        # Production build
npm start            # Start production server
docker compose up -d # Start via Docker
```

## Architecture

### Tech Stack (Planned)
- **Backend/Frontend**: Next.js (single-process - API routes + pages, no separate Express server)
- **Config**: YAML (`library.yml`) parsed once at startup, cached in memory, auto-reloaded via `fs.watchFile`
- **Streaming**: HTTP Range requests for seeking support
- **Deployment**: Docker + Docker Compose

### Key Files
- `plan.md` - Living development log with detailed implementation checklist and decisions
- `AGENTS.md` - Repository guidelines and conventions
- `video-normalization/video_normalizer.sh` - Bash utility for converting videos

### Media Layout
```
/media
  /Series Name
    /assets
      poster.jpg, backdrop.jpg
      /seasons (s01.jpg, s02.jpg...)
      /episodes (s01e01.jpg, s01e02.jpg...)
    /Season 01
      S01E01.mp4, S01E02.mp4...
```

### Security: validatePath (Critical)
All file access must use `validatePath()` utility:
1. URL-decode input
2. `path.resolve(root, userPath)`
3. Assert result starts with `path.resolve(root) + path.sep`
4. Return absolute path on success, null on failure

This prevents path traversal attacks. Used by `/api/stream`, `/api/asset`, and startup validation. Return `403` on failure.

### Planned API Routes
- `GET /api/library` - Full config
- `GET /api/collections` - List collections
- `GET /api/collections/:id` - Collection details
- `GET /api/collections/:id/seasons/:season` - Episode list
- `GET /api/stream?collectionId=...&season=...&ep=...` - Video streaming (supports Range)
- `GET /api/asset?path=...` - Serve images
- `GET /api/health` - Health check

### Environment Variables (Planned)
```bash
MEDIA_ROOT=/media
DATA_DIR=/data
LIBRARY_CONFIG=/data/library.yml
LAN_ONLY=true
```

## Coding Conventions

- **Shell**: Bash with `set -euo pipefail`
- **Indentation**: 2 spaces
- **Commits**: Concise, imperative form (e.g., "Add mp4 normalizer script")

## Design Decisions

Key decisions are documented in the Decisions Log section of `plan.md`. Major choices:
- Single-process architecture (Next.js handles everything)
- Config caching with `fs.watchFile` (no reload endpoint)
- Path validation via resolve-and-assert pattern
- Docker on macOS, Windows media mounted via SMB
- No auth in Iteration 1 (LAN-only)
