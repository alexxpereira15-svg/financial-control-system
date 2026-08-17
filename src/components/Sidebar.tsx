'use client'

import Link from 'next/link'
import { usePathname } from 'next/usePathname' // O usePathname de 'next/navigation'
import {
  LayoutDashboard,
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
  Target,
  BarChart3,
} from 'lucide-react'

const navLinks = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Ingresos', href: '/ingresos', icon: TrendingUp },
  { name: 'Gastos', href: '/gastos', icon: TrendingDown },
  { name: 'Cuentas', href: '/cuentas', icon: Wallet },
  { name: 'Deudas', href: '/deudas', icon: CreditCard },
  { name: 'Metas', href: '/metas', icon: Target },
  { name: 'Reportes', href: '/reportes', icon: BarChart3 },
]

export default function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navLinks.map((link) => {
        const isActive = pathname === link.href
        const Icon = link.icon

        return (
          <Link
            key={link.name}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{link.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}
