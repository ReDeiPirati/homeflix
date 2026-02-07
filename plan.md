# HomeFlix — Implementation Checklist (Iteration 1)

Goal: a **LAN-only** web app with a clean, Netflix-like UI that streams your **locally owned** media.
Initial library: **The Big Bang Theory (S1–S10)**.

---

## Current Status

**Iteration 1 complete + Movie Support added.** The app supports both TV series and movies.

**What's working:**
- Next.js 14 with Pages Router, TypeScript, and Tailwind CSS
- Config caching layer with `fs.watchFile` for auto-reload
- Path validation security utility (`validatePath`)
- All API routes implemented and tested
- Netflix-like dark theme UI with responsive design
- Docker configuration (Dockerfile + docker-compose.yml)
- Real media configured (Big Bang Theory Season 1 + The Naked Gun movie)
- Asset generation script for posters/thumbnails
- Video streaming with HTTP Range requests (seeking works)
- **Movie support with flat folder structure (no Season subfolder)**
- **Discriminated union types for Series vs Movie collections**
- **MP4-only streaming validation (rejects MKV, AVI, etc.)**
- **Video conversion script for browser compatibility**
- Tested on local network from multiple devices

**Media structure (Series):**
```
media/
  Series Name/
    assets/
      poster.jpg
      backdrop.jpg
      season1/
        poster.jpg
        episodes/
          e01.jpg ... e17.jpg
    Season 01/
      S01E01.mp4 ... S01E17.mp4
```

**Media structure (Movies):**
```
media/
  Movie Name/
    movie.mp4              # Direct in folder, no Season subfolder
    assets/
      poster.jpg
      backdrop.jpg
```

**Next steps:**
1. ✅ Run via Docker with proper volume mounts (completed 2026-02-07)
2. Add more seasons/shows/movies to library.yml
3. ✅ Test on iPad Safari and other target devices (confirmed working)
4. Security testing (path traversal protection)

---

## Decisions Log

This section records *why* each key choice was made.

| Decision | What | Why |
|----------|------|-----|
| **Single-process architecture** | Next.js API routes handle all backend logic (catalog, streaming, assets). No separate Express/Fastify server. | A separate Node server requires either a reverse proxy or two processes in the container. Next.js API routes support `res.pipe()` for file streaming, which is all we need. Eliminates the Dockerfile and networking complexity of a dual-process setup. |
| **Config caching** | `library.yml` is parsed once at startup and held in memory. Routes read from the cached object, not from disk. | Every stream/seek Range request would otherwise re-parse the config file. The in-memory cache is invalidated only on file-change watch. |
| **No reload endpoint** | Removed `POST /api/reload`. Config reloads automatically via `fs.watchFile`. | An unauthenticated reload endpoint is an unnecessary attack surface. `fs.watchFile` on `library.yml` achieves the same result with zero network exposure. |
| **Path validation via resolve-and-assert** | All file paths are resolved with `path.resolve()` and then asserted to start with `MEDIA_ROOT`. | String-matching for `..` is bypassable (URL encoding, symlinks). Resolve-and-assert is the only robust approach. |
| **Docker on macOS only (for now)** | Iteration 1 targets macOS as the Docker host. Media on Windows is accessed via SMB mount. | Docker volume mapping behaves differently on Windows vs macOS. Running Docker on one machine and mounting the other's media over the network is simpler. |
| **App in subdirectory** | Next.js app lives in `/app` subdirectory, not repo root. | Avoids conflicts with existing repo files (README.md, plan.md, video-normalization/). Cleaner separation of concerns. |
| **Discriminated union for Collection types** | `Collection = SeriesCollection | MovieCollection` with `type` field as discriminant. Series have `seasons`, movies have `filename`. | TypeScript can narrow types based on `type` field. Clean separation of concerns - no optional `seasons` on movies, no optional `filename` on series. |
| **Movies use flat folder structure** | Movies stored as `{path}/{filename}` without Season subfolder. | Forcing movies into fake "Season 01" folders is awkward. Flat structure is more intuitive and matches how movies are typically organized. |
| **MP4-only streaming** | Stream API rejects non-MP4 files with 415 error. | MKV with AC3 audio doesn't play in browsers. Forcing MP4 (H.264/AAC) ensures consistent playback. Conversion script provided for other formats. |

---

## Implementation Checklist

### 0) Project Setup
- [x] Create repo `homeflix`
- [x] Scaffold Next.js project in `/app` subdirectory
  - [x] Next.js 14 with Pages Router
  - [x] TypeScript
  - [x] Tailwind CSS with dark theme
  - [x] ESLint
