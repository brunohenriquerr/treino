'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import Navbar from '@/components/Navbar'
import { BarChart2, TrendingUp, Award, Dumbbell, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ExercicioStat {
  id: string; nome: string; treino_nome: string
  total_sessoes: number; carga_max: number | null
  carga_atual: number | null; evolucao: number | null
  historico: { data: string; carga: number; label: string }[]
}

export default function StatsPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<ExercicioStat[]>([])
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalSessoes, setTotalSessoes] = useState(0)
  const [totalVolume, setTotalVolume] = useState(0)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: treinos } = await supabase.from('treinos').select('id, nome').eq('usuario', user)
      if (!treinos || treinos.length === 0) { setLoading(false); return }
      const treinoIds = treinos.map((t: any) => t.id)
      const treinoMap = Object.fromEntries(treinos.map((t: any) => [t.id, t.nome]))
      const { data: exercicios } = await supabase.from('exercicios').select('id, nome, treino_id').in('treino_id', treinoIds)
      const { data: sessoes } = await supabase.from('sessoes').select('id, data_sessao').in('treino_id', treinoIds)
      const exIds = (exercicios || []).map((e: any) => e.id)
      const { data: registros } = await supabase.from('registros').select('exercicio_id, carga_kg, repeticoes_feitas, sessao_id').in('exercicio_id', exIds.length ? exIds : ['x'])

      setTotalSessoes((sessoes || []).length)
      let vol = 0
      ;(registros || []).forEach((r: any) => { if (r.carga_kg && r.repeticoes_feitas) vol += r.carga_kg * r.repeticoes_feitas })
      setTotalVolume(Math.round(vol))
      const sessaoMap = Object.fromEntries((sessoes || []).map((s: any) => [s.id, s.data_sessao]))

      const result: ExercicioStat[] = []
      for (const ex of (exercicios || [])) {
        const regsEx = (registros || []).filter((r: any) => r.exercicio_id === ex.id && r.carga_kg !== null)
        if (regsEx.length === 0) continue
        const hMap: Record<string, number[]> = {}
        regsEx.forEach((r: any) => { if (!hMap[r.sessao_id]) hMap[r.sessao_id] = []; hMap[r.sessao_id].push(r.carga_kg) })
        const historico = Object.entries(hMap).map(([sid, cargas]) => ({ data: sessaoMap[sid] || '', carga: Math.max(...cargas) }))
          .filter(h => h.data).sort((a, b) => a.data.localeCompare(b.data))
          .map(h => ({ ...h, label: h.data.split('-').slice(1).reverse().join('/') }))
        const cargas = regsEx.map((r: any) => r.carga_kg!)
        const carga_max = Math.max(...cargas)
        const carga_atual = historico.length > 0 ? historico[historico.length - 1].carga : null
        const carga_inicio = historico.length > 0 ? historico[0].carga : null
        const evolucao = carga_atual && carga_inicio ? ((carga_atual - carga_inicio) / carga_inicio) * 100 : null
        result.push({ id: ex.id, nome: ex.nome, treino_nome: treinoMap[ex.treino_id] || '', total_sessoes: Object.keys(hMap).length, carga_max, carga_atual, evolucao, historico })
      }
      result.sort((a, b) => b.total_sessoes - a.total_sessoes)
      setStats(result)
      if (result.length > 0) setSelecionado(result[0].id)
      setLoading(false)
    }
    load()
  }, [user])

  const exSel = stats.find(s => s.id === selecionado)
  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Evolução de {user}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Progresso de carga em cada exercício</p>
        </div>
        {loading ? <div className="text-center py-16 text-gray-400">Carregando...</div> : stats.length === 0 ? (
          <div className="text-center py-16">
            <BarChart2 size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Registre seus treinos para ver a evolução!</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Sessões totais', value: totalSessoes, icon: Activity },
                { label: 'Exercícios', value: stats.length, icon: Dumbbell },
                { label: 'Volume total (kg)', value: totalVolume.toLocaleString('pt-BR'), icon: TrendingUp },
                { label: 'Melhor evolução', value: (stats.reduce((b, s) => (s.evolucao !== null && s.evolucao > (b?.evolucao || 0)) ? s : b, stats[0])?.evolucao?.toFixed(0) ?? '—') + '%', icon: Award },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center mb-2"><Icon size={16} className="text-green-600" /></div>
                  <p className="text-xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                  {stats.map(s => (
                    <button key={s.id} onClick={() => setSelecionado(s.id)} className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${selecionado === s.id ? 'bg-green-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${selecionado === s.id ? 'text-green-700' : 'text-gray-900'}`}>{s.nome}</p>
                          <p className="text-xs text-gray-400 truncate">{s.treino_nome}</p>
                        </div>
                        <div className="ml-2 text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">{s.carga_atual ?? '—'}kg</p>
                          {s.evolucao !== null && <p className={`text-xs font-medium ${s.evolucao >= 0 ? 'text-green-600' : 'text-red-500'}`}>{s.evolucao >= 0 ? '+' : ''}{s.evolucao.toFixed(0)}%</p>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                {exSel && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="font-semibold text-gray-900">{exSel.nome}</h2>
                        <p className="text-xs text-gray-400">{exSel.treino_nome} · {exSel.total_sessoes} sessões</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Máximo histórico</p>
                        <p className="text-lg font-bold text-green-600">{exSel.carga_max}kg</p>
                      </div>
                    </div>
                    {exSel.historico.length < 2 ? (
                      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Registre pelo menos 2 sessões para ver o gráfico</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={exSel.historico} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                          <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} unit="kg" />
                          <Tooltip formatter={(v: any) => [`${v}kg`, 'Carga máxima']} contentStyle={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8 }} />
                          <Line type="monotone" dataKey="carga" stroke="#16a34a" strokeWidth={2} dot={{ r: 4, fill: '#16a34a', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                    <div className="mt-4 border-t border-gray-50 pt-4">
                      <h3 className="text-xs font-medium text-gray-500 mb-2">Histórico detalhado</h3>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {[...exSel.historico].reverse().map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500">{h.label}</span>
                            <span className="font-medium text-gray-900">{h.carga}kg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
