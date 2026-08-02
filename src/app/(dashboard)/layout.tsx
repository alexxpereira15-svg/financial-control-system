import Link from 'next/link'
import { LayoutDashboard, ArrowUpRight, ArrowDownRight, CreditCard, Target, LogOut, Wallet } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-xl flex flex-col justify-between p-5 hidden md:flex">
        <div className="space-y-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-wide">CashFlow</h2>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">Control System</p>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 transition"
            >
              <LayoutDashboard className="w-4 h-4" />
              Resumen
            </Link>
            <Link
              href="/incomes"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Ingresos
            </Link>
            <Link
              href="/expenses"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-400" />
              Gastos
            </Link>
            <Link
              href="/debts"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              Deudas (Avalanche)
            </Link>
            <Link
              href="/goals"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition"
            >
              <Target className="w-4 h-4 text-cyan-400" />
              Metas
            </Link>
          </nav>
        </div>

        {/* Footer Sidebar / Cerrar Sesión */}
        <div className="border-t border-slate-800/80 pt-4">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition">
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
