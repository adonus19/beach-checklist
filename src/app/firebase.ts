import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { firebaseConfig } from '../environments/firebase.config';

// `firebaseConfig` comes from src/environments/firebase.config.ts, which is
// gitignored locally and generated from a GitHub Actions secret in CI.
export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);

// Firestore with offline persistence (works across multiple open tabs) so the
// PWA keeps working without a connection and syncs back up when it returns.
export const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
