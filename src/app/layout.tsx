import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meus Treinos',
  description: 'Acompanhamento de treinos e evolução de carga',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 min-h-screen antialiased">{children}</body>
    </html>
  )
}
