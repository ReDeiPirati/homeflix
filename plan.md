# HomeFlix — Implementation Checklist (Iteration 1)

Goal: a **LAN-only** web app with a clean, Netflix-like UI that streams your **locally owned** media.  
Initial library: **The Big Bang Theory (S1–S10)**.

---

## Decisions Log

This section records *why* each key choice was made, so they don't get re-litigated later.

| Decision | What | Why |
|----------|------|-----|
| **Single-process architecture** | Next.js API routes handle all backend logic (catalog, streaming, assets). No separate Express/Fastify server. | A separate Node server requires either a reverse proxy or two processes in the container. Next.js API routes support `res.pipe()` for file streaming, which is all we need. Eliminates the Dockerfile and networking complexity of a dual-process setup. Revisit if we hit throughput limits (unlikely on a single-user LAN app). |
| **Config caching** | `library.yml` is parsed once at startup and held in memory. Routes read from the cached object, not from disk. | Every stream/seek Range request would otherwise re-parse the config file. The in-memory cache is invalidated only on file-change watch or explicit reload. |
| **No reload endpoint** | Removed `POST /api/reload`. Config reloads automatically via `fs.watchFile`. | An unauthenticated reload endpoint is an unnecessary attack surface. `fs.watchFile` on `library.yml` achieves the same result with zero network exposure and zero extra code for the consumer. |
| **JSON for persistent state** | Simple JSON file under `/data` for any server-side state. | No server-side state is needed in Iteration 1 beyond the config itself. If we add watch history or preferences later, we revisit SQLite. |
| **Path validation via resolve-and-assert** | All file paths are resolved with `path.resolve()` and then asserted to start with `MEDIA_ROOT`. | String-matching for `..` is bypassable (URL encoding, symlinks). Resolve-and-assert is the only robust approach and it's a one-liner. Implemented as a shared `validatePath()` utility used by both the stream and asset endpoints. |
| **Docker on macOS only (for now)** | Iteration 1 targets macOS as the Docker host. Media on the Windows machine is accessed via SMB mount. | Docker volume mapping behaves differently on Windows vs macOS (line endings, path separators, drive letters). Running Docker on one machine and mounting the other's media over the network is simpler than maintaining two Docker configs. Revisit if the user wants to run the container on Windows directly. |

---

## Current Status (living log)

- Repo initialized with baseline docs and tooling notes (`README.md`, `AGENTS.md`, `.gitignore`).
- Video normalization utility lives in `video-normalization/` (Bash + README).
- First commit created and pushed to `origin/main`.
- Next: scaffold Next.js project and define the config-caching layer.

**Iteration 1 focus (keep it simple):**
- **No auth**
- **No autoplay**
- **No subtitles**
- **Catalog driven by `library.yml`** (no filename regex parsing)
- **Direct Play MP4** (H.264/AAC) with **HTTP Range** support (seeking)
- **Docker-first** deployment (portability), targeting **macOS** for now
- **Episode list with thumbnails per season** (click season poster → episode list page)
- **Artwork lives with the videos** (assets stored under the media folder, not inside the app)

---

## 0) Repo & baseline decisions

- [x] Create repo `homeflix`
- [ ] Scaffold Next.js project (single service — see Decisions Log)
  - [ ] Next.js handles UI (pages) **and** API routes (`/api/*`)
  - [ ] No separate Express/Fastify server
- [ ] Implement config-caching layer:
  - [ ] Parse `library.yml` once at startup into an in-memory object
  - [ ] Expose the cached object to all API route handlers
  - [ ] Invalidate and re-parse automatically when `library.yml` changes on disk (`fs.watchFile`)
- [ ] Persist server state with a simple local store:
  - [ ] **JSON** file under `/data` (not needed in Iteration 1, but the directory exists for future use)
- [ ] Define environment variables:
  - [ ] `MEDIA_ROOT=/media`
  - [ ] `DATA_DIR=/data`
  - [ ] `LIBRARY_CONFIG=/data/library.yml`