- [x] Implement config-caching layer (`src/lib/config.ts`)
  - [x] Parse `library.yml` once at startup
  - [x] Cache in memory
  - [x] Auto-reload via `fs.watchFile`
- [x] Define environment variables (`src/lib/env.ts`)
  - [x] `MEDIA_ROOT` - path to media files
  - [x] `DATA_DIR` - path to data directory
  - [x] `LIBRARY_CONFIG` - path to library.yml
  - [x] `LAN_ONLY` - restrict to LAN access
- [x] Implement `validatePath` security utility (`src/lib/validatePath.ts`)
  - [x] URL-decode input
  - [x] Resolve to absolute path
  - [x] Assert starts with root directory
  - [x] Return null on traversal attempt
- [x] Create TypeScript interfaces (`src/types/index.ts`)
  - [x] Episode, Season, Collection
  - [x] LibraryConfig, HealthStatus, ApiError

### 1) Media Layout
- [x] MP4 container, H.264 video, AAC audio
  - [x] Video normalization utility in `video-normalization/`
- [x] Generate thumbnails with ffmpeg
  - [x] Asset generation script (`video-normalization/generate_assets.sh`)
- [x] Prepare assets folder structure for test content

### 2) Configuration
- [x] Define `library.yml` schema
- [x] Create example config (`data/library.yml.example`)
- [ ] Add startup validation for referenced files
- [x] Create actual `library.yml` with real media paths
  - [x] Big Bang Theory Season 1 (16 episodes)

### 3) Docker
- [x] Add `Dockerfile`
  - [x] Multi-stage build (deps → build → production)
  - [x] Standalone output mode
  - [x] Non-root user for security
- [x] Add `docker-compose.yml`
  - [x] Port mapping (3000:3000)
  - [x] Volume mounts for media and data
  - [x] Environment variables
- [x] Add `.dockerignore`
- [x] Configure `next.config.mjs` for standalone output

### 4) Backend API
- [x] `GET /api/health`
  - [x] Returns config and media status
  - [x] Includes timestamp
  - [x] Returns 503 if unhealthy
- [x] `GET /api/library`
  - [x] Returns full parsed config
  - [x] For debugging purposes
- [x] `GET /api/collections`
  - [x] Lists collections with id, title, type, poster, backdrop
- [x] `GET /api/collections/:id`
  - [x] Returns full collection details including seasons
  - [x] 404 if not found
- [x] `GET /api/collections/:id/seasons/:season`
  - [x] Returns season with episode list
  - [x] 404 if season not found
- [x] `GET /api/stream`
  - [x] Query params: collectionId, season, ep
  - [x] Looks up file path from config
  - [x] Validates path before opening
  - [x] HTTP Range support for seeking
  - [x] Returns 206 for partial content
  - [x] Returns 200 for full file
- [x] `GET /api/asset`
  - [x] Query param: path
  - [x] Validates path before opening
  - [x] Serves images with correct MIME type
  - [x] Cache-Control header (1 day)
  - [x] 403 on path traversal attempt

### 5) Frontend Components
- [x] `Layout.tsx`
  - [x] Dark theme wrapper
  - [x] Fixed header with navigation
  - [x] HOMEFLIX branding
- [x] `CollectionCard.tsx`
  - [x] Poster image with hover effect
  - [x] Title below poster
  - [x] Links to collection page
- [x] `SeasonCard.tsx`
  - [x] Season poster or number fallback
  - [x] Episode count display
  - [x] Links to season page
- [x] `EpisodeCard.tsx`
  - [x] Thumbnail with play button overlay
  - [x] Episode number and title
  - [x] Links to watch page
- [x] `VideoPlayer.tsx`
  - [x] HTML5 video element
  - [x] Native browser controls
  - [x] Auto-play on load

### 6) Frontend Pages
- [x] Home page (`/`)
  - [x] TV Series row
  - [x] Movies row
  - [x] Empty state when no collections
  - [x] Error state for config issues
- [x] Collection page (`/c/:id`)
  - [x] Hero section with backdrop
  - [x] Title and description
  - [x] Seasons grid
  - [x] Error handling for missing collection
- [x] Season page (`/c/:id/s/:season`)
  - [x] Breadcrumb navigation
  - [x] Episode count
  - [x] Episodes grid with thumbnails
  - [x] Error handling for missing season
- [x] Watch page (`/watch/:id/:season/:ep`)
  - [x] Video player
  - [x] Previous/Next episode navigation
  - [x] Back to season link
  - [x] Episode details

### 7) Styling
- [x] Tailwind CSS configuration
  - [x] Netflix color palette
  - [x] Dark theme as default
- [x] Global styles
  - [x] Custom scrollbar styling
  - [x] Base font configuration
