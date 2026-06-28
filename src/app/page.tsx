'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { Treino, Exercicio } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, Dumbbell, ChevronRight, Trash2, Edit2, X, Check, Layers, FolderOpen, ChevronDown, ChevronUp, Pencil } from 'lucide-react'

interface Ficha {
  id: string
  nome: string
  descricao: string | null
  ativa: boolean
  criado_em: string
}

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [fichas, setFichas] = useState<Ficha[]>([])
  const [treinosPorFicha, setTreinosPorFicha] = useState<Record<string, Treino[]>>({})
  const [exerciciosPorTreino, setExerciciosPorTreino] = useState<Record<string, Exercicio[]>>({})
  const [fichasAbertas, setFichasAbertas] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // Form treino
  const [showFormTreino, setShowFormTreino] = useState(false)
  const [editTreinoId, setEditTreinoId] = useState<string | null>(null)
  const [nomeTreino, setNomeTreino] = useState('')
  const [descricaoTreino, setDescricaoTreino] = useState('')
  const [fichaIdSelecionada, setFichaIdSelecionada] = useState<string>('')
  const [exerciciosForm, setExerciciosForm] = useState([{ nome: '', series: 3, repeticoes: '10' }])
  const [savingTreino, setSavingTreino] = useState(false)

  // Form ficha
  const [showFormFicha, setShowFormFicha] = useState(false)
  const [editFichaId, setEditFichaId] = useState<string | null>(null)
  const [nomeFicha, setNomeFicha] = useState('')
  const [descricaoFicha, setDescricaoFicha] = useState('')
  const [savingFicha, setSavingFicha] = useState(false)

  async function load() {
    if (!user) return
    const { data: fs } = await supabase.from('fichas').select('*').eq('usuario', user).order('criado_em', { ascending: false })
    if (fs) {
      setFichas(fs)
      // Abrir a ficha ativa por padrão
      const abertas: Record<string, boolean> = {}
      fs.forEach((f: Ficha) => { if (f.ativa) abertas[f.id] = true })
      setFichasAbertas(prev => ({ ...abertas, ...prev }))
    }
    const { data: ts } = await supabase.from('treinos').select('*').eq('usuario', user).order('criado_em', { ascending: true })
    if (ts) {
      const map: Record<string, Treino[]> = {}
      ts.forEach((t: any) => {
        const key = t.ficha_id || 'sem_ficha'
        if (!map[key]) map[key] = []
        map[key].push(t)
      })
      setTreinosPorFicha(map)
      const ids = ts.map((t: Treino) => t.id)
      if (ids.length) {
        const { data: ex } = await supabase.from('exercicios').select('*').in('treino_id', ids).order('ordem')
        if (ex) {
          const exMap: Record<string, Exercicio[]> = {}
          ex.forEach((e: Exercicio) => {
            if (!exMap[e.treino_id]) exMap[e.treino_id] = []
            exMap[e.treino_id].push(e)
          })
          setExerciciosPorTreino(exMap)
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  function toggleFicha(id: string) {
    setFichasAbertas(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // FICHA actions
  function resetFormFicha() { setNomeFicha(''); setDescricaoFicha(''); setShowFormFicha(false); setEditFichaId(null) }

  async function salvarFicha() {
    if (!nomeFicha.trim() || !user) return
    setSavingFicha(true)
    if (editFichaId) {
      await supabase.from('fichas').update({ nome: nomeFicha, descricao: descricaoFicha }).eq('id', editFichaId)
    } else {
      await supabase.from('fichas').insert({ nome: nomeFicha, descricao: descricaoFicha, usuario: user, ativa: true })
    }
    setSavingFicha(false); resetFormFicha(); load()
  }

  async function deletarFicha(id: string) {
    if (!confirm('Remover esta ficha? Os treinos dentro dela ficarão sem ficha.')) return
    await supabase.from('fichas').delete().eq('id', id)
    load()
  }

  async function toggleAtivaFicha(f: Ficha) {
    await supabase.from('fichas').update({ ativa: !f.ativa }).eq('id', f.id)
    load()
  }

  function startEditFicha(f: Ficha) {
    setEditFichaId(f.id); setNomeFicha(f.nome); setDescricaoFicha(f.descricao || ''); setShowFormFicha(true)
  }

  // TREINO actions
  function resetFormTreino() { setNomeTreino(''); setDescricaoTreino(''); setExerciciosForm([{ nome: '', series: 3, repeticoes: '10' }]); setShowFormTreino(false); setEditTreinoId(null); setFichaIdSelecionada('') }

  function abrirNovoTreino(fichaId?: string) {
    resetFormTreino()
    setFichaIdSelecionada(fichaId || '')
    setShowFormTreino(true)
  }

  async function salvarTreino() {
    if (!nomeTreino.trim() || !user) return
    setSavingTreino(true)
    const fichaId = fichaIdSelecionada || null
    if (editTreinoId) {
      await supabase.from('treinos').update({ nome: nomeTreino, descricao: descricaoTreino, ficha_id: fichaId, atualizado_em: new Date().toISOString() }).eq('id', editTreinoId)
      await supabase.from('exercicios').delete().eq('treino_id', editTreinoId)
      const rows = exerciciosForm.filter(e => e.nome.trim()).map((e, i) => ({ treino_id: editTreinoId, nome: e.nome, series: e.series, repeticoes: e.repeticoes, ordem: i }))
      if (rows.length) await supabase.from('exercicios').insert(rows)
    } else {
      const { data: t } = await supabase.from('treinos').insert({ nome: nomeTreino, descricao: descricaoTreino, usuario: user, ficha_id: fichaId }).select().single()
      if (t) {
        const rows = exerciciosForm.filter(e => e.nome.trim()).map((e, i) => ({ treino_id: t.id, nome: e.nome, series: e.series, repeticoes: e.repeticoes, ordem: i }))
        if (rows.length) await supabase.from('exercicios').insert(rows)
      }
    }
    setSavingTreino(false); resetFormTreino(); load()
  }

  function startEditTreino(t: Treino) {
    setEditTreinoId(t.id); setNomeTreino(t.nome); setDescricaoTreino(t.descricao || '')
    setFichaIdSelecionada((t as any).ficha_id || '')
    const ex = exerciciosPorTreino[t.id] || []
    setExerciciosForm(ex.length ? ex.map(e => ({ nome: e.nome, series: e.series, repeticoes: e.repeticoes })) : [{ nome: '', series: 3, repeticoes: '10' }])
    setShowFormTreino(true)
  }

  async function deletarTreino(id: string) {
    if (!confirm('Remover este treino?')) return
    await supabase.from('treinos').delete().eq('id', id)
    load()
  }

  if (authLoading) return null

  const totalTreinos = Object.values(treinosPorFicha).flat().length

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Fichas de {user}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{fichas.length} ficha{fichas.length !== 1 ? 's' : ''} · {totalTreinos} treino{totalTreinos !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => abrirNovoTreino()} className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors text-sm">
              <Plus size={15} /> Treino
            </button>
            <button onClick={() => { resetFormFicha(); setShowFormFicha(true) }} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
              <Plus size={15} /> Ficha
            </button>
          </div>
        </div>

        {/* Form Ficha */}
        {showFormFicha && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-gray-900">{editFichaId ? 'Editar ficha' : 'Nova ficha'}</h2>
              <button onClick={resetFormFicha}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da ficha</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Ex: Ficha Agosto 2026" value={nomeFicha} onChange={e => setNomeFicha(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Objetivo do período..." value={descricaoFicha} onChange={e => setDescricaoFicha(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={resetFormFicha} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={salvarFicha} disabled={savingFicha || !nomeFicha.trim()} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
                <Check size={14} /> {savingFicha ? 'Salvando...' : 'Salvar ficha'}
              </button>
            </div>
          </div>
        )}

        {/* Form Treino */}
        {showFormTreino && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-gray-900">{editTreinoId ? 'Editar treino' : 'Novo treino'}</h2>
              <button onClick={resetFormTreino}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do treino</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Ex: A — Peito" value={nomeTreino} onChange={e => setNomeTreino(e.target.value)} />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ficha</label>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white" value={fichaIdSelecionada} onChange={e => setFichaIdSelecionada(e.target.value)}>
                  <option value="">Sem ficha</option>
                  {fichas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
              </div>
              <div className="sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Grupos musculares..." value={descricaoTreino} onChange={e => setDescricaoTreino(e.target.value)} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Exercícios</label>
              <div className="space-y-2">
                {exerciciosForm.map((ex, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 16px 72px 20px', gap: '8px', alignItems: 'center' }}>
                    <input style={{ width: '100%' }} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Nome do exercício" value={ex.nome} onChange={e => { const n = [...exerciciosForm]; n[i].nome = e.target.value; setExerciciosForm(n) }} />
                    <input type="number" style={{ width: '100%' }} className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center" placeholder="Sér" value={ex.series} min={1} max={10} onChange={e => { const n = [...exerciciosForm]; n[i].series = +e.target.value; setExerciciosForm(n) }} />
                    <span className="text-xs text-gray-400 text-center">×</span>
                    <input style={{ width: '100%' }} className="px-2 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center" placeholder="Reps" value={ex.repeticoes} onChange={e => { const n = [...exerciciosForm]; n[i].repeticoes = e.target.value; setExerciciosForm(n) }} />
                    <div className="flex items-center justify-center">
                      {exerciciosForm.length > 1 && <button onClick={() => setExerciciosForm(exerciciosForm.filter((_, j) => j !== i))}><X size={15} className="text-gray-400 hover:text-red-500" /></button>}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setExerciciosForm([...exerciciosForm, { nome: '', series: 3, repeticoes: '10' }])} className="mt-2 text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                <Plus size={14} /> Adicionar exercício
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={resetFormTreino} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={salvarTreino} disabled={savingTreino || !nomeTreino.trim()} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
                <Check size={14} /> {savingTreino ? 'Salvando...' : 'Salvar treino'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : fichas.length === 0 && totalTreinos === 0 ? (
          <div className="text-center py-16">
            <FolderOpen size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhuma ficha ainda. Crie a primeira!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fichas.map(f => {
              const treinos = treinosPorFicha[f.id] || []
              const aberta = fichasAbertas[f.id] ?? false
              return (
                <div key={f.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Header da ficha */}
                  <div
                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFicha(f.id)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${f.ativa ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold text-gray-900">{f.nome}</h2>
                        {f.ativa && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Ativa</span>}
                      </div>
                      {f.descricao && <p className="text-xs text-gray-400 mt-0.5">{f.descricao}</p>}
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                      <span className="text-xs text-gray-400">{treinos.length} treino{treinos.length !== 1 ? 's' : ''}</span>
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => abrirNovoTreino(f.id)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Adicionar treino"><Plus size={14} /></button>
                        <button onClick={() => startEditFicha(f)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar ficha"><Pencil size={14} /></button>
                        <button onClick={() => toggleAtivaFicha(f)} className={`p-1.5 rounded-lg transition-colors text-xs font-medium ${f.ativa ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`} title={f.ativa ? 'Desativar' : 'Ativar'}>{f.ativa ? 'Pausar' : 'Ativar'}</button>
                        <button onClick={() => deletarFicha(f.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                      {aberta ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>

                  {/* Treinos da ficha */}
                  {aberta && (
                    <div className="border-t border-gray-50 px-5 py-4">
                      {treinos.length === 0 ? (
                        <div className="text-center py-6">
                          <p className="text-sm text-gray-400">Nenhum treino nesta ficha.</p>
                          <button onClick={() => abrirNovoTreino(f.id)} className="mt-2 text-sm text-green-600 hover:text-green-700 flex items-center gap-1 mx-auto">
                            <Plus size={14} /> Adicionar treino
                          </button>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {treinos.map(t => {
                            const exs = exerciciosPorTreino[t.id] || []
                            return (
                              <div key={t.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h3 className="font-medium text-gray-900 text-sm">{t.nome}</h3>
                                    {t.descricao && <p className="text-xs text-gray-400 mt-0.5">{t.descricao}</p>}
                                  </div>
                                  <div className="flex gap-1 ml-2">
                                    <button onClick={() => startEditTreino(t)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-white rounded-lg transition-colors"><Edit2 size={13} /></button>
                                    <button onClick={() => deletarTreino(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"><Trash2 size={13} /></button>
                                  </div>
                                </div>
                                {exs.length > 0 && (
                                  <div className="space-y-1 mb-3">
                                    {exs.slice(0, 4).map(ex => (
                                      <div key={ex.id} className="flex items-center gap-2 text-xs text-gray-600">
                                        <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                                        <span>{ex.nome}</span>
                                        <span className="text-gray-400 ml-auto">{ex.series}×{ex.repeticoes}</span>
                                      </div>
                                    ))}
                                    {exs.length > 4 && <p className="text-xs text-gray-400 pl-3">+{exs.length - 4} exercício{exs.length - 4 !== 1 ? 's' : ''}</p>}
                                  </div>
                                )}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                  <span className="text-xs text-gray-400 flex items-center gap-1"><Layers size={11} />{exs.length} exercício{exs.length !== 1 ? 's' : ''}</span>
                                  <Link href={`/treino/${t.id}`} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-0.5 font-medium">
                                    Iniciar <ChevronRight size={13} />
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Treinos sem ficha */}
            {(treinosPorFicha['sem_ficha'] || []).length > 0 && (
              <div className="bg-white rounded-xl border border-dashed border-gray-200 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleFicha('sem_ficha')}>
                  <div className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                  <h2 className="font-medium text-gray-500 flex-1">Sem ficha</h2>
                  <span className="text-xs text-gray-400">{(treinosPorFicha['sem_ficha'] || []).length} treino{(treinosPorFicha['sem_ficha'] || []).length !== 1 ? 's' : ''}</span>
                  {fichasAbertas['sem_ficha'] ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
                </div>
                {fichasAbertas['sem_ficha'] && (
                  <div className="border-t border-gray-50 px-5 py-4 grid gap-3 sm:grid-cols-2">
                    {(treinosPorFicha['sem_ficha'] || []).map(t => {
                      const exs = exerciciosPorTreino[t.id] || []
                      return (
                        <div key={t.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-medium text-gray-900 text-sm">{t.nome}</h3>
                            <div className="flex gap-1 ml-2">
                              <button onClick={() => startEditTreino(t)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-white rounded-lg"><Edit2 size={13} /></button>
                              <button onClick={() => deletarTreino(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg"><Trash2 size={13} /></button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-400">{exs.length} exercício{exs.length !== 1 ? 's' : ''}</span>
                            <Link href={`/treino/${t.id}`} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-0.5 font-medium">Iniciar <ChevronRight size={13} /></Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
