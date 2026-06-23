# 🌅 Beach Trip Checklist

A beautiful, fast, installable checklist app to help the family pack everything for the beach — organized day-by-day from Monday night through Friday morning. Built with **Angular 22** (signals), styled with frosted **glass** cards over a **sunset** backdrop, and works **offline** as a PWA.

- ✅ Day-grouped packing plan with per-day and overall progress
- 💾 Checkmarks save to each device's **local storage** (no account, no backend)
- 📱 Installable to the home screen; works offline
- 🎨 "Ocean Sunset" dark glass theme

## Develop

```bash
npm install
cp src/environments/firebase.config.example.ts src/environments/firebase.config.ts
# paste your Firebase web config into firebase.config.ts (it is gitignored)
npm start          # http://localhost:4200
```

## Firebase config & secrets

The Firebase web config lives in `src/environments/firebase.config.ts`, which is
**gitignored** and never committed. Locally you create it from the example file.
In CI it is generated from a GitHub Actions secret.

> A Firebase **web** config (apiKey, appId, …) is **not a secret** — it ships in
> the public client bundle by design and cannot be hidden on a static site.
> Keeping it out of source is just hygiene. Your data is actually protected by:
> 1. **Firestore security rules** ([firestore.rules](firestore.rules)).
> 2. **API key restrictions** in Google Cloud Console → APIs & Services →
>    Credentials → your Browser key → *Application restrictions: HTTP referrers*,
>    allowing `https://adonus19.github.io/*` and `http://localhost:4200/*`.

To set the CI secret: repo **Settings → Secrets and variables → Actions → New
repository secret**, name `FIREBASE_CONFIG`, value = the config as one JSON
object:

```json
{ "apiKey": "…", "authDomain": "…", "projectId": "…", "storageBucket": "…", "messagingSenderId": "…", "appId": "…", "measurementId": "…" }
```

## Editing the list

The packing plan lives in [`src/app/data.ts`](src/app/data.ts). Add, remove, or reword
items there — ids are derived automatically, so existing checkmarks stay put as long as
the wording of an item doesn't change.

## Deploy (GitHub Pages)

Deployment is automated by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

**One-time setup:**

1. Create a **public** repo named `beach-checklist` at https://github.com/new (don't add any files).
2. Push this project to it:
   ```bash
   git remote add origin https://github.com/adonus19/beach-checklist.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.

After that, every push to `main` rebuilds and publishes automatically to:

**https://adonus19.github.io/beach-checklist/**

> If you rename the repo, update `--base-href=/<repo>/` in the workflow and the
> `build:pages` script.
