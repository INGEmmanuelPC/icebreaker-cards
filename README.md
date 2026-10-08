# icebreaker-cards

A real-time multiplayer card game for icebreaker activities and team-building events.

## Getting started

```bash
git clone https://github.com/yourusername/icebreaker-cards.git
cd icebreaker-cards
npm install
npm run dev:server  # one terminal
npm run dev:client  # another terminal

The server runs on http://localhost:3001, the client on http://localhost:5173.

Project structure

This is a TypeScript monorepo with three workspaces:
- shared/ — types and Socket.IO event contract
- server/ — Node.js + Express + Socket.IO backend
- client/ — React + Vite frontend

License

MIT — see LICENSE