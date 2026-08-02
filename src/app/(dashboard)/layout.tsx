import Sidebar from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <Sidebar />
      <main className="flex-1 lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
