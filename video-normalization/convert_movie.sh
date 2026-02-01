#!/usr/bin/env bash
set -euo pipefail

# Converts any video format to browser-compatible MP4 (H.264 + AAC stereo)
# Usage: ./convert_movie.sh /path/to/input.mkv [/path/to/output.mp4]
#
# Key settings:
# - H.264 video (libx264) - universal browser support
# - AAC stereo audio (-ac 2) - converts 5.1 AC3 to stereo AAC (browser-compatible)
# - faststart - enables streaming before full download

INPUT="${1:-}"
if [[ -z "${INPUT}" ]]; then
  echo "Usage: $0 input.mkv [output.mp4]"
  echo ""
  echo "Converts video to H.264 + AAC stereo for maximum browser compatibility."
  echo "If output path is not specified, creates output.mp4 in the same directory."
  exit 1
fi

if [[ ! -f "${INPUT}" ]]; then
  echo "Error: file not found: ${INPUT}"
  exit 1
fi

OUTPUT="${2:-${INPUT%.*}.mp4}"

# Avoid overwriting input if it's already mp4
if [[ "${INPUT}" == "${OUTPUT}" ]]; then
  OUTPUT="${INPUT%.*}_converted.mp4"
fi

echo "Input:  ${INPUT}"
echo "Output: ${OUTPUT}"
echo ""

ffmpeg -nostdin -y -hide_banner -stats \
  -i "${INPUT}" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -ac 2 -b:a 192k \
  -movflags +faststart \
  "${OUTPUT}"

echo ""
echo "Done: ${OUTPUT}"
