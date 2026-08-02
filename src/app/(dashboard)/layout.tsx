'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import { useRouter } from 'next/navigation'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    {
      name: 'Resumen',
      href: '/dashboard',
      icon: LayoutDashboard,
      color: 'text-indigo-400',
    },
    {
      name: 'Ingresos',
      href: '/incomes',
      icon: ArrowUpRight,
      color: 'text-emerald-400',
    },
    {
      name: 'Gastos',
      href: '/expenses',
      icon: ArrowDownRight,
      color: 'text-rose-400',
    },
    {
      name: 'Deudas (Avalanche)',
      href: '/debts',
      icon: CreditCard,
      color: 'text-amber-400',
    },
    {
      name: 'Metas',
      href: '/goals',
      icon: Target,
      color: 'text-cyan-400',
    },
  ]

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col justify-between p-5 flex-shrink-0">
        <div className="space-y-8">
          {/* Logo / Branding */}
          <div className="flex items-center gap-3 px-2">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/30">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-wide">CashFlow</h2>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Control System</p>
            </div>
          </div>

          {/* Menú de Navegación Interactivo */}
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

        {/* Botón de Cerrar Sesión */}
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

      {/* ÁREA PRINCIPAL CON SCROLL */}
      <main className="flex-1 overflow-y-auto bg-slate-950 p-6 lg:p-10">
        {children}
      </main>
    </div>
  )
}