---

## 1) Media & asset folder layout (source of truth)

### Media format requirement (minimal)
Because you need iPad support, standardize to:
- [x] **MP4 container**
- [x] **H.264 video**
- [x] **AAC audio**

(Done: media normalized per agreed parameters.)

### Folder layout (recommended)
Assets should be stored alongside the media under `MEDIA_ROOT`. The `file` path in `library.yml` is fully authoritative — the directory naming convention below is a guideline for humans, not something the server enforces or parses.

```
/media
  /The Big Bang Theory
    /assets
      poster.jpg
      backdrop.jpg
      /seasons
        s01.jpg
        s02.jpg
      /episodes
        s01e01.jpg
        s01e02.jpg
    /Season 01
      S01E01.mp4
      S01E02.mp4
    /Season 02
      ...
```

### Generating thumbnails
Thumbnails are not extracted automatically. Generate them manually (or via script) using `ffmpeg` before populating `library.yml`:

```bash
# Extract a single frame at the 5-second mark
ffmpeg -ss 00:00:05 -i "Season 01/S01E01.mp4" -frames:v 1 "assets/episodes/s01e01.jpg"
```

A helper script template can be added to `video-normalization/` alongside the existing normalization utility.

---

## 2) `library.yml` (catalog + artwork references)

Create a lightweight config file that defines collections, seasons, episodes, and each episode's title, video file path, and thumbnail path. All paths are relative to `MEDIA_ROOT`. The `file` path is the single source of truth for locating a video — the server does not infer or validate paths against directory naming conventions.

- [ ] Define schema (example):

```yml
collections:
  - id: tbbt
    type: series
    title: "The Big Bang Theory"
    poster: "The Big Bang Theory/assets/poster.jpg"
    backdrop: "The Big Bang Theory/assets/backdrop.jpg"
    seasons:
      - season: 1
        poster: "The Big Bang Theory/assets/seasons/s01.jpg"
        episodes:
          - ep: 1
            title: "Pilot"
            thumbnail: "The Big Bang Theory/assets/episodes/s01e01.jpg"
            file: "The Big Bang Theory/Season 01/S01E01.mp4"
          - ep: 2
            title: "The Big Bran Hypothesis"
            thumbnail: "The Big Bang Theory/assets/episodes/s01e02.jpg"
            file: "The Big Bang Theory/Season 01/S01E02.mp4"
```

