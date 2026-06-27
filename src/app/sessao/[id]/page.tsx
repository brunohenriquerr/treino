'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Dumbbell } from 'lucide-react'

export default function SessaoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [sessao, setSessao] = useState<any>(null)
  const [grupos, setGrupos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('sessoes').select('*, treinos(nome, descricao)').eq('id', id).single()
      if (s) setSessao(s)
      const { data: regs } = await supabase.from('registros').select('*, exercicios(nome, series, repeticoes)').eq('sessao_id', id).order('criado_em')
      if (regs) {
        const map: Record<string, any> = {}
        regs.forEach((r: any) => {
          if (!map[r.exercicio_id]) map[r.exercicio_id] = { ex: r.exercicios, series: [] }
          map[r.exercicio_id].series.push(r)
        })
        setGrupos(Object.values(map))
      }
      setLoading(false)
    }
    load()
  }, [id])

  function formatData(d: string) {
    const [y, m, day] = d.split('-')
    return `${day}/${m}/${y}`
  }

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-16 text-gray-400">Carregando...</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/sessao" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{sessao?.treinos?.nome}</h1>
            <p className="text-sm text-gray-400">{sessao?.data_sessao && formatData(sessao.data_sessao)}</p>
          </div>
        </div>

        {sessao?.observacoes && (
          <div className="card p-4 mb-4 bg-brand-50 border-brand-100">
            <p className="text-sm text-brand-700">"{sessao.observacoes}"</p>
          </div>
        )}

        <div className="space-y-4">
          {grupos.map((g, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Dumbbell size={15} className="text-brand-500" />
                <h3 className="font-medium text-sm text-gray-900">{g.ex.nome}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="text-left pb-2 font-medium">Série</th>
                      <th className="text-center pb-2 font-medium">Carga (kg)</th>
                      <th className="text-center pb-2 font-medium">Repetições</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.series.map((s: any) => (
                      <tr key={s.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5 text-gray-500">Série {s.serie_numero}</td>
                        <td className="py-1.5 text-center font-medium text-gray-900">{s.carga_kg ?? '—'}</td>
                        <td className="py-1.5 text-center text-gray-700">{s.repeticoes_feitas ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
