import { NavLink, Outlet } from 'react-router'
import { ClipboardList, Plus, Settings, Droplet } from 'lucide-react'
import { cn } from '../lib/cn'

const navItems = [
  { to: '/', label: 'Interventions', icon: ClipboardList, end: true },
  { to: '/nouvelle', label: 'Nouvelle', icon: Plus, end: false },
  { to: '/parametres', label: 'Paramètres', icon: Settings, end: false },
]

export default function Layout() {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-slate-200 md:bg-white">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-200">
          <div className="grid place-items-center w-9 h-9 rounded-lg bg-brand-600 text-white">
            <Droplet className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Labocea</div>
            <div className="text-xs text-slate-500">Rapports terrain</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-700 hover:bg-slate-100',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 text-xs text-slate-500 border-t border-slate-200">
          Mode hors-ligne actif
        </div>
      </aside>

      {/* Header mobile (avec safe-area iOS notch) */}
      <header
        className="md:hidden flex items-end justify-between px-4 pb-3 bg-white border-b border-slate-200 sticky top-0 z-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', minHeight: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >
        <div className="flex items-center gap-2">
          <div className="grid place-items-center w-8 h-8 rounded-lg bg-brand-600 text-white">
            <Droplet className="w-4 h-4" />
          </div>
          <div className="text-sm font-semibold">Labocea</div>
        </div>
        <span className="text-xs text-slate-500">Hors-ligne ✓</span>
      </header>

      {/* Contenu principal */}
      <main
        className="flex-1 md:overflow-y-auto"
        style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </main>

      {/* Bottom nav mobile (avec safe-area iOS/Android) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 grid grid-cols-3 z-10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium min-h-[60px] transition active:bg-slate-50',
                isActive ? 'text-brand-700' : 'text-slate-600',
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
