# Therapy Journal

A secure journal system for therapy built with Nuxt.js and Firebase.

## Setup

Make sure to install dependencies:

```bash
npm install
```

## Environment Variables

Copy the `.env.example` file to `.env` and fill in your Firebase configuration:

```bash
cp .env.example .env
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
npm run dev
```

## Production Build

Build the application for production:

```bash
npm run build
```

Locally preview production build:

```bash
npm run preview
```

## Firebase Deployment

### Current Static Site Deployment

Currently, we're using a static site deployment approach with a temporary landing page.

```bash
npm run build
firebase deploy --only hosting
```

### Full SSR Deployment (To Be Implemented)

For a full server-side rendered application deployment:

1. Configure firebase.json for SSR:
```json
{
  "hosting": {
    "public": ".output/public",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**/_nuxt/**",
        "destination": "/_nuxt/**"
      },
      {
        "source": "**",
        "function": "server"
      }
    ]
  },
  "functions": [
    {
      "source": ".output/server",
      "codebase": "default",
      "ignore": [
        "node_modules",
        ".git",
        "firebase-debug.log",
        "firebase-debug.*.log"
      ],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" install"
      ]
    }
  ],
  "storage": {
    "rules": "storage.rules"
  }
}
```

2. Create a proper Firebase Functions adapter for Nitro server
   - Create a `.output/server/server.mjs` file that adapts Nitro server to Firebase Functions
   - Configure Firebase Functions properly

3. Run a full deployment:
```bash
npm run build
firebase deploy
```

## CI/CD

This project includes a GitHub Actions workflow for automatic deployment to Firebase Hosting when code is pushed to the `main` branch. To use it:

1. Set up the following secrets in your GitHub repository:
   - All `NUXT_FIREBASE_*` environment variables
   - `FIREBASE_SERVICE_ACCOUNT` (JSON content from a Firebase service account)

2. Push to the main branch to trigger deployment.

## Resources and Documentation

- [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment)
- [Firebase Hosting documentation](https://firebase.google.com/docs/hosting)
- [Firebase Functions with Nuxt](https://firebase.google.com/docs/hosting/functions)
