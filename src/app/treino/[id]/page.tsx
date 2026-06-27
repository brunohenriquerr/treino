'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Treino, Exercicio, Registro } from '@/lib/types'
import Navbar from '@/components/Navbar'
import { useParams, useRouter } from 'next/navigation'
import { Check, ChevronLeft, Save, TrendingUp, Dumbbell } from 'lucide-react'
import Link from 'next/link'

interface UltimaCarga {
  exercicio_id: string
  carga_kg: number | null
  data_sessao: string
}

export default function TreinoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [treino, setTreino] = useState<Treino | null>(null)
  const [exercicios, setExercicios] = useState<Exercicio[]>([])
  const [ultimasCargas, setUltimasCargas] = useState<Record<string, UltimaCarga>>({})
  const [registros, setRegistros] = useState<Record<string, Record<number, { carga: string; reps: string }>>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [obs, setObs] = useState('')

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('treinos').select('*').eq('id', id).single()
      if (!t) return
      setTreino(t)
      const { data: ex } = await supabase.from('exercicios').select('*').eq('treino_id', id).order('ordem')
      if (ex) {
        setExercicios(ex)
        // Buscar última carga de cada exercício
        const map: Record<string, UltimaCarga> = {}
        for (const e of ex) {
          const { data: reg } = await supabase
            .from('registros')
            .select('carga_kg, sessao_id, sessoes(data_sessao)')
            .eq('exercicio_id', e.id)
            .order('criado_em', { ascending: false })
            .limit(1)
          if (reg && reg.length > 0) {
            const r = reg[0] as any
            map[e.id] = { exercicio_id: e.id, carga_kg: r.carga_kg, data_sessao: r.sessoes?.data_sessao || '' }
          }
        }
        setUltimasCargas(map)
        // Inicializar registros com valores vazios
        const init: Record<string, Record<number, { carga: string; reps: string }>> = {}
        ex.forEach(e => {
          init[e.id] = {}
          for (let s = 1; s <= e.series; s++) {
            init[e.id][s] = { carga: map[e.id]?.carga_kg?.toString() || '', reps: e.repeticoes }
          }
        })
        setRegistros(init)
      }
    }
    load()
  }, [id])

  function setReg(exId: string, serie: number, field: 'carga' | 'reps', value: string) {
    setRegistros(prev => ({
      ...prev,
      [exId]: { ...prev[exId], [serie]: { ...prev[exId]?.[serie], [field]: value } }
    }))
  }

  async function salvar() {
    setSaving(true)
    const { data: sessao } = await supabase.from('sessoes').insert({ treino_id: id, data_sessao: data, observacoes: obs || null }).select().single()
    if (sessao) {
      const rows: any[] = []
      exercicios.forEach(e => {
        for (let s = 1; s <= e.series; s++) {
          const r = registros[e.id]?.[s]
          rows.push({ sessao_id: sessao.id, exercicio_id: e.id, serie_numero: s, carga_kg: r?.carga ? parseFloat(r.carga) : null, repeticoes_feitas: r?.reps ? parseInt(r.reps) : null })
        }
      })
      await supabase.from('registros').insert(rows)
      setSaved(true)
      setTimeout(() => router.push('/sessao'), 1200)
    }
    setSaving(false)
  }

  if (!treino) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-16 text-gray-400">Carregando...</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"><ChevronLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{treino.nome}</h1>
            {treino.descricao && <p className="text-sm text-gray-400">{treino.descricao}</p>}
          </div>
        </div>

        <div className="card p-4 mb-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Data da sessão</label>
              <input type="date" className="input" value={data} onChange={e => setData(e.target.value)} />
            </div>
            <div>
              <label className="label">Observações (opcional)</label>
              <input className="input" placeholder="Como foi o treino..." value={obs} onChange={e => setObs(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {exercicios.map(ex => {
            const ultima = ultimasCargas[ex.id]
            return (
              <div key={ex.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell size={16} className="text-brand-500" />
                    <h3 className="font-medium text-gray-900 text-sm">{ex.nome}</h3>
                  </div>
                  {ultima && (
                    <div className="flex items-center gap-1 bg-brand-50 text-brand-700 text-xs px-2 py-1 rounded-lg">
                      <TrendingUp size={11} />
                      <span>Última: <strong>{ultima.carga_kg}kg</strong></span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 mb-3">{ex.series} séries × {ex.repeticoes} repetições</div>
                <div className="grid gap-2">
                  {Array.from({ length: ex.series }, (_, i) => i + 1).map(serie => (
                    <div key={serie} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-400 w-12">Série {serie}</span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-0.5">Carga (kg)</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            className="input text-center"
                            placeholder={ultima?.carga_kg?.toString() || '0'}
                            value={registros[ex.id]?.[serie]?.carga || ''}
                            onChange={e => setReg(ex.id, serie, 'carga', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400 block mb-0.5">Repetições</label>
                          <input
                            type="number"
                            min="1"
                            className="input text-center"
                            value={registros[ex.id]?.[serie]?.reps || ''}
                            onChange={e => setReg(ex.id, serie, 'reps', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={salvar} disabled={saving || saved} className={`btn-primary flex items-center gap-2 px-6 py-2.5 ${saved ? 'bg-green-500 hover:bg-green-500' : ''}`}>
            {saved ? <><Check size={16} /> Salvo!</> : saving ? <><Save size={16} /> Salvando...</> : <><Save size={16} /> Salvar sessão</>}
          </button>
        </div>
      </main>
    </div>
  )
}
