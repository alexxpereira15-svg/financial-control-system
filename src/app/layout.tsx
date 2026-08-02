// src/app/layout.tsx
import './globals.css' // <-- AQUÍ SE IMPORTA TAILWIND PARA TODO EL PROYECTO

export const metadata = {
  title: 'Financial Control System',
  description: 'Control financiero personal y gestión de deudas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
