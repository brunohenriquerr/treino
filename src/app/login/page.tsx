'use client'
import { useRouter } from 'next/navigation'
import { Dumbbell } from 'lucide-react'

const profiles = [
  {
    name: 'Bruno',
    full: 'Bruno Henrique',
    initials: 'BH',
    color: 'bg-blue-500',
    hover: 'hover:border-blue-400 hover:bg-blue-50',
    ring: 'group-hover:ring-blue-200',
    label: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
  },
  {
    name: 'Thainara',
    full: 'Thainara',
    initials: 'TH',
    color: 'bg-pink-500',
    hover: 'hover:border-pink-400 hover:bg-pink-50',
    ring: 'group-hover:ring-pink-200',
    label: 'text-pink-700',
    badge: 'bg-pink-100 text-pink-800',
  },
]

export default function LoginPage() {
  const router = useRouter()

  function entrar(name: string) {
    localStorage.setItem('treino_user', name)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Meus Treinos</h1>
          <p className="text-sm text-gray-500 mt-1">Quem vai treinar hoje?</p>
        </div>

        <div className="space-y-3">
          {profiles.map((p) => (
            <button
              key={p.name}
              onClick={() => entrar(p.name)}
              className={`group w-full bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 transition-all ${p.hover} shadow-sm hover:shadow-md`}
            >
              <div className={`w-14 h-14 rounded-xl ${p.color} flex items-center justify-center text-white font-semibold text-lg ring-4 ring-transparent transition-all ${p.ring} flex-shrink-0`}>
                {p.initials}
              </div>
              <div className="text-left">
                <p className={`font-semibold text-base ${p.label}`}>{p.full}</p>
                <p className="text-xs text-gray-400 mt-0.5">Ver meus treinos</p>
              </div>
              <div className="ml-auto">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.badge}`}>
                  Entrar
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Cada perfil tem seus próprios treinos e histórico
        </p>
      </div>
    </div>
  )
}
