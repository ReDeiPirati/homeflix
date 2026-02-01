#!/usr/bin/env bash
set -euo pipefail

BTT_DIR="${1:-}"
if [[ -z "${BTT_DIR}" ]]; then
  echo "Usage: $0 /path/to/BTT"
  exit 1
fi
if [[ ! -d "${BTT_DIR}" ]]; then
  echo "Error: folder not found: ${BTT_DIR}"
  exit 1
fi

OUT_DIR="${BTT_DIR%/}_normalized_mp4"
mkdir -p "${OUT_DIR}"

echo "Input : ${BTT_DIR}"
echo "Output: ${OUT_DIR}"
echo

# Use -print0 to handle weird characters safely
while IFS= read -r -d '' in; do
  rel="${in#${BTT_DIR%/}/}"
  rel_noext="${rel%.*}"
  out="${OUT_DIR}/${rel_noext}.mp4"

  mkdir -p "$(dirname "${out}")"

  # Skip if output exists and is newer than input
  if [[ -f "${out}" && "${out}" -nt "${in}" ]]; then
    echo "SKIP (up-to-date): ${rel}"
    continue
  fi

  echo "CONVERT: ${rel}"

  ffmpeg -nostdin -y -hide_banner -stats \
    -i "${in}" \
    -c:v libx264 -preset slow -crf 17 -tune film -pix_fmt yuv420p \
    -profile:v main -level 3.1 \
    -c:a aac -b:a 160k \
    -movflags +faststart \
    "${out}"

  echo "  -> ${out#${OUT_DIR}/}"
  echo
done < <(find "${BTT_DIR}" -type f \( -iname "*.avi" -o -iname "*.mkv" \) -print0)

echo "Done. Normalized files are in: ${OUT_DIR}"
