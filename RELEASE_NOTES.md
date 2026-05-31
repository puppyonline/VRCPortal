# VRChat Portal v1.0.0

A self-hosted, cross-platform application for exploring the VRChat API. Available as a desktop app (Windows/macOS) or a local web tool.

## Downloads

| Platform | File | Notes |
|----------|------|-------|
| Windows (Installer) | `VRChat-Portal-Setup-1.0.0.exe` | Installs with Start Menu shortcut, supports auto-update |
| Windows (Portable) | `VRChat-Portal-1.0.0.exe` | No install needed, runs from anywhere |
| macOS (Apple Silicon) | `VRChat-Portal-1.0.0-arm64.dmg` | For M1/M2/M3/M4 Macs |
| macOS (Intel) | `VRChat-Portal-1.0.0.dmg` | For Intel Macs |
| Web (self-hosted) | Clone the repo, run `npm install && npm run dev` | Runs in your browser at localhost |

## Highlights

- **25+ pages** covering nearly every VRChat API endpoint
- **200+ API methods** from the community-documented VRChat API
- **Cross-platform desktop app** with custom titlebar and auto-updates
- **Modern dark UI** with glassmorphism, glow effects, and responsive layout
- **Strictly read-only** — no write actions, no content uploads
- **VRChat guideline compliant** — proper User-Agent, rate limiting, caching, no credential storage

## Features

- **Dashboard** — Live player count, API status, server time, personalized stats (online friends, groups, unread notifications)
- **Profile** — Full profile with presence, platform history, past names, status history, Steam details, tags, permissions
- **Friends** — Paginated list (fetches all friends), clickable into user detail pages, 2-minute cache
- **Groups** — "My Groups" tab with search/filter, unread post indicators, group detail with friends-in-group view
- **Worlds** — Search, browse active/recent/favorited, detailed world view with active instances
- **Notifications** — V2 format with group links, image banners, event info
- **Favorites** — Resolves favorited worlds/avatars/friends into visual cards with images
- **Inventory** — Browse all item types with filtering, sorting, collections
- **Config** — Structured viewer with world/avatar info cards, feature flags, collapsible sections
- **Prints** — Photo gallery with responsive grid and click-to-expand lightbox
- **Status** — Real-time service status with component groups and incident timelines
- **User Detail** — Dedicated page with trust level, mutuals, bio, tags
- **And more** — Avatars, Instances, Economy, Files, Moderation, Props, Jams

## First Launch

1. Open the app (or run `npm run dev` for web mode)
2. Enter your contact email (required by VRChat's API guidelines for User-Agent identification)
3. Log in with your VRChat credentials
4. Browse your data

## Auto-Updates

The Windows installer and macOS .zip builds check for new releases on launch. The portable Windows .exe does not support auto-update.

## Important Notes

- **Local use only.** Do not deploy publicly or use to authenticate other people's accounts.
- **Unofficial.** VRChat does not support or endorse this tool. Their API may change without notice.
- **Use at your own risk.** You are responsible for complying with VRChat's Creator Guidelines.
- **Your credentials are never stored.** Session is cookie-based only.
- **macOS builds are untested.** Please [open an issue](https://github.com/puppyonline/VRCPortal/issues) if you encounter problems.

## VRChat API Compliance

- User-Agent identification (`VRChatPortal/1.0.0 your@email.com`) — enforced before any API call
- Rate limiting with exponential backoff on 429s
- Response caching for stable endpoints
- No automated polling or fixed-interval requests
- No content upload functionality (worlds, avatars, props disabled)
- No credential storage — passwords used once, session is VRChat's cookie
- Single-user, single-device operation

## Tech Stack

Vanilla JavaScript, Vite 5, Electron 33, zero runtime framework dependencies.

---

*Full documentation: [README](https://github.com/puppyonline/VRCPortal/blob/main/README.md)*