- [ ] Add a validation step on server startup (runs against the in-memory parsed config):
  - [ ] All `id` fields are unique
  - [ ] All referenced video files exist under `MEDIA_ROOT` (resolved via `validatePath` — see Security below)
  - [ ] All paths pass the `validatePath` check (no traversal possible)
  - [ ] Warn (log, don't crash) if a thumbnail or poster file is missing — UI falls back to placeholder

- [ ] Config auto-reload:
  - [ ] Watch `library.yml` with `fs.watchFile`
  - [ ] On change: re-parse, re-validate, and replace the in-memory cache
  - [ ] Log the reload event (success or validation failure)
  - [ ] **No `POST /api/reload` endpoint** — file-watch handles this with zero attack surface

---

## 3) Shared security utility: `validatePath`

This is used by every endpoint that resolves a user-facing path to a file on disk. It is **not** an optional step — it is the single enforcement point for the "no traversal" rule.

```
function validatePath(userPath: string, root: string): string | null {
  1. URL-decode the input (if not already decoded by the framework)
  2. Resolve to absolute: path.resolve(root, userPath)
  3. Assert the result starts with path.resolve(root) + path.sep
  4. Return the resolved absolute path on success, null on failure
}
```

- [ ] Implement as a shared utility (e.g., `lib/validatePath.ts`)
- [ ] Call it in:
  - [ ] `/api/stream` — before opening the video file
  - [ ] `/api/asset` — before serving an image
  - [ ] Startup validation — when checking that all `file` and image paths in `library.yml` exist
- [ ] Return `403 Forbidden` if validation fails (not 400 — the path is syntactically valid but not permitted)

---

## 4) Docker-first scaffolding (core requirement)

- [ ] Add `Dockerfile` (multi-stage):
  - [ ] Stage 1: install deps, build Next.js (`next build`)
  - [ ] Stage 2: production image, run with `next start` (single process — no separate server entrypoint needed)
- [ ] Add `docker-compose.yml`:
  - [ ] `ports: ["3000:3000"]`
  - [ ] volumes:
    - [ ] Media (read-only): `/path/to/media:/media:ro`
    - [ ] Data (read-write): `./data:/data`
- [ ] Add `.dockerignore` and `.gitignore`
- [ ] Add a note in `README.md` for Windows media paths:
  - [ ] On Windows, use forward slashes in volume mounts: `C:/Users/you/Media:/media:ro`
  - [ ] Avoid paths with spaces where possible
  - [ ] For Iteration 1, the recommended setup is: run Docker on macOS, mount Windows media via SMB (`/Volumes/...:/media:ro`)
- [ ] Confirm: `docker compose up` starts the app and the home page loads

---

## 5) LAN-only access (no auth)

Iteration 1 approach: keep it practical.

- [ ] Run the service without port forwarding to the internet
- [ ] Optional: simple private-range allowlist middleware (best-effort):
  - [ ] Allow loopback + RFC 1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - [ ] Make it configurable: `LAN_ONLY=true/false` (default `true`)

---

## 6) Backend API (config-driven)

All route handlers read from the **in-memory config cache** (populated at startup, refreshed on file change). No handler reads `library.yml` from disk directly.

### Catalog
- [ ] `GET /api/library`
  - Returns the full parsed/validated config (or a sanitized view)
- [ ] `GET /api/collections`
  - List collections (id, title, type, artwork URLs)
- [ ] `GET /api/collections/:id`
  - Full collection details including seasons
- [ ] `GET /api/collections/:id/seasons/:season`
  - List episodes for that season including thumbnail paths

### Video streaming (critical)
- [ ] `GET /api/stream?collectionId=...&season=...&ep=...`
  - Looks up the video file path from the **in-memory config cache**
  - Runs the resolved path through `validatePath` before opening
  - Supports HTTP Range requests (see Section 7)
  - Returns `404` if the file is missing on disk, `400` if the episode is not in the config, `403` if `validatePath` fails

### Asset serving (posters & thumbnails)
- [ ] `GET /api/asset?path=...`
  - Serves posters/thumbnails referenced by `library.yml`
  - Runs the path through `validatePath` before opening (no traversal)
  - Sets correct `Content-Type` for `.jpg/.jpeg/.png/.webp`
  - Adds caching header: `Cache-Control: public, max-age=86400`
  - Returns `404` with a clear message if the file is missing (UI falls back to placeholder)

### Health
- [ ] `GET /api/health`
  - Returns structured JSON:
    ```json
    {
      "status": "ok",
      "configLoaded": true,
      "mediaRootAccessible": true,
      "collectionsCount": 1,
      "lastConfigLoadedAt": "2025-01-15T10:30:00Z"
    }
    ```
  - If config failed to load or media root is inaccessible, `status` is `"degraded"` and the relevant field is `false`. This makes debugging from a browser trivial.

---

## 7) Streaming implementation checklist (HTTP Range)

### For `/api/stream` (video)
- [ ] Parse `Range` header when present
- [ ] Respond with:
  - [ ] `206 Partial Content` for ranged requests
  - [ ] Correct `Content-Range: bytes start-end/total`
  - [ ] `Accept-Ranges: bytes`
  - [ ] Correct `Content-Length` (size of the partial chunk, not the full file)
- [ ] For non-ranged requests:
  - [ ] `200 OK` with full file stream
- [ ] Set `Content-Type` to `video/mp4` and **fail fast** if the file extension is not `.mp4` (Iteration 1)

### For `/api/asset` (images)
- [ ] Simple full-file streaming (no Range needed for small images)
- [ ] Determine `Content-Type` by file extension
- [ ] `404` with a clear message if missing — UI falls back to placeholders

---

## 8) Frontend (Next.js) — Netflix-like, minimal

### How images are referenced
Assets live under `/media` and are served through the asset endpoint. The frontend constructs URLs like:

- Poster: `/api/asset?path=<urlencoded path from library.yml>`
- Thumbnail: `/api/asset?path=<urlencoded path from library.yml>`

### Pages
- [ ] `/` — Home
  - [ ] Show collection row(s) fetched from `/api/collections`
  - [ ] Hero banner for the first collection (optional)
- [ ] `/c/:collectionId` — Collection details
  - [ ] Show **season posters** as selectable tiles
  - [ ] Clicking a season poster navigates to the season episode list
- [ ] `/c/:collectionId/s/:season` — Season episode list
  - [ ] List all episodes in the season
  - [ ] Each episode card includes:
    - [ ] Thumbnail (via `/api/asset`, with placeholder fallback)
    - [ ] Episode number + title
    - [ ] Play button (or click card to navigate to player)
- [ ] `/watch/:collectionId/:season/:ep` — Player page
  - [ ] HTML5 `<video>` element
  - [ ] Basic controls (play/pause, seek, volume, fullscreen)
  - [ ] Video `src` points to `/api/stream?collectionId=...&season=...&ep=...`

### UX basics
- [ ] Loading and error states (bad config, missing video, failed asset fetch)
- [ ] Responsive layout for iPad landscape and desktop
- [ ] Placeholder images when poster/thumbnail is missing or returns 404

---

## 9) Testing checklist (Iteration 1)

### Pre-playback: verify the stack works end-to-end
- [ ] `docker compose up` starts without errors
- [ ] Volumes mount correctly for `/media` and `/data`
- [ ] From **another device on the LAN**, curl (or browser-GET) `/api/health` — confirm `status: "ok"`, `configLoaded: true`, `mediaRootAccessible: true`
- [ ] From the same device, GET `/api/library` — confirm the parsed config is returned with correct collection, season, and episode data
- [ ] (These two steps catch networking, volume, and config issues *before* you're debugging video playback, which is much harder to reason about)

### Playback
- [ ] Seek works (verify Range requests are being sent and returning `206` — check browser DevTools Network tab)
- [ ] Playback works on:
  - [ ] iPad Pro (2021) — Safari
  - [ ] MacBook Pro — Chrome

### Config-driven catalog & assets
- [ ] `library.yml` loads and validates on startup (check server logs)
- [ ] Modifying `library.yml` triggers an automatic reload (check logs for reload event)
- [ ] Season poster click → season episode list loads correctly
- [ ] Episode list shows thumbnails (served via `/api/asset`) or placeholders where expected
- [ ] Paths that attempt traversal are rejected with `403`
- [ ] Missing video files produce clear UI errors (not a blank screen)

### Security
- [ ] `validatePath` rejects `../` attempts on both `/api/stream` and `/api/asset`
- [ ] `validatePath` rejects URL-encoded traversal attempts (`%2e%2e%2f`)
- [ ] Requesting an episode not in the config returns `400`

---

## 10) Release checklist (Iteration 1)

- [ ] Media normalized to MP4 (H.264/AAC) in your media folder
- [ ] Thumbnails generated via `ffmpeg` and placed under `/media/<Series>/assets/episodes/`
- [ ] Other artwork (posters, backdrops, season posters) placed under `/media/<Series>/assets/`
- [ ] `data/library.yml` created and validated (includes all thumbnail and artwork paths)
- [ ] `docker compose up -d` starts service cleanly
- [ ] Smoke test passes: `/api/health` returns `ok` from another LAN device
- [ ] Full flow works: Browse → select season poster → see episode list with thumbnails → play episode → seek works
- [ ] LAN-only (no public exposure confirmed — no port forwarding rules pointing at port 3000)
