'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Wallet,        // Icono para Cuentas
  CreditCard,    // Icono para Deudas
  TrendingDown,  // Icono para Gastos
  TrendingUp,    // Icono para Ingresos
  Target,        // Icono para Metas
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ingresos', href: '/incomes', icon: TrendingUp },
  { name: 'Gastos', href: '/expenses', icon: TrendingDown },
  { name: 'Cuentas', href: '/accounts', icon: Wallet },       // <- Nueva pestaña Cuentas
  { name: 'Deudas', href: '/debts', icon: CreditCard },        // <- Nueva pestaña Deudas
  { name: 'Metas', href: '/goals', icon: Target },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-3 py-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Financial Control</h2>
          <p className="text-xs text-gray-400">Control de Finanzas</p>
        </div>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
