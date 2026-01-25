# HomeFlix — Implementation Checklist (Iteration 1)

Goal: a **LAN-only** web app with a clean, Netflix-like UI that streams your **locally owned** media.  
Initial library: **The Big Bang Theory (S1–S10)**.

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

- [ ] Create repo `homeflix`
- [ ] Choose stack (Option A, single service):
  - [ ] Next.js (UI)
  - [ ] Node server (Express or Fastify) for API + streaming
- [ ] Persist server state with a simple local store (pick one):
  - [ ] **JSON** file under `/data` (simplest)
  - [ ] SQLite under `/data` (slightly more setup, easier future growth)
- [ ] Define environment variables:
  - [ ] `MEDIA_ROOT=/media`
  - [ ] `DATA_DIR=/data`
  - [ ] `LIBRARY_CONFIG=/data/library.yml`

---

## 1) Media & asset folder layout (source of truth)

### Media format requirement (minimal)
Because you need iPad support, standardize to:
- [ ] **MP4 container**
- [ ] **H.264 video**
- [ ] **AAC audio**

(Conversion workflow is out-of-scope for Iteration 1, but you should normalize your AVI/MKV beforehand.)

### Folder layout (recommended)
Assets should be stored alongside the media under `MEDIA_ROOT`:

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

---

## 2) `library.yml` (catalog + artwork references)

Create a lightweight config file that defines:
- collections (series/movies)
- seasons
- episodes
- each episode’s title, video file path (relative to `MEDIA_ROOT`), and **thumbnail path** (also relative to `MEDIA_ROOT`)

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

- [ ] Add a validation step on server startup:
  - [ ] All `id` fields unique
  - [ ] All referenced video files exist under `MEDIA_ROOT`
  - [ ] Reject paths that attempt traversal (`..`)
  - [ ] (Optional) Warn if a thumbnail/poster is missing; UI falls back to placeholder

- [ ] Add an optional “reload config” endpoint:
  - [ ] `POST /api/reload` (LAN-only; no auth)

---

## 3) Docker-first scaffolding (core requirement)

- [ ] Add `Dockerfile` (multi-stage):
  - [ ] Build Next.js
  - [ ] Run custom Node server entrypoint
- [ ] Add `docker-compose.yml`:
  - [ ] `ports: ["3000:3000"]`
  - [ ] volumes:
    - [ ] Media (read-only): `/path/to/media:/media:ro`
    - [ ] Data (read-write): `./data:/data`
- [ ] Add `.dockerignore` and `.gitignore`
- [ ] Confirm: `docker compose up` starts the app and the home page loads

---

## 4) LAN-only access (no auth)

Iteration 1 approach: keep it practical.

- [ ] Run the service without port forwarding to the internet
- [ ] Optional: simple private-range allowlist middleware (best-effort):
  - [ ] allow loopback + RFC1918 ranges
  - [ ] make it configurable: `LAN_ONLY=true/false`

---

## 5) Backend API (config-driven)

### Catalog
- [ ] `GET /api/library`
  - returns the full parsed/validated `library.yml` (or a sanitized view)
- [ ] `GET /api/collections`
  - list collections (id, title, type, artwork)
- [ ] `GET /api/collections/:id`
  - full collection details (incl. seasons)
- [ ] `GET /api/collections/:id/seasons/:season`
  - list episodes for that season (incl. thumbnails)

### Video streaming (critical)
- [ ] `GET /api/stream?collectionId=...&season=...&ep=...`
  - resolves to video file path from config
  - **supports HTTP Range** requests
  - returns `404` if missing, `400` if not in config, `403` if path invalid

### Asset serving (NEW: posters & thumbnails live under /media)
- [ ] `GET /api/asset?path=...`
  - serves posters/thumbnails referenced by `library.yml`
  - validates `path` stays under `MEDIA_ROOT` (no traversal)
  - sets correct `Content-Type` for `.jpg/.jpeg/.png/.webp`
  - (Optional) adds caching: `Cache-Control: public, max-age=86400`

### Health
- [ ] `GET /api/health`
  - confirms server up, config loaded, media root accessible

---

## 6) Streaming implementation checklist (HTTP Range)

### For `/api/stream` (video)
- [ ] Parse `Range` header when present
- [ ] Respond with:
  - [ ] `206 Partial Content` for ranged requests
  - [ ] correct `Content-Range`
  - [ ] `Accept-Ranges: bytes`
  - [ ] correct `Content-Length`
- [ ] For non-ranged requests:
  - [ ] `200 OK` with full file stream
- [ ] Set `Content-Type` to `video/mp4` and **fail fast** if not `.mp4` (Iteration 1)

### For `/api/asset` (images)
- [ ] Simple full-file streaming is fine (no Range needed)
- [ ] Determine `Content-Type` by extension
- [ ] 404 with a clear message if missing (UI should fall back to placeholders)

---

## 7) Frontend (Next.js) — Netflix-like, minimal

### How images are referenced
Because assets live in `/media`, the frontend should render images using the asset endpoint, e.g.:

- poster URL: `/api/asset?path=<urlencoded path from library.yml>`
- thumbnail URL: `/api/asset?path=<urlencoded path from library.yml>`

### Pages
- [ ] `/` Home
  - [ ] show collection(s) row(s) from API
  - [ ] hero banner for first collection (optional)
- [ ] `/c/:collectionId` Collection details
  - [ ] show **season posters** as selectable tiles
  - [ ] clicking a season poster navigates to the season episode list
- [ ] `/c/:collectionId/s/:season` **Season episode list**
  - [ ] list all episodes in the season
  - [ ] each episode row/card includes:
    - [ ] thumbnail (via `/api/asset`)
    - [ ] episode number + title
    - [ ] play button (or click card to play)
- [ ] `/watch/:collectionId/:season/:ep` Player page
  - [ ] HTML5 `<video>` element
  - [ ] basic controls (play/pause, seek, volume, fullscreen)
  - [ ] video source points to `/api/stream?...`

### UX basics
- [ ] Loading and error states (bad config, missing video)
- [ ] Responsive layout for iPad landscape and desktop
- [ ] Placeholder images when poster/thumbnail missing

---

## 8) Testing checklist (Iteration 1)

### Playback
- [ ] Seek works (Range requests verified)
- [ ] Playback works on:
  - [ ] iPad Pro (2021)
  - [ ] Macbook Pro (Chrome)

### Config-driven catalog + assets-with-media
- [ ] `library.yml` loads and validates
- [ ] Season poster click → season episode list loads
- [ ] Episode list shows thumbnails (served via `/api/asset`) or placeholders
- [ ] Incorrect paths are rejected
- [ ] Missing files produce clear UI errors

### Docker
- [ ] `docker compose up` works
- [ ] Volumes mount correctly for `/media` + `/data`
- [ ] App accessible from another device on the LAN

---

## 9) Release checklist (Iteration 1)

- [ ] Media normalized to MP4 (H.264/AAC) in your media folder
- [ ] Artwork placed under `/media/<Series>/assets/...`
- [ ] `data/library.yml` created and validated (includes thumbnail paths)
- [ ] `docker compose up -d` starts service
- [ ] Browse → select season poster → see episode list with thumbnails → play episode
- [ ] LAN-only (no public exposure)

---
