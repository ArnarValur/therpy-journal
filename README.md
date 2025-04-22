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

## Firebase Deployment

### Firebase App Hosting (Recommended)

This project uses Firebase App Hosting with 2nd generation Firebase Functions for server-side rendering.

1. Preview locally:
   ```bash
   npm run build:firebase
   npm run preview:firebase
   ```

2. Deploy to Firebase:
   ```bash
   npm run deploy
   ```

This will build the Nuxt app with the Firebase preset and deploy both the server functions and hosting.

### Deployment Options

- `npm run deploy` - Deploy both hosting and server function
- `npm run deploy:hosting` - Deploy only hosting
- `npm run deploy:functions` - Deploy only the server function
- `npm run deploy:all` - Deploy everything (hosting, functions, and storage rules)

### Requirements

- Firebase Blaze plan (Pay as you go)
- Node.js 20
- Firebase project with App Hosting enabled

## CI/CD

This project includes a GitHub Actions workflow for automatic deployment to Firebase Hosting when code is pushed to the `main` branch. To use it:

1. Set up the following secrets in your GitHub repository:
   - All `NUXT_FIREBASE_*` environment variables
   - `FIREBASE_TOKEN` (generated with `firebase login:ci`)

2. Push to the main branch to trigger deployment.

## Resources and Documentation

- [Nuxt deployment documentation](https://nuxt.com/docs/getting-started/deployment)
- [Firebase App Hosting with Nuxt](https://nuxt.com/deploy/firebase)
- [Firebase Functions documentation](https://firebase.google.com/docs/functions)
