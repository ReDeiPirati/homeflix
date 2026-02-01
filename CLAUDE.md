# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HomeFlix is a LAN-only video streaming platform for locally owned media. It provides a Netflix-like UI for browsing and playing videos stored on your local network. Supports both **TV series** (with seasons/episodes) and **movies** (flat folder structure).

## Current Commands

### Video Normalization
```bash
# Convert a single movie file
bash video-normalization/convert_movie.sh /path/to/movie.mkv /path/to/output.mp4

# Batch convert a folder (AVI/MKV to MP4)
bash video-normalization/video_normalizer.sh /path/to/video/folder
```
Converts videos to browser-compatible MP4 (H.264 video + AAC stereo audio). Requires `ffmpeg` on PATH. **Important:** The stream API only accepts MP4 files.

### Asset Generation
```bash
bash video-normalization/generate_assets.sh /path/to/media "Show Title"
```
Generates posters, backdrops, and episode thumbnails. Requires `ffmpeg` and ImageMagick (`magick`) on PATH.

### Next.js App
```bash
cd app
npm install          # Install dependencies
npm run dev          # Development server (localhost only)
npm run dev -- -H 0.0.0.0  # Development server (LAN accessible)
npm run build        # Production build
npm start            # Start production server
docker compose up -d # Start via Docker
```

## Architecture

### Tech Stack
- **Backend/Frontend**: Next.js 14 (Pages Router, single-process - API routes + pages)
- **Styling**: Tailwind CSS with Netflix-like dark theme
- **Config**: YAML (`library.yml`) parsed once at startup, cached in memory, auto-reloaded via `fs.watchFile`
- **Streaming**: HTTP Range requests for seeking support
- **Deployment**: Docker + Docker Compose

### Key Files
- `plan.md` - Living development log with detailed implementation checklist and decisions
- `AGENTS.md` - Repository guidelines and conventions
- `video-normalization/convert_movie.sh` - Convert single video to browser-compatible MP4
- `video-normalization/video_normalizer.sh` - Batch convert folder of videos
- `video-normalization/generate_assets.sh` - Generates posters and thumbnails
- `app/data/library.yml.example` - Example library configuration (series + movies)

### Media Layout
```
/media
  /Series Name              # TV Series
    /assets
      poster.jpg, backdrop.jpg
      /seasons (s01.jpg, s02.jpg...)
      /episodes (s01e01.jpg, s01e02.jpg...)
    /Season 01
      S01E01.mp4, S01E02.mp4...

  /Movie Name               # Movies (flat structure)
    movie.mp4               # Direct in folder, no Season subfolder
    /assets
      poster.jpg, backdrop.jpg
```

### Security: validatePath (Critical)
All file access must use `validatePath()` utility:
1. URL-decode input
2. `path.resolve(root, userPath)`
3. Assert result starts with `path.resolve(root) + path.sep`
4. Return absolute path on success, null on failure

This prevents path traversal attacks. Used by `/api/stream`, `/api/asset`, and startup validation. Return `403` on failure.

### API Routes
- `GET /api/library` - Full config
- `GET /api/collections` - List collections
- `GET /api/collections/:id` - Collection details
- `GET /api/collections/:id/seasons/:season` - Episode list
- `GET /api/stream?collectionId=...&season=...&ep=...` - Stream episode (supports Range)
- `GET /api/stream?collectionId=...` - Stream movie (no season/ep needed)
- `GET /api/asset?path=...` - Serve images
- `GET /api/health` - Health check

**Note:** Stream API only accepts MP4/M4V files. Returns 415 for other formats.

### Environment Variables
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
- **Discriminated union types** for Collection (SeriesCollection | MovieCollection)
- **Movies use flat folder structure** (no fake Season subfolder)
- **MP4-only streaming** to ensure browser compatibility
