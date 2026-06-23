// Template for the Firebase web config.
//
// 1. Copy this file to `firebase.config.ts` (same folder).
// 2. Paste your project's web config from the Firebase console
//    (Project settings → General → Your apps → SDK setup and configuration).
//
// `firebase.config.ts` is gitignored so it never lands in source control.
// In GitHub Actions it is generated from the `FIREBASE_CONFIG` repo secret
// (a JSON object) — see .github/workflows/deploy.yml and the README.
//
// Note: a Firebase *web* config is not a secret — it is shipped in the public
// client bundle by design. Data is protected by Firestore security rules and
// (recommended) API key restrictions in Google Cloud Console, not by hiding it.
export const firebaseConfig = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
} as const;
