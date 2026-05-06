import { Routes, Route, Navigate } from 'react-router'
import Layout from './components/Layout'
import InterventionsList from './pages/InterventionsList'
import InterventionForm from './pages/InterventionForm'
import NewIntervention from './pages/NewIntervention'
import Settings from './pages/Settings'
import RapportGenerator from './pages/RapportGenerator'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<InterventionsList />} />
        <Route path="nouvelle" element={<NewIntervention />} />
        <Route path="intervention/:id" element={<InterventionForm />} />
        <Route path="rapport" element={<RapportGenerator />} />
        <Route path="parametres" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
