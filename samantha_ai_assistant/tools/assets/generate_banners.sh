#!/bin/bash
# generate_banners.sh - Generate browser store banners from master PNG/SVG
# Requires: ImageMagick (convert)

set -e

MASTER_BANNER="banner-master.png"
OUTDIR="./banners"

if [ ! -f "$MASTER_BANNER" ]; then
  echo "Master banner ($MASTER_BANNER) not found! Place banner-master.png in this directory."
  exit 1
fi

mkdir -p $OUTDIR/chrome $OUTDIR/firefox $OUTDIR/edge $OUTDIR/safari

# Chrome
convert $MASTER_BANNER -resize 440x280 $OUTDIR/chrome/banner-440x280.png

# Firefox
convert $MASTER_BANNER -resize 1400x560 $OUTDIR/firefox/banner-1400x560.png

# Edge
convert $MASTER_BANNER -resize 920x680 $OUTDIR/edge/banner-920x680.png

# Safari
convert $MASTER_BANNER -resize 1920x1080 $OUTDIR/safari/banner-1920x1080.png

echo "Banners generated in $OUTDIR/ (per store)"
