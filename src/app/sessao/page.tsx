'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { ChevronRight, Trash2, ClipboardList } from 'lucide-react'

interface SessaoDisplay {
  id: string
  data_sessao: string
  observacoes: string | null
  treinos: { nome: string; usuario: string }
  total_exercicios: number
}

export default function SessoesPage() {
  const { user, loading: authLoading } = useAuth()
  const [sessoes, setSessoes] = useState<SessaoDisplay[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!user) return
    const { data } = await supabase
      .from('sessoes')
      .select('id, data_sessao, observacoes, treinos(nome, usuario)')
      .order('data_sessao', { ascending: false })
      .limit(60)

    if (data) {
      const filtered = data.filter((s: any) => s.treinos?.usuario === user)
      const ids = filtered.map((s: any) => s.id)
      const { data: regs } = await supabase.from('registros').select('sessao_id, exercicio_id').in('sessao_id', ids.length ? ids : ['x'])
      const countMap: Record<string, Set<string>> = {}
      regs?.forEach((r: any) => {
        if (!countMap[r.sessao_id]) countMap[r.sessao_id] = new Set()
        countMap[r.sessao_id].add(r.exercicio_id)
      })
      setSessoes(filtered.map((s: any) => ({ ...s, total_exercicios: countMap[s.id]?.size || 0 })))
    }
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  async function deletar(id: string) {
    if (!confirm('Remover esta sessão?')) return
    await supabase.from('sessoes').delete().eq('id', id)
    load()
  }

  function formatData(d: string) {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  function diaSemana(d: string) {
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const [y, m, day] = d.split('-').map(Number)
    return dias[new Date(y, m - 1, day).getDay()]
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Histórico de {user}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{sessoes.length} sessão{sessoes.length !== 1 ? 'ões' : ''} registrada{sessoes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : sessoes.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">Nenhuma sessão ainda. Inicie um treino!</p>
            <Link href="/" className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm inline-flex">Ir para treinos</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessoes.map(s => (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-green-50 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs text-green-600 font-medium">{diaSemana(s.data_sessao)}</span>
                  <span className="text-lg font-bold text-green-700 leading-none">{s.data_sessao.split('-')[2]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{(s.treinos as any)?.nome || '—'}</span>
                    <span className="text-xs text-gray-400">{formatData(s.data_sessao)}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{s.total_exercicios} exercício{s.total_exercicios !== 1 ? 's' : ''}</span>
                    {s.observacoes && <span className="text-xs text-gray-400 truncate">"{s.observacoes}"</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/sessao/${s.id}`} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <ChevronRight size={16} />
                  </Link>
                  <button onClick={() => deletar(s.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
