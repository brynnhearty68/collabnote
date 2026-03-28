<div align="center">

# CollabNote

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222?style=flat&logo=github&logoColor=white)](https://alfredang.github.io/collabnote/)

**Real-time collaborative note-taking — no account required.**

[Live Demo](https://alfredang.github.io/collabnote/) · [Report Bug](https://github.com/alfredang/collabnote/issues) · [Request Feature](https://github.com/alfredang/collabnote/issues)

</div>

## Screenshot

![CollabNote Screenshot](screenshot.png)

## About

CollabNote is a lightweight, real-time collaborative note-taking app with a clean, modern interface. Create notes, share rooms via QR code or link, and collaborate with others instantly — all from the browser with zero sign-up.

### Key Features

- **Real-time Collaboration** — Create a room and invite others with a 6-digit code, QR code, or shareable link
- **Live Sync** — Notes sync instantly across all connected users via Firebase Realtime Database
- **Dark / Light Theme** — Toggle between themes with persistent preference
- **Presence Indicators** — See how many collaborators are currently online
- **Search** — Filter notes instantly by title or content
- **Responsive** — Works on desktop and mobile with a collapsible sidebar
- **No Account Required** — Just pick a nickname and start collaborating

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (no build step) |
| **Real-time Sync** | Firebase Realtime Database (v9 compat SDK) |
| **QR Generation** | QRCode.js |
| **Icons** | Lucide Icons |
| **Typography** | Inter (Google Fonts) |
| **Deployment** | GitHub Pages via GitHub Actions |

## Architecture

```
┌─────────────────────────────────────────────┐
│                  Browser                     │
│                                              │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  │
│  │ index.html│  │ style.css │  │ script.js│  │
│  │  (UI)    │  │ (Themes)  │  │  (App)   │  │
│  └──────────┘  └───────────┘  └────┬─────┘  │
│                                    │         │
│                              ┌─────┴─────┐   │
│                              │  sync.js   │   │
│                              │ (Firebase) │   │
│                              └─────┬─────┘   │
└────────────────────────────────────┼─────────┘
                                     │
                          ┌──────────┴──────────┐
                          │  Firebase Realtime   │
                          │     Database         │
                          │                      │
                          │  /collabnote/{code}  │
                          │   ├── notes          │
                          │   └── presence       │
                          └─────────────────────┘
```

## Project Structure

```
collabnote/
├── .github/
│   └── workflows/
│       └── deploy-pages.yml    # GitHub Pages CI/CD
├── index.html                  # Main HTML (UI layout, modals)
├── style.css                   # Styles (dark/light themes, responsive)
├── script.js                   # App logic (CollabNoteApp class)
├── sync.js                     # Firebase sync engine (rooms, presence)
├── screenshot.png              # App screenshot for README
└── .nojekyll                   # Bypass Jekyll on GitHub Pages
```

## Getting Started

### Prerequisites

- Any modern web browser
- A static file server for local development (Python, Node, etc.)

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/alfredang/collabnote.git
   cd collabnote
   ```

2. **Serve locally** (any static server works):
   ```bash
   python3 -m http.server 3000
   ```

3. **Open** `http://localhost:3000`

### Firebase Configuration

To enable live sync with your own Firebase project, replace the placeholder value in `sync.js` with your Firebase API key:

```js
const FIREBASE_CONFIG = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    // ...rest of config
};
```

> For production deployment via GitHub Actions, the API key is injected from the `FIREBASE_API_KEY` GitHub secret.

## Collaboration

1. Click the **Users** icon in the sidebar footer
2. Enter a nickname and click **Create Room**
3. Share the 6-digit code, QR code, or link with collaborators
4. Others join by entering the code or scanning the QR

## Deployment

This project deploys automatically to **GitHub Pages** on every push to `main` via GitHub Actions.

The workflow:
1. Checks out the code
2. Injects the Firebase API key from GitHub Secrets
3. Uploads and deploys to GitHub Pages

To set up your own deployment, add a `FIREBASE_API_KEY` secret in your repo's **Settings → Secrets and variables → Actions**.

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License.

---

<div align="center">

Developed by **[Tertiary Infotech Academy Pte Ltd](https://www.tertiaryinfotech.com/)**

If you found this useful, please consider giving it a ⭐

</div>
