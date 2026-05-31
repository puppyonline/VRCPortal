# VRChat Portal

A comprehensive, self-hosted application for exploring and interacting with the VRChat API. Available as a cross-platform desktop app (Windows/macOS) or a web-based tool running locally in your browser.

> **⚠️ IMPORTANT: This application is intended for local, personal use only. Do not deploy this publicly or use it to authenticate other people's accounts. Use at your own risk.**

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Desktop App](#desktop-app)
- [Architecture](#architecture)
- [VRChat API Policy Compliance](#vrchat-api-policy-compliance)
- [Limitations & Risks](#limitations--risks)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

VRChat Portal provides a clean, modern interface for browsing data available through VRChat's API. It covers nearly every documented endpoint from the [VRChat Community API documentation](https://vrchat.community), including users, worlds, groups, avatars, instances, friends, favorites, economy, inventory, notifications, moderation, and more.

**Two ways to run it:**
- **Desktop app** — Download the installer for Windows or macOS. Double-click and go.
- **Web mode** — Clone the repo, `npm install`, `npm run dev`. Runs in your browser at localhost.

This is **not** an official VRChat product. VRChat does not officially document or support their API for public use. This project relies on community-maintained documentation and may break without notice.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JavaScript (no framework) |
| **Styling** | Custom CSS with design tokens, responsive grid system |
| **Build Tool** | [Vite 5](https://vitejs.dev/) |
| **Desktop** | [Electron 33](https://www.electronjs.org/) with auto-updater |
| **Fonts** | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| **API Proxy** | Vite dev server proxy (web mode) / Electron CORS bypass (desktop) |
| **Dependencies** | Zero runtime framework dependencies |

---

## Features

### Pages

| Page | Description |
|------|-------------|
| **Dashboard** | Live player count, API status, server time, build version, announcements |
| **Status** | Real-time service status from status.vrchat.com with incident timelines |
| **Config** | VRChat remote config viewer, User-Agent email settings |
| **Health** | API connectivity tests with latency measurements |
| **Login** | Direct authentication with VRChat (with full guideline disclaimers) |
| **Profile** | Complete profile — presence, platform history, past names, status history, Steam details, tags, permissions |
| **Users** | Search users, view profiles, mutual friends/groups counts |
| **Worlds** | Search, browse active/recent/favorited worlds, detailed world view with instances |
| **Groups** | Search groups, full detail with members, roles, posts, announcements, instances |
| **Avatars** | Search and browse avatars, view favorites |
| **Instances** | Look up instances by ID or short name, view recent locations |
| **Friends** | Online/offline lists, friend status lookup, boop sender |
| **Favorites** | Browse all favorites by type, groups, limits |
| **Notifications** | View and manage V1/V2 notifications with accept/read/clear actions |
| **Economy** | Balance, earnings, subscriptions, token bundles, purchases, store, licenses |
| **Inventory** | Browse all item types with filtering, sorting, collections, drops |
| **Files** | Browse uploaded files with version details |
| **Invites** | Send invites, self-invite, manage invite message templates |
| **Jams** | View world jams and submissions |
| **Calendar** | Featured, discover, followed, and searchable calendar events |
| **Moderation** | View and manage player moderations |
| **Prints** | Browse in-game camera photos |
| **Props** | Browse and view prop details |

### Technical Features

- **Cross-platform** — Windows installer, macOS DMG, or browser-based
- **Auto-updates** — Desktop app checks for new releases on launch
- **Custom titlebar** — Integrated window controls on Windows
- **Responsive design** — Works on desktop and mobile with collapsible sidebar
- **Rate limiting** — Exponential backoff on 429 responses
- **Response caching** — In-memory TTL cache for stable data
- **User-Agent compliance** — Configurable contact email, enforced before any API call
- **No credential storage** — Passwords never stored; session is cookie-based only
- **Content upload disabled** — World/avatar/prop creation endpoints blocked per guidelines

---

## Getting Started

### Option 1: Desktop App (Recommended)

Download the latest release from the [Releases page](https://github.com/puppyonline/VRCPortal/releases):

- **Windows**: Download the `.exe` installer or portable version
- **macOS**: Download the `.dmg` for your architecture (Intel or Apple Silicon)

### Option 2: Web Mode

```bash
git clone https://github.com/puppyonline/VRCPortal.git
cd VRCPortal
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies API requests to VRChat.

### First Launch

On first launch, you'll be prompted to enter a contact email. This is required by VRChat's Creator Guidelines — it's included in the `User-Agent` header of every API request. The email is stored in your browser's `localStorage` only. **The app will not function until this is configured.**

---

## Desktop App

### Windows

- **Installer** (`VRChat-Portal-Setup-x.x.x.exe`) — Installs to Program Files, creates Start Menu shortcut, supports auto-update
- **Portable** (`VRChat-Portal-x.x.x.exe`) — Runs from anywhere, no installation, no auto-update

### macOS

- **DMG** — Standard drag-to-Applications installer
- **ZIP** — Supports auto-update

### Auto-Updates

The installed versions automatically check GitHub Releases for updates on launch. When a new version is available, you'll be prompted to download and restart. Updates are downloaded in the background and applied on next app close or manual restart.

### Building Locally

```bash
npm run electron:start       # Build + launch Electron locally
npm run electron:build:win   # Package Windows installer
npm run electron:build:mac   # Package macOS DMG (requires macOS)
npm run electron:build       # Package both platforms
```

---

## Architecture

```
VRCPortal/
├── .github/workflows/      # CI: auto-build releases on tag push
├── electron/
│   ├── main.js             # Electron main process (CORS bypass, auto-updater, titlebar)
│   ├── preload.js          # Context bridge for renderer
│   └── icon.svg            # App icon source (converted to PNG during CI)
├── src/
│   ├── api.js              # VRChat API client (200+ methods, caching, rate limiting)
│   ├── main.js             # SPA router, auth state, setup screen, mobile sidebar
│   ├── styles.css          # Complete design system
│   └── pages/              # 25 page modules
├── index.html              # Shell HTML
├── vite.config.js          # Build config + API proxy
├── package.json            # Scripts, Electron config, build targets
└── RELEASE_NOTES.md        # Release description template
```

### How It Works

**Web mode:** Vite dev server proxies `/api/*` to `https://api.vrchat.cloud` (avoids CORS). The app runs entirely in the browser.

**Desktop mode:** Electron's main process intercepts requests to VRChat's API and strips CORS headers. No proxy needed — the app talks directly to VRChat. The `titleBarOverlay` provides native window controls with a custom draggable titlebar.

**Routing:** Hash-based SPA routing. Each page is an async function that renders HTML via template literals.

**Auth:** VRChat uses cookie-based sessions. Credentials are used for a single Basic auth request and immediately discarded. The session cookie is managed by the browser/Electron — the app never reads or stores it.

---

## VRChat API Policy Compliance

This project follows [VRChat's Creator Guidelines](https://hello.vrchat.com/creator-guidelines#api-usage):

| Guideline | Implementation |
|-----------|---------------|
| Don't be malicious | Read-only data viewer, no automation |
| No content upload | `createWorld`, `createAvatar`, `createProp`, file upload methods all disabled |
| No credential storage | Passwords used once, session is VRChat's cookie |
| No repeated/unmetered requests | Exponential backoff, TTL caching, no polling |
| Proper User-Agent | `VRChatPortal/1.0.0 your@email.com` — enforced before any API call |
| No acting on behalf of others | Single-user, local-only, your device and IP |

### On Authentication

VRChat's guidelines state: *"Do not request log-in information from users."* They also acknowledge this creates *"serious challenges"* since they don't offer OAuth. This tool is designed for personal, self-hosted use — you are authenticating your own account from your own device. Prominent warnings are displayed on the login page.

---

## Limitations & Risks

- **Unofficial API** — VRChat does not document or support their API. Endpoints may change without notice.
- **Account risk** — Abuse of the API may result in account termination. Use responsibly.
- **No official support** — Do not contact VRChat support about API issues.
- **Community-maintained** — Relies on [vrchat.community](https://vrchat.community) documentation (best-effort).
- **Local only** — Do not deploy publicly or authenticate other people's accounts.
- **macOS untested** — Built via CI but not manually verified. Report issues.

---

## Contributing

Contributions welcome for bug fixes, UI improvements, and documentation. Please:

1. Do not add features that violate VRChat's Creator Guidelines
2. Do not add content upload/creation functionality
3. Do not add automated polling or scheduled requests
4. Do not add features that facilitate multi-user deployment
5. Maintain rate limiting and caching mechanisms

---

## License

MIT

---

## Disclaimer

This project is not affiliated with, endorsed by, or associated with VRChat Inc. "VRChat" is a trademark of VRChat Inc. This is an independent, community-driven tool.

**By using this software, you acknowledge that:**
- You are using it at your own risk
- You are responsible for complying with VRChat's Creator Guidelines
- Your VRChat account may be subject to moderation if you misuse the API
- This software comes with no warranty of any kind
