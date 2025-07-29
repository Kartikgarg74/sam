# Localization Guide for Browser Store Assets

This directory contains localization files and guidelines for translating store assets across different languages and regions.

---

## Supported Languages

### Primary Languages
- **English (en)** - Default
- **Spanish (es)** - Latin America, Spain
- **French (fr)** - France, Canada
- **German (de)** - Germany, Austria, Switzerland
- **Portuguese (pt)** - Brazil, Portugal
- **Italian (it)** - Italy
- **Japanese (ja)** - Japan
- **Korean (ko)** - South Korea
- **Chinese Simplified (zh-CN)** - China
- **Chinese Traditional (zh-TW)** - Taiwan, Hong Kong

### Secondary Languages
- **Russian (ru)** - Russia, CIS
- **Arabic (ar)** - Middle East
- **Hindi (hi)** - India
- **Dutch (nl)** - Netherlands
- **Swedish (sv)** - Sweden
- **Norwegian (no)** - Norway
- **Danish (da)** - Denmark

---

## File Structure

```
localization/
├── translations/
│   ├── en.json          # English (base)
│   ├── es.json          # Spanish
│   ├── fr.json          # French
│   ├── de.json          # German
│   ├── pt.json          # Portuguese
│   ├── it.json          # Italian
│   ├── ja.json          # Japanese
│   ├── ko.json          # Korean
│   ├── zh-CN.json       # Chinese Simplified
│   ├── zh-TW.json       # Chinese Traditional
│   └── ...
├── assets/
│   ├── banners/
│   │   ├── en/          # English banners
│   │   ├── es/          # Spanish banners
│   │   └── ...
│   └── screenshots/
│       ├── en/          # English screenshots
│       ├── es/          # Spanish screenshots
│       └── ...
└── scripts/
    ├── translate.sh      # Translation script
    └── generate-assets.sh # Asset generation script
```

---

## Translation Keys

### Store Descriptions
```json
{
  "store": {
    "title": "Samantha AI - Voice Assistant",
    "short_description": "AI-powered voice commands for your browser",
    "long_description": "Samantha AI transforms your browsing experience with natural voice commands. Control your browser, navigate websites, and get instant AI-powered responses.",
    "features": [
      "Natural voice recognition",
      "AI-powered responses",
      "Cross-browser support",
      "Privacy-focused design"
    ]
  }
}
```

### Banner Text
```json
{
  "banners": {
    "main_title": "Samantha AI",
    "subtitle": "Voice-Powered Browser Assistant",
    "features": [
      "Natural voice commands",
      "AI-powered responses",
      "Cross-browser support"
    ],
    "cta": "Try Now"
  }
}
```

### Screenshot Captions
```json
{
  "screenshots": {
    "main_interface": "Main interface with voice orb",
    "voice_command": "Voice command recognition",
    "settings_panel": "Settings and preferences",
    "command_history": "Command history and analytics"
  }
}
```

---

## Translation Guidelines

### General Principles
- **Keep it concise** - Store descriptions have character limits
- **Use active voice** - "Control your browser" not "Browser can be controlled"
- **Be culturally appropriate** - Avoid idioms that don't translate well
- **Maintain brand voice** - Professional but approachable
- **Test with native speakers** - Always have translations reviewed

### Character Limits
- **Chrome Web Store:** 132 characters (short), 4,000 characters (long)
- **Firefox Add-ons:** 135 characters (summary), 5,000 characters (description)
- **Edge Add-ons:** 132 characters (short), 4,000 characters (long)
- **Safari Extensions:** 255 characters (description)

### Technical Requirements
- **Use UTF-8 encoding** for all translation files
- **Escape special characters** properly in JSON
- **Test rendering** in different browsers/fonts
- **Validate translations** with native speakers

---

## A/B Testing Variants

### Banner Variants
Create multiple versions for testing:

```json
{
  "banner_variants": {
    "variant_a": {
      "title": "Samantha AI",
      "subtitle": "Voice-Powered Browser Assistant",
      "cta": "Try Now"
    },
    "variant_b": {
      "title": "Samantha AI",
      "subtitle": "Your AI Browser Companion",
      "cta": "Get Started"
    },
    "variant_c": {
      "title": "Samantha AI",
      "subtitle": "Smart Voice Commands",
      "cta": "Install Free"
    }
  }
}
```

### Icon Variants
- **Color vs. Monochrome** - Test different icon styles
- **Flat vs. Gradient** - Test visual appeal
- **Simple vs. Detailed** - Test recognition at small sizes

### Screenshot Variants
- **Feature order** - Different highlighting approaches
- **Text overlay** - With/without explanatory text
- **Context** - Different browser/OS combinations

---

## Translation Process

### 1. Initial Translation
```bash
# Use Google Translate API or similar
./scripts/translate.sh en es fr de
```

### 2. Native Speaker Review
- Have translations reviewed by native speakers
- Focus on cultural appropriateness
- Check for technical accuracy

### 3. Asset Generation
```bash
# Generate localized assets
./scripts/generate-assets.sh
```

### 4. Quality Assurance
- Test rendering in different browsers
- Verify character limits
- Check for text overflow
- Validate file formats

---

## Store-Specific Requirements

### Chrome Web Store
- **Localization:** Automatic based on user's locale
- **Required:** English only (others optional)
- **Recommended:** Spanish, French, German, Portuguese

### Firefox Add-ons
- **Localization:** Manual language selection
- **Required:** English only
- **Recommended:** All major European languages

### Edge Add-ons
- **Localization:** Automatic based on Windows locale
- **Required:** English only
- **Recommended:** Same as Chrome

### Safari Extensions
- **Localization:** App Store Connect localization
- **Required:** English only
- **Recommended:** Major App Store languages

---

## Testing Checklist

- [ ] All translations complete
- [ ] Character limits respected
- [ ] Cultural appropriateness verified
- [ ] Technical accuracy confirmed
- [ ] Asset generation successful
- [ ] Rendering tested across browsers
- [ ] A/B variants created
- [ ] Quality assurance passed

---

_Use the scripts in this directory to automate translation and asset generation processes._
