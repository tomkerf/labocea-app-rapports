import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App'
import { ensureAnonymousAuth } from './lib/firebase'
import { syncEquipements } from './db/equipements'
import { syncTuyaux } from './db/tuyaux'
import { syncClients } from './db/clients'
import { syncTechniciens } from './db/techniciens'

// Auth anonyme + sync données de référence en arrière-plan (non bloquant)
if (navigator.onLine) {
  ensureAnonymousAuth()
    .then(() => Promise.all([syncEquipements(), syncTuyaux(), syncClients(), syncTechniciens()]))
    .catch(() => {/* silencieux */})
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
