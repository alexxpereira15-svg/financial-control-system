'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Target,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
} from 'lucide-react'

const navLinks = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ingresos', href: '/ingresos', icon: TrendingUp },
  { name: 'Gastos', href: '/gastos', icon: TrendingDown },
  { name: 'Transferencias', href: '/transferencias', icon: ArrowRightLeft },
  { name: 'Cuentas', href: '/accounts', icon: Wallet },
  { name: 'Deudas', href: '/deudas', icon: CreditCard },
  { name: 'Metas', href: '/metas', icon: Target },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={`relative min-h-screen bg-purple-950/90 border-r border-purple-900/60 p-4 transition-all duration-300 flex flex-col justify-between z-30 shrink-0 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Botón para comprimir / expandir */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 bg-purple-800 hover:bg-purple-700 text-purple-100 p-1 rounded-full border border-purple-600 shadow-md transition-colors z-40"
        title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex items-center gap-3 px-2 py-1 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center shrink-0">
            <span className="text-purple-300 font-bold text-base">C</span>
          </div>

          {!collapsed && (
            <div className="truncate">
              <h2 className="text-base font-bold text-purple-50 tracking-tight leading-tight">
                Cashflow Control
              </h2>
              <p className="text-[11px] text-purple-300/70 font-medium">Sistema Financiero</p>
            </div>
          )}
        </div>

        {/* Navegación */}
        <nav className="space-y-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            const Icon = link.icon

            return (
              <Link
                key={link.name}
                href={link.href}
                title={collapsed ? link.name : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600/80 text-white shadow-lg shadow-purple-900/50 border border-purple-500/40 font-semibold'
                    : 'text-purple-200/70 hover:text-white hover:bg-purple-900/50'
                } ${collapsed ? 'justify-center px-0' : ''}`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-purple-300'}`} />
                {!collapsed && <span className="truncate">{link.name}</span>}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Pie del Sidebar */}
      {!collapsed && (
        <div className="p-3 bg-purple-900/30 border border-purple-800/40 rounded-xl text-center text-xs text-purple-300/60">
          v1.0.0
        </div>
      )}
    </aside>
  )
}
