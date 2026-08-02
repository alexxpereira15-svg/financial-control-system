// src/app/(dashboard)/layout.tsx
import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen p-6 lg:p-10">
        {children}
      </main>
    </div>
  )
}
