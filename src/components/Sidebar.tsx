'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  ArrowDownRight, 
  CreditCard, 
  Target, 
  LogOut, 
  Wallet 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  // src/components/Sidebar.tsx

const navItems = [
  { name: 'Resumen', href: '/dashboard', icon: LayoutDashboard, color: 'text-indigo-400' },
  { name: 'Ingresos', href: '/ingresos', icon: ArrowUpRight, color: 'text-emerald-400' },
  { name: 'Gastos', href: '/gastos', icon: ArrowDownRight, color: 'text-rose-400' },
  { name: 'Deudas', href: '/deudas', icon: CreditCard, color: 'text-amber-400' },
  { name: 'Metas', href: '/metas', icon: Target, color: 'text-cyan-400' },
]

  return (
    <aside className="w-64 fixed inset-y-0 left-0 bg-slate-900/90 border-r border-slate-800/80 backdrop-blur-xl flex flex-col justify-between p-5 z-50">
      <div className="space-y-8">
        {/* Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/30">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-white text-base tracking-wide">CashFlow</h2>
            <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Control System</p>
          </div>
        </div>

        {/* Links de Navegación */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/20 text-white border border-indigo-500/30 shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Logout */}
      <div className="border-t border-slate-800/80 pt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3.5 py-2.5 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
