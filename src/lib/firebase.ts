/**
 * Firebase — lecture seule pour app-rapports.
 * Utilisé uniquement pour synchroniser la liste du matériel depuis PMC v2.
 * L'auth anonyme permet de passer les règles Firestore sans compte utilisateur.
 */
import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const firestore = getFirestore(app)

/** Sign-in anonyme silencieux — appelé une fois au démarrage de l'app. */
export async function ensureAnonymousAuth(): Promise<void> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub()
      if (!user) {
        try {
          await signInAnonymously(auth)
        } catch (e) {
          console.warn('[Firebase] Auth anonyme échouée — sync matériel désactivée', e)
        }
      }
      resolve()
    })
  })
}
