import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'
import { ensureAnonymousAuth } from './lib/firebase'
import { syncEquipements } from './db/equipements'

// Auth anonyme + sync matériel en arrière-plan (non bloquant)
if (navigator.onLine) {
  ensureAnonymousAuth().then(() => syncEquipements()).catch(() => {/* silencieux */})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
