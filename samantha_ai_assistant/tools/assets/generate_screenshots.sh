#!/bin/bash
# generate_screenshots.sh - Crop/resize screenshots for browser stores
# Requires: ImageMagick (convert)

set -e

RAW_DIR="./screenshots/raw"
OUTDIR="./screenshots"

if [ ! -d "$RAW_DIR" ]; then
  echo "Raw screenshots directory ($RAW_DIR) not found!"
  exit 1
fi

mkdir -p $OUTDIR/chrome $OUTDIR/firefox $OUTDIR/edge $OUTDIR/safari

for img in $RAW_DIR/*.{png,jpg,jpeg}; do
  [ -e "$img" ] || continue
  base=$(basename "$img")
  # Chrome/Edge/Firefox: 1280x800, 640x400
  convert "$img" -resize 1280x800^ -gravity center -extent 1280x800 $OUTDIR/chrome/$base
  convert "$img" -resize 640x400^ -gravity center -extent 640x400 $OUTDIR/chrome/${base%.*}-small.${base##*.}
  convert "$img" -resize 1280x800^ -gravity center -extent 1280x800 $OUTDIR/firefox/$base
  convert "$img" -resize 640x400^ -gravity center -extent 640x400 $OUTDIR/firefox/${base%.*}-small.${base##*.}
  convert "$img" -resize 1280x800^ -gravity center -extent 1280x800 $OUTDIR/edge/$base
  convert "$img" -resize 640x400^ -gravity center -extent 640x400 $OUTDIR/edge/${base%.*}-small.${base##*.}
  # Safari: 1280x800, 886x680
  convert "$img" -resize 1280x800^ -gravity center -extent 1280x800 $OUTDIR/safari/$base
  convert "$img" -resize 886x680^ -gravity center -extent 886x680 $OUTDIR/safari/${base%.*}-small.${base##*.}
  echo "Processed $img"
done

echo "Screenshots generated in $OUTDIR/ (per store)"
