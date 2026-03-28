# CollabNote

A real-time collaborative note-taking app with a clean, modern interface. Create notes, share rooms via QR code or link, and collaborate with others in real time.

## Features

- **Real-time Collaboration** — Create a room and invite others with a 6-digit code, QR code, or shareable link
- **Live Sync** — Notes sync instantly across all connected users via Firebase Realtime Database
- **Dark / Light Theme** — Toggle between themes with persistent preference
- **Presence Indicators** — See how many collaborators are online
- **Search** — Filter notes instantly by title or content
- **Responsive** — Works on desktop and mobile with a collapsible sidebar
- **No Account Required** — Just pick a nickname and start collaborating

## Tech Stack

- Vanilla HTML, CSS, JavaScript (no build step)
- Firebase Realtime Database for sync
- QRCode.js for QR generation
- Lucide Icons
- Inter font

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/alfredang/note-taking.git
   cd note-taking
   ```

2. Serve locally (any static server works):
   ```bash
   python3 -m http.server 3000
   ```

3. Open `http://localhost:3000`

## Collaboration

1. Click the **Users** icon in the sidebar footer
2. Enter a nickname and click **Create Room**
3. Share the 6-digit code, QR code, or link with collaborators
4. Others join by entering the code or scanning the QR

## License

MIT
