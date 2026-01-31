# HomeFlix

A LAN-only video streaming platform with a Netflix-like UI for locally owned media. Stream your personal video library to any device on your local network.

## Features

- Netflix-like dark theme UI
- Browse collections by series/movies
- Season and episode navigation with thumbnails
- HTML5 video player with seeking support (HTTP Range requests)
- Config-driven catalog via YAML
- Auto-reload config on file changes
- Path traversal protection
- Docker-ready deployment

## Quick Start

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000

## Configuration

### Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
MEDIA_ROOT=/media              # Path to your media files
DATA_DIR=/data                 # Path to data directory
LIBRARY_CONFIG=/data/library.yml  # Path to library config
LAN_ONLY=true                  # Restrict to LAN access
```

### Library Configuration

Copy `app/data/library.yml.example` to `app/data/library.yml` and configure your media:

```yaml
collections:
  - id: my-series
    title: My Series
    type: series
    path: My Series
    poster: My Series/assets/poster.jpg
    backdrop: My Series/assets/backdrop.jpg
    seasons:
      - number: 1
        poster: My Series/assets/seasons/s01.jpg
        episodes:
          - id: s01e01
            title: Episode Title
            season: 1
            episode: 1
            filename: S01E01.mp4
            thumbnail: My Series/assets/episodes/s01e01.jpg
```

## Media Layout

Organize your media files following this structure:

```
/media
  /Series Name
    /assets
      poster.jpg           # Main poster (2:3 aspect ratio)
      backdrop.jpg         # Hero backdrop (16:9)
      /seasons
        s01.jpg            # Season 1 poster
        s02.jpg            # Season 2 poster
      /episodes
        s01e01.jpg         # Episode thumbnails (16:9)
        s01e02.jpg
    /Season 01
      S01E01.mp4           # Video files (H.264/AAC)
      S01E02.mp4
    /Season 02
      S02E01.mp4
```

### Video Format Requirements

Videos must be in MP4 format with H.264 video and AAC audio for broad device compatibility. Use the included normalization utility to convert videos:

```bash
bash video-normalization/video_normalizer.sh /path/to/videos
```

### Generating Thumbnails

Extract thumbnails from videos using ffmpeg:

```bash
ffmpeg -ss 00:00:05 -i "Season 01/S01E01.mp4" -frames:v 1 "assets/episodes/s01e01.jpg"
```

## Docker Deployment

### Build and Run

```bash
cd app
docker compose up -d
```

### docker-compose.yml Configuration

Edit the volume mounts in `docker-compose.yml`:

```yaml
volumes:
  - ./data:/data:rw                    # Config directory
  - /path/to/your/media:/media:ro      # Media directory (read-only)
```

For Windows media paths via SMB mount on macOS:
```yaml
volumes:
  - /Volumes/MediaShare:/media:ro
```

## Project Structure

```
homeflix/
├── app/                          # Next.js application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx        # Dark theme wrapper, navigation
│   │   │   ├── CollectionCard.tsx # Poster card for home page
│   │   │   ├── SeasonCard.tsx    # Season poster tile
│   │   │   ├── EpisodeCard.tsx   # Episode thumbnail with play button
│   │   │   └── VideoPlayer.tsx   # HTML5 video player
│   │   ├── lib/
│   │   │   ├── config.ts         # YAML config caching with fs.watchFile
│   │   │   ├── env.ts            # Environment variable access
│   │   │   └── validatePath.ts   # Path traversal prevention
│   │   ├── pages/
│   │   │   ├── api/
│   │   │   │   ├── health.ts     # Health check endpoint
│   │   │   │   ├── library.ts    # Full config endpoint
│   │   │   │   ├── stream.ts     # Video streaming with Range support
│   │   │   │   ├── asset.ts      # Image serving
│   │   │   │   └── collections/  # Collection API routes
│   │   │   ├── index.tsx         # Home page
│   │   │   ├── c/[id].tsx        # Collection page
│   │   │   ├── c/[id]/s/[season].tsx  # Season page
│   │   │   └── watch/[id]/[season]/[ep].tsx  # Video player
│   │   ├── styles/
│   │   │   └── globals.css       # Tailwind + dark theme
│   │   └── types/
│   │       └── index.ts          # TypeScript interfaces
│   ├── data/
│   │   └── library.yml.example   # Example config
│   ├── Dockerfile                # Multi-stage Docker build
│   ├── docker-compose.yml        # Docker Compose config
│   └── .dockerignore
├── video-normalization/          # Video conversion utility
├── plan.md                       # Development checklist
├── CLAUDE.md                     # AI assistant instructions
└── AGENTS.md                     # Repository guidelines
```

## API Endpoints

### Catalog

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check with config and media status |
| `GET /api/library` | Full parsed config (for debugging) |
| `GET /api/collections` | List all collections with basic info |
| `GET /api/collections/:id` | Collection details including seasons |
| `GET /api/collections/:id/seasons/:season` | Episode list for a season |

### Media

| Endpoint | Description |
|----------|-------------|
| `GET /api/stream?collectionId=...&season=...&ep=...` | Video streaming with HTTP Range support |
| `GET /api/asset?path=...` | Serve images (posters, thumbnails) |

### Health Check Response

```json
{
  "status": "ok",
  "configLoaded": true,
  "mediaRoot": "/media",
  "mediaRootExists": true,
  "timestamp": "2025-01-31T10:30:00Z"
}
```

## Security

- **Path Validation**: All file access uses `validatePath()` to prevent directory traversal attacks
- **LAN-Only**: Designed for local network use without authentication
- **Read-Only Media**: Docker mounts media directory as read-only

## Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Config**: YAML with auto-reload
- **Deployment**: Docker + Docker Compose

## Development

```bash
cd app
npm run dev      # Development server with hot reload
npm run build    # Production build
npm start        # Start production server
npm run lint     # Run ESLint
```

## Troubleshooting

### Config not loading
- Check that `library.yml` exists at the path specified in `LIBRARY_CONFIG`
- Check server logs for parsing errors
- Verify YAML syntax is valid

### Videos not playing
- Ensure videos are MP4 with H.264/AAC encoding
- Check browser DevTools Network tab for 404 or 403 errors
- Verify file paths in `library.yml` match actual file locations

### Path traversal errors (403)
- All paths in `library.yml` must be relative to `MEDIA_ROOT`
- Paths cannot contain `..` or escape the media root
