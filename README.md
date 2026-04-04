# Mission Deck

Hackathon Mission Control — real-time team dashboards, agent orchestration, and live terminal output in one place.

## Live URL

https://mission-deck-app.web.app

## Firebase Project

- **Project ID:** `mission-deck-app`
- **Console:** https://console.firebase.google.com/project/mission-deck-app
- **Auth Domain:** `mission-deck-app.firebaseapp.com`
- **Realtime Database:** `https://mission-deck-app-default-rtdb.firebaseio.com`
- **Hosting:** `mission-deck-app.web.app` / `mission-deck-app.firebaseapp.com`

## Setup

### Prerequisites

- Node.js
- Firebase CLI (`npm install -g firebase-tools`)

### Install dependencies

```bash
npm install
```

### Service Account (for admin scripts)

The `service-account.json` file is needed by the admin/reporter scripts (`scripts/agent-reporter.ts`, etc.) to write to the Realtime Database. To generate a new one:

1. Go to **Firebase Console > Project Settings > Service accounts**
   https://console.firebase.google.com/project/mission-deck-app/settings/serviceaccounts/adminsdk
2. Click **"Generate new private key"**
3. Save the downloaded file as `service-account.json` in the project root

> **Important:** This file is gitignored. Never commit it. Make sure the `project_id` is `mission-deck-app` (not `autonomous-agent-hack` or any other project).

### Firebase Authentication

Two sign-in providers are enabled: **Google** and **Email/Password**.

If setting up from scratch:

1. Go to **Firebase Console > Authentication > Sign-in method**
   https://console.firebase.google.com/project/mission-deck-app/authentication/providers
2. Enable **Google** — set support email to `john@johnpackercoaching.com`
3. Enable **Email/Password**
4. Click **Save**

Authorized domains (auto-configured): `localhost`, `mission-deck-app.firebaseapp.com`, `mission-deck-app.web.app`

### Test User

A test user exists for development and E2E testing. Credentials are stored in `.env.test.local` (gitignored).

To recreate the test user (if it gets deleted):

```bash
npx tsx scripts/create-test-user.ts
```

This writes credentials to `.env.test.local`. You can then sign in via the email/password form on the login page.

## Development

```bash
npm run dev          # Start dev server on port 5174
npm run build        # TypeScript check + Vite build
npm run preview      # Preview production build
npm run test         # Run Playwright tests
npm run report       # Run report CLI
npm run simulate     # Simulate agent activity
```

### E2E Testing

Playwright tests use the real test user for authentication. The auth setup (`e2e/auth.setup.ts`) reads credentials from `.env.test.local`, signs in via Firebase email/password, and saves the browser state so authenticated tests run without re-logging in each time.

```bash
npm run test         # Run all Playwright tests
```

## Firebase Config

The Firebase client config is in `src/config.ts`. Key values:

- `apiKey`: `AIzaSyAp7kqb4AJry_GkAXdZbMm_fjYogD3AMkg`
- `projectId`: `mission-deck-app`
- `databaseURL`: `https://mission-deck-app-default-rtdb.firebaseio.com`
- `authDomain`: `mission-deck-app.firebaseapp.com`

## Deployment

> **IMPORTANT:** Before deploying, always verify you're targeting the correct project. The Firebase CLI may default to a different project (e.g. `autonomous-agent-hack`) if you've used other projects recently.

```bash
# Check which project is active
firebase use

# If it's wrong, switch to the correct one
firebase use mission-deck-app

# Then deploy
firebase deploy --only hosting
```

You can also deploy in a single command:

```bash
firebase use mission-deck-app && firebase deploy --only hosting
```
