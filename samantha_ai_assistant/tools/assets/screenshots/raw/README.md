# Screenshot Guidelines for Browser Store Submissions

Place your raw screenshots in this directory. The `generate_screenshots.sh` script will automatically resize them for all browser stores.

---

## Required Screenshots

### Minimum Requirements
- **Chrome/Edge:** 2-5 screenshots
- **Firefox:** 1-5 screenshots
- **Safari:** 1-5 screenshots

### Recommended Screenshots
1. **Main Interface** - Voice orb and settings panel
2. **Voice Command Demo** - Show voice recognition in action
3. **Settings Panel** - Theme switcher and preferences
4. **Command History** - Display of recent commands
5. **Cross-browser Demo** - Working on different browsers

---

## Screenshot Guidelines

### Technical Requirements
- **Resolution:** 1920x1080 or higher (will be resized)
- **Format:** PNG or JPG
- **Browser:** Use latest Chrome/Firefox/Safari/Edge
- **OS:** macOS, Windows, or Linux (specify in filename)

### Content Guidelines
- **Show real UI** - No mockups or placeholders
- **Highlight key features** - Voice orb, settings, commands
- **Avoid sensitive data** - No personal info, emails, passwords
- **Use realistic scenarios** - Common use cases
- **Include browser chrome** - Show it's a browser extension

### Visual Guidelines
- **Clean background** - No cluttered desktops
- **Good lighting** - Clear, well-lit screenshots
- **Consistent styling** - Same theme across all screenshots
- **Professional appearance** - High-quality, polished look

---

## File Naming Convention

Use descriptive names that indicate the feature shown:

```
screenshot-main-interface.png
screenshot-voice-command.png
screenshot-settings-panel.png
screenshot-command-history.png
screenshot-cross-browser.png
```

Or with browser/OS specification:

```
screenshot-main-interface-chrome-macos.png
screenshot-voice-command-firefox-windows.png
screenshot-settings-panel-safari-macos.png
```

---

## Taking Screenshots

### macOS
```bash
# Full screen
Cmd + Shift + 3

# Selected area
Cmd + Shift + 4

# Window
Cmd + Shift + 4, then Space
```

### Windows
```bash
# Full screen
Win + PrtScn

# Selected area
Win + Shift + S
```

### Linux
```bash
# Using gnome-screenshot
gnome-screenshot -a

# Using flameshot
flameshot gui
```

---

## Example Screenshots to Take

1. **Main Interface** - Extension popup with voice orb visible
2. **Voice Activation** - Voice orb pulsing/active state
3. **Command Recognition** - Text showing recognized command
4. **Settings Panel** - Theme switcher and preferences open
5. **Command History** - List of recent voice commands
6. **Cross-browser** - Same feature working in different browsers
7. **Error Handling** - Graceful error message display
8. **Performance** - Analytics dashboard or performance metrics

---

## Quality Checklist

- [ ] High resolution (1920x1080+)
- [ ] Clear, focused content
- [ ] No sensitive information
- [ ] Professional appearance
- [ ] Consistent styling
- [ ] Descriptive filename
- [ ] Shows key features
- [ ] Real UI (not mockups)
- [ ] Good contrast/readability
- [ ] Browser chrome visible

---

_Place your screenshots in this directory, then run `../generate_screenshots.sh` to create store-ready versions._
