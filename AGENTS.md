# Repository Guidelines

## Project Structure & Module Organization
- `plan.md` is the living development log: current status, recent work, and next steps.
- `README.md` provides the high-level overview.
- `video-normalization/` contains a standalone Bash utility for normalizing videos.
  - `video-normalization/video_normalizer.sh` is the script.
  - `video-normalization/README.md` describes the tool.

## Build, Test, and Development Commands
This repository does not define a build system or automated tests. The primary workflow is the video normalization script:

```bash
bash video-normalization/video_normalizer.sh /path/to/videos
```

This converts all `.avi` files under the input folder to normalized `.mp4` files in a sibling directory ending with `_normalized_mp4`.

## Coding Style & Naming Conventions
- Shell: `bash` with `set -euo pipefail` (see `video-normalization/video_normalizer.sh`).
- Indentation: 2 spaces for Bash blocks.
- Paths: prefer clear, descriptive directory names (e.g., `video-normalization/`).

## Testing Guidelines
- No test framework is currently present.
- If you add tests, document how to run them in this file and the root `README.md`.

## Commit & Pull Request Guidelines
- No Git commits exist yet, so there is no established commit message convention.
- Until a convention is chosen, use concise, imperative messages (e.g., `Add mp4 normalizer script`).
- Pull requests should include a brief description, reproduction steps (if relevant), and sample input/output paths for script changes.

## Security & Configuration Tips
- The normalizer depends on `ffmpeg`. Ensure it is installed and available on your `PATH`.
- The script writes output next to the input directory; verify available disk space before large runs.
