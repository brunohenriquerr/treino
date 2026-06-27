'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Dumbbell, BarChart2, ClipboardList, LogOut, User } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/', label: 'Treinos', icon: Dumbbell },
  { href: '/sessao', label: 'Sessões', icon: ClipboardList },
  { href: '/stats', label: 'Evolução', icon: BarChart2 },
]

export default function Navbar() {
  const path = usePathname()
  const router = useRouter()

  function getUser() {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('treino_user')
  }

  function logout() {
    localStorage.removeItem('treino_user')
    router.push('/login')
  }

  const user = typeof window !== 'undefined' ? getUser() : null

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <Dumbbell className="text-green-600" size={22} />
          <span className="font-semibold text-gray-900 text-sm">Meus Treinos</span>
        </div>
        <nav className="flex items-center gap-1">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                path === href
                  ? 'bg-green-50 text-green-700 font-medium'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <User size={13} />
                <span className="hidden sm:inline">{user}</span>
              </div>
              <button onClick={logout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Sair">
                <LogOut size={14} />
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  )
}
