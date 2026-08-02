'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Target,
  FileText,
  LogOut,
  Menu,
  X,
  Wallet,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ingresos', href: '/ingresos', icon: TrendingUp },
  { name: 'Gastos', href: '/gastos', icon: TrendingDown },
  { name: 'Deudas', href: '/deudas', icon: CreditCard },
  { name: 'Metas', href: '/metas', icon: Target },
  { name: 'Historial y Corte', href: '/reportes', icon: FileText },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const NavContent = () => (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 w-64 p-4 text-gray-200">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-4 mb-4 border-b border-gray-800">
        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-bold text-sm text-gray-100 tracking-wide">Financial Control</h2>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Sistema V1</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-gray-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout Footer */}
      <div className="border-t border-gray-800 pt-4 mt-auto">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Botón menú flotante para móvil */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 bg-gray-900 border border-gray-800 text-gray-200 rounded-xl shadow-lg focus:outline-none"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Drawer Móvil */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-50">
            <NavContent />
          </div>
        </div>
      )}

      {/* Sidebar fijo para Desktop */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <NavContent />
      </aside>
    </>
  )
}