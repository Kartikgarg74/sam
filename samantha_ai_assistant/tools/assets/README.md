# Browser Store Asset Generation & Guidelines

This directory contains scripts, templates, and documentation for generating and optimizing browser extension store assets for Chrome, Firefox, Edge, and Safari.

---

## 1. Store Asset Requirements

### Chrome Web Store
- **Icons:** 128x128, 48x48, 16x16 PNG (transparent)
- **Screenshots:** 1280x800 or 640x400 PNG/JPG (min 2, max 5)
- **Promotional Banner:** 440x280 PNG/JPG (optional)
- **Video:** YouTube link (optional, 30–90 seconds, 720p+)

### Firefox Add-ons
- **Icons:** 96x96, 48x48 PNG (transparent)
- **Screenshots:** 1280x800 or 640x400 PNG/JPG (min 1, max 5)
- **Promotional Banner:** 1400x560 PNG/JPG (optional)
- **Video:** YouTube/Vimeo link (optional)

### Edge Add-ons
- **Icons:** 300x300, 128x128, 48x48, 16x16 PNG
- **Screenshots:** 1280x800 or 640x400 PNG/JPG (min 1, max 5)
- **Promotional Banner:** 920x680 PNG/JPG (optional)
- **Video:** YouTube link (optional)

### Safari Extensions
- **Icons:** 1024x1024, 512x512, 256x256, 128x128 PNG
- **Screenshots:** 1280x800 or 886x680 PNG/JPG (min 1, max 5)
- **Promotional Banner:** 1920x1080 PNG/JPG (optional)
- **Video:** App Store Connect upload (optional)

---

## 2. Asset Generation Scripts

- `generate_icons.sh`: Generate all required icon sizes from a master SVG/PNG.
- `generate_screenshots.sh`: Crop/resize screenshots and add device frames.
- `generate_banners.sh`: Export banners from a design file (Figma API or similar).

---

## 3. Quality Guidelines

- **Icons:** Simple, recognizable, no text, transparent background, sharp at all sizes.
- **Screenshots:** Show real UI, highlight key features, avoid sensitive data, use latest browser versions.
- **Banners:** Brand colors, clear value proposition, minimal text, high contrast.
- **Videos:** Clear narration/captions, show real usage, 30–90 seconds, no background music unless subtle.

---

## 4. Localization

- Prepare all text (descriptions, banners, video captions) for translation.
- Use i18n files or Google Sheets for managing translations.
- Screenshots and banners: avoid embedded text, or create localized variants.

---

## 5. A/B Testing Variants

- Prepare at least 2 variants for:
  - Icons (color vs. monochrome, flat vs. gradient)
  - Banners (different taglines, color schemes)
  - Screenshots (feature order, highlight style)
- Use store dashboards (Chrome, Edge) or custom analytics to track performance.

---

## 6. Usage

1. Place your master icon as `icon-master.svg` or `icon-master.png` in this directory.
2. Run `./generate_icons.sh` to create all required icon sizes.
3. Place raw screenshots in `screenshots/raw/` and run `./generate_screenshots.sh`.
4. Place banner designs in `banners/source/` and run `./generate_banners.sh`.
5. Review all assets for quality and compliance before uploading to stores.

---

_Last updated: 2025-07-26_