- [x] Responsive design
  - [x] Mobile-friendly layouts
  - [x] Breakpoints for tablet/desktop

### 8) Movie Support
- [x] Update TypeScript types for movies
  - [x] `SeriesCollection` with `seasons: Season[]`
  - [x] `MovieCollection` with `filename: string`
  - [x] Discriminated union `Collection = SeriesCollection | MovieCollection`
- [x] Update stream API for movies
  - [x] Make `season` and `ep` params optional
  - [x] Movie path: `{MEDIA_ROOT}/{path}/{filename}`
  - [x] Add MP4-only validation (reject MKV, AVI, etc.)
- [x] Add movie watch page (`/watch/movie/[id]`)
  - [x] Simplified player without prev/next navigation
  - [x] Back to home link
- [x] Update VideoPlayer component
  - [x] Add `isMovie` prop for correct stream URL
- [x] Update collection detail page
  - [x] Show Play button for movies (not seasons grid)
- [x] Update CollectionCard
  - [x] Accept `type` prop
  - [x] Link movies directly to `/watch/movie/[id]`
- [x] Update homepage
  - [x] Pass `type` to CollectionCard
- [x] Add video conversion script
  - [x] `video-normalization/convert_movie.sh`
  - [x] Converts any format to H.264 + AAC stereo
- [x] Update video_normalizer.sh
  - [x] Handle MKV files in addition to AVI
- [x] Update example config with movie format
- [x] Fix type narrowing in season/episode pages

---

## Testing Checklist (Manual)

### Development
- [x] `npm run dev` starts without errors
- [x] Home page loads at http://localhost:3000
- [x] No TypeScript errors in terminal

### API Endpoints
- [x] `curl http://localhost:3000/api/health` returns JSON with status
- [x] `/api/collections` returns collection list
- [x] `/api/stream` returns video with correct headers (206 Partial Content)

### Security
- [ ] `curl 'http://localhost:3000/api/asset?path=../../../etc/passwd'` returns 403
- [ ] URL-encoded traversal attempts are blocked

### Playback
- [x] Video plays in browser
- [x] Seeking works (check Network tab for 206 responses)
- [x] Works on iPad Safari (confirmed)
- [x] Works on Chrome desktop (confirmed)

### LAN Access
- [x] App accessible from other devices on network (192.168.x.x:3000)

### Docker
- [x] `docker compose build` succeeds
- [x] `docker compose up` starts the app
- [x] App accessible at http://localhost:3000
- [x] Volume mounts working (data r/w, media r/o)
- [x] Config auto-reload via fs.watchFile works
- [x] Streaming with Range requests works (206 responses)
- [x] Asset serving works

---

## File Structure (Implemented)

```
homeflix/
├── app/                              # Next.js application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── CollectionCard.tsx
│   │   │   ├── SeasonCard.tsx
│   │   │   ├── EpisodeCard.tsx
│   │   │   └── VideoPlayer.tsx
│   │   ├── lib/
│   │   │   ├── config.ts
│   │   │   ├── env.ts
│   │   │   └── validatePath.ts
│   │   ├── pages/
│   │   │   ├── api/
│   │   │   │   ├── health.ts
│   │   │   │   ├── library.ts
│   │   │   │   ├── stream.ts
│   │   │   │   ├── asset.ts
│   │   │   │   └── collections/
│   │   │   │       ├── index.ts
│   │   │   │       ├── [id].ts
│   │   │   │       └── [id]/seasons/[season].ts
│   │   │   ├── index.tsx
│   │   │   ├── c/
│   │   │   │   ├── [id].tsx
│   │   │   │   └── [id]/s/[season].tsx
│   │   │   └── watch/
│   │   │       ├── [id]/[season]/[ep].tsx
│   │   │       └── movie/[id].tsx
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── types/
│   │       └── index.ts
│   ├── data/
│   │   └── library.yml.example
│   ├── public/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .dockerignore
│   ├── .env.local.example
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── package.json
├── video-normalization/
│   ├── video_normalizer.sh      # Batch convert AVI/MKV to MP4
│   ├── convert_movie.sh         # Single file conversion
│   ├── generate_assets.sh
│   └── README.md
├── plan.md
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

---

## Iteration 1 Scope (Reminder)

**Included:**
- No auth (LAN-only)
- No autoplay between episodes
- No subtitles
- Catalog driven by `library.yml`
- Direct Play MP4 (H.264/AAC) with HTTP Range support
- Docker-first deployment
- Episode list with thumbnails per season
- Artwork stored with videos (not in app)

**Excluded (future iterations):**
- User authentication
- Watch history / progress tracking
- Subtitle support
- Transcoding
- Multiple user profiles
- Search functionality
