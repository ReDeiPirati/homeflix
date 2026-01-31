#!/bin/bash
set -euo pipefail

# Generate assets (posters, backdrops, thumbnails) for a media collection
# Requires: ffmpeg, ImageMagick (magick)
#
# Usage: ./generate_assets.sh /path/to/media/folder "Show Title"
#
# Expected input structure:
#   media_folder/
#     Season 01/
#       episode files...
#
# Output structure:
#   media_folder/
#     assets/
#       poster.jpg
#       backdrop.jpg
#       season1/
#         poster.jpg
#         episodes/
#           e01.jpg, e02.jpg, ...

MEDIA_DIR="${1:?Usage: $0 /path/to/media/folder \"Show Title\"}"
SHOW_TITLE="${2:-Media Collection}"

# Validate input
if [[ ! -d "$MEDIA_DIR" ]]; then
  echo "Error: Directory not found: $MEDIA_DIR"
  exit 1
fi

echo "Generating assets for: $SHOW_TITLE"
echo "Media directory: $MEDIA_DIR"

# Create assets directory structure
mkdir -p "$MEDIA_DIR/assets/season1/episodes"

# Generate collection poster (400x600)
echo "Creating collection poster..."
magick -size 400x600 \
  -define gradient:angle=135 \
  gradient:'#1a1a2e-#16213e' \
  -font Helvetica-Bold -pointsize 28 -fill white -gravity center \
  -draw "text 0,0 '${SHOW_TITLE}'" \
  "$MEDIA_DIR/assets/poster.jpg"

# Generate backdrop (1280x720)
echo "Creating backdrop..."
magick -size 1280x720 \
  -define gradient:angle=90 \
  gradient:'#0f0c29-#302b63-#24243e' \
  -font Helvetica-Bold -pointsize 48 -fill white -gravity center \
  -draw "text 0,0 '${SHOW_TITLE}'" \
  "$MEDIA_DIR/assets/backdrop.jpg"

# Generate season 1 poster (400x600)
echo "Creating season 1 poster..."
magick -size 400x600 \
  -define gradient:angle=135 \
  gradient:'#1a1a2e-#0f3460' \
  -font Helvetica-Bold -pointsize 24 -fill white -gravity center \
  -draw "text 0,-50 '${SHOW_TITLE}'" \
  -pointsize 36 \
  -draw "text 0,100 'SEASON 1'" \
  "$MEDIA_DIR/assets/season1/poster.jpg"

# Generate episode thumbnails from video files
echo "Generating episode thumbnails..."
SEASON_DIR="$MEDIA_DIR/Season 01"

if [[ -d "$SEASON_DIR" ]]; then
  for video in "$SEASON_DIR"/*.mp4; do
    [[ -f "$video" ]] || continue

    # Extract episode number from filename (assumes format like "1x01" or "S01E01")
    filename=$(basename "$video")
    if [[ "$filename" =~ [0-9]x([0-9]+) ]]; then
      ep_num="${BASH_REMATCH[1]}"
    elif [[ "$filename" =~ [Ss]01[Ee]([0-9]+) ]]; then
      ep_num="${BASH_REMATCH[1]}"
    else
      echo "  Skipping (no episode number found): $filename"
      continue
    fi

    output="$MEDIA_DIR/assets/season1/episodes/e${ep_num}.jpg"
    echo "  Episode $ep_num: $filename"
    ffmpeg -y -ss 00:05:00 -i "$video" -vframes 1 -vf "scale=320:180" -q:v 2 "$output" 2>/dev/null
  done
else
  echo "Warning: Season 01 directory not found at $SEASON_DIR"
fi

echo ""
echo "Assets generated in: $MEDIA_DIR/assets/"
ls -la "$MEDIA_DIR/assets/"
