# Samantha AI Web Management Interface

This is the Next.js 14 web interface for managing, monitoring, and configuring your Samantha AI assistant.

## Features
- **Dashboard:** Real-time system status, usage analytics, performance metrics, quick actions
- **Command Management:** Command history timeline, analytics, success metrics, CSV export
- **Workflow Builder:** Visual drag-and-drop workflow creation, template import, step reordering
- **Settings Management:** Voice, service/API keys, user preferences, security settings (with real forms and API)
- **PWA Support:** Installable, offline-ready, mobile-friendly
- **Accessibility:** Keyboard navigation, ARIA labels, color contrast
- **Dark/Light Mode:** Theme switching and customization
- **Responsive Design:** Mobile and desktop friendly

## Architecture
- **Next.js 14** (App Router, TypeScript, Tailwind CSS)
- **API Routes:** `/api/system-status`, `/api/command-analytics`, `/api/workflow-templates`, `/api/settings`
- **Drag-and-Drop:** Powered by `@dnd-kit/core` and `@dnd-kit/sortable`
- **PWA:** Manifest, theme color, apple-touch-icon

## Setup
```sh
cd samantha-ai-assistant/apps/web
pnpm install
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Feature Checklist
- [x] Dashboard with real-time data (API-driven)
- [x] Command analytics with CSV export
- [x] Visual workflow builder with drag-and-drop
- [x] Workflow template import
- [x] Settings management (voice, service, user, security)
- [x] PWA support (manifest, installable)
- [x] Accessibility (keyboard, ARIA, color contrast)
- [x] Dark/light mode
- [x] Responsive/mobile design

## Integration Points
- Connect API routes to your backend for live data
- Extend workflow builder to execute real automations
- Secure API key and settings storage for production

## Accessibility & PWA
- All forms and buttons are keyboard accessible
- ARIA labels and roles are used where appropriate
- Color contrast meets WCAG standards
- App is installable and works offline (with service worker)

---

_Last updated: 2025_
