#!/bin/bash
# generate_icons.sh - Generate browser store icons from master SVG/PNG
# Requires: ImageMagick (convert)

set -e

MASTER_ICON="icon-master.png"
OUTDIR="./icons"

if [ ! -f "$MASTER_ICON" ]; then
  echo "Master icon ($MASTER_ICON) not found! Place icon-master.png in this directory."
  exit 1
fi

mkdir -p $OUTDIR/chrome $OUTDIR/firefox $OUTDIR/edge $OUTDIR/safari

# Chrome
convert $MASTER_ICON -resize 128x128 $OUTDIR/chrome/icon-128.png
convert $MASTER_ICON -resize 48x48 $OUTDIR/chrome/icon-48.png
convert $MASTER_ICON -resize 16x16 $OUTDIR/chrome/icon-16.png

# Firefox
convert $MASTER_ICON -resize 96x96 $OUTDIR/firefox/icon-96.png
convert $MASTER_ICON -resize 48x48 $OUTDIR/firefox/icon-48.png

# Edge
convert $MASTER_ICON -resize 300x300 $OUTDIR/edge/icon-300.png
convert $MASTER_ICON -resize 128x128 $OUTDIR/edge/icon-128.png
convert $MASTER_ICON -resize 48x48 $OUTDIR/edge/icon-48.png
convert $MASTER_ICON -resize 16x16 $OUTDIR/edge/icon-16.png

# Safari
convert $MASTER_ICON -resize 1024x1024 $OUTDIR/safari/icon-1024.png
convert $MASTER_ICON -resize 512x512 $OUTDIR/safari/icon-512.png
convert $MASTER_ICON -resize 256x256 $OUTDIR/safari/icon-256.png
convert $MASTER_ICON -resize 128x128 $OUTDIR/safari/icon-128.png

echo "Icons generated in $OUTDIR/ (per store)"
