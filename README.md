# 🎬 DhakaFlix Modern Streamer (ISP FTP Portal)

A modern, ultra-fast, minimalist streaming portal designed for the **DhakaFlix ISP FTP Server (`http://172.16.50.4/`)**.

---

## ✨ Features

- **Modern & Minimal UI**: Dark-themed Netflix / Plex style interface with clean poster cards, fluid typography, and zero clutter.
- **Full Server Exploration**:
  - Full access to all nodes across `172.16.50.7`, `172.16.50.14`, `172.16.50.12`, `172.16.50.10`, `172.16.50.8`, and more.
  - Interactive breadcrumbs trail to jump to any parent directory.
  - Deep folder navigation (browse into seasons, years, collections, or individual files).
  - "Jump to URL" address bar to paste and open any FTP / HTTP directory directly.
- **Instant In-Browser Video Player**:
  - Click **"Instant Play"** on any card or file to play immediately inside the browser.
  - Full playback controls: Seek bar, Volume, Speed selector (0.5x – 2.0x), Fullscreen, Picture-in-Picture.
  - Keyboard shortcuts: `Space` (Play/Pause), `F` (Fullscreen), `M` (Mute), `←` / `→` (Seek ±10s).
  - Subtitle track selector + Custom `.srt` / `.vtt` file drag & drop loader.
  - Episode playlist drawer for TV shows.
- **Play in VLC Media Player**:
  - **1-Click .M3U Download**: Downloads a `.m3u` stream playlist file that directly opens in VLC on Windows, Mac, or Linux!
  - **Direct VLC Protocol**: Launches `vlc://` application directly on compatible systems.
  - **VLC for Android**: Tap "Play in VLC" on mobile to stream inside the official VLC for Android app.
  - **Copy Stream URL**: 1-click clipboard copy to paste into VLC (`Ctrl + N` -> Open Network Stream).
- **100% Responsive on All Devices**:
  - Perfect fluid layout on mobile phones, tablets, laptops, and large 4K / TV screens.
  - Touch-friendly controls with bottom navigation bar on mobile.
  - No horizontal scrolling or oversized elements.
- **Ultra-Fast & Smart Caching**:
  - In-memory caching for zero-delay instant back/forward navigation.
  - Auto-resolves movie posters (`a_AL_.jpg`), backdrop banners, and primary video files.
  - Range proxy with HTTP 206 Partial Content support for smooth seeking.

---

## 🚀 How to Run

### Method 1: One-Click (Windows)
Double-click **`start.bat`**.  
It will automatically launch the server and open `http://localhost:3000` in your default browser.

### Method 2: Command Line
```bash
npm start
# or
node server.js
```
Then visit: [http://localhost:3000](http://localhost:3000)

### Method 3: Stream on Phone / Tablet / Smart TV
Connect your phone/tablet/TV to the same local WiFi / ISP network and open:
```
http://<YOUR_COMPUTER_LOCAL_IP>:3000
```
(e.g., `http://192.168.0.105:3000`)
