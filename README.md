# World Cup 2026 Sweepstakes Dashboard

A small React + Vite dashboard for a World Cup 2026 sweepstakes pool. Pulls
live data from the [football-data.org](https://www.football-data.org) free tier.

## Features

- **Leaderboard** — ranks pool participants by points scored from their drawn teams.
- **Matches** — full fixture list with live/finished scores.
- **Standings** — group tables straight from the API.

## Setup

1. Register for a free token: https://www.football-data.org/client/register
2. Copy the env file and paste your token:
   ```bash
   cp .env.example .env
   # edit .env and set FOOTBALL_DATA_TOKEN
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open the printed localhost URL.

## Configure your pool

Edit `src/sweepstake.js` to set the participants and the teams each one drew.
Team names must match the API's `name` field exactly (see the spelling in the
Matches/Standings tabs). Adjust `SCORING` there to change points per win/draw/goal.

## Notes

- The free tier allows **10 requests/minute**. API calls are cached in-memory
  per session (`src/api.js`), so a page reload re-fetches but tab switching does not.
- The token is injected by the Vite dev proxy (`vite.config.js`) and never ships
  to the browser bundle. For a real deployment you'd put a tiny serverless
  function or backend in front of the API instead of the dev proxy.
- Competition code is `WC` (FIFA World Cup).
