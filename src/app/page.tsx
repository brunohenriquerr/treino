'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { Treino, Exercicio } from '@/lib/types'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Plus, Dumbbell, ChevronRight, Trash2, Edit2, X, Check, Layers } from 'lucide-react'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [treinos, setTreinos] = useState<Treino[]>([])
  const [exerciciosPorTreino, setExerciciosPorTreino] = useState<Record<string, Exercicio[]>>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [exerciciosForm, setExerciciosForm] = useState([{ nome: '', series: 3, repeticoes: '10' }])
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  async function load() {
    if (!user) return
    const { data: t } = await supabase.from('treinos').select('*').eq('usuario', user).order('criado_em', { ascending: false })
    if (t) {
      setTreinos(t)
      if (t.length > 0) {
        const ids = t.map((x: Treino) => x.id)
        const { data: ex } = await supabase.from('exercicios').select('*').in('treino_id', ids).order('ordem')
        if (ex) {
          const map: Record<string, Exercicio[]> = {}
          ex.forEach((e: Exercicio) => {
            if (!map[e.treino_id]) map[e.treino_id] = []
            map[e.treino_id].push(e)
          })
          setExerciciosPorTreino(map)
        }
      }
    }
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  function resetForm() {
    setNome(''); setDescricao(''); setExerciciosForm([{ nome: '', series: 3, repeticoes: '10' }])
    setShowForm(false); setEditId(null)
  }

  async function salvar() {
    if (!nome.trim() || !user) return
    setSaving(true)
    if (editId) {
      await supabase.from('treinos').update({ nome, descricao, atualizado_em: new Date().toISOString() }).eq('id', editId).eq('usuario', user)
      await supabase.from('exercicios').delete().eq('treino_id', editId)
      const rows = exerciciosForm.filter(e => e.nome.trim()).map((e, i) => ({ treino_id: editId, nome: e.nome, series: e.series, repeticoes: e.repeticoes, ordem: i }))
      if (rows.length) await supabase.from('exercicios').insert(rows)
    } else {
      const { data: t } = await supabase.from('treinos').insert({ nome, descricao, usuario: user }).select().single()
      if (t) {
        const rows = exerciciosForm.filter(e => e.nome.trim()).map((e, i) => ({ treino_id: t.id, nome: e.nome, series: e.series, repeticoes: e.repeticoes, ordem: i }))
        if (rows.length) await supabase.from('exercicios').insert(rows)
      }
    }
    setSaving(false); resetForm(); load()
  }

  function startEdit(t: Treino) {
    setEditId(t.id); setNome(t.nome); setDescricao(t.descricao || '')
    const ex = exerciciosPorTreino[t.id] || []
    setExerciciosForm(ex.length ? ex.map(e => ({ nome: e.nome, series: e.series, repeticoes: e.repeticoes })) : [{ nome: '', series: 3, repeticoes: '10' }])
    setShowForm(true)
  }

  async function deletar(id: string) {
    if (!confirm('Remover treino e todos os dados relacionados?')) return
    await supabase.from('treinos').delete().eq('id', id)
    load()
  }

  if (authLoading) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Treinos de {user}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{treinos.length} treino{treinos.length !== 1 ? 's' : ''} cadastrado{treinos.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true) }} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
            <Plus size={15} /> Novo treino
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-medium text-gray-900">{editId ? 'Editar treino' : 'Novo treino'}</h2>
              <button onClick={resetForm}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="grid gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do treino</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Ex: Treino A — Peito e Tríceps" value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" placeholder="Observações gerais..." value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercícios</label>
              <div className="space-y-2">
                {exerciciosForm.map((ex, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent flex-1" placeholder="Nome do exercício" value={ex.nome} onChange={e => { const n = [...exerciciosForm]; n[i].nome = e.target.value; setExerciciosForm(n) }} />
                    <input type="number" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-16 text-center" placeholder="Séries" value={ex.series} min={1} max={10} onChange={e => { const n = [...exerciciosForm]; n[i].series = +e.target.value; setExerciciosForm(n) }} />
                    <span className="text-xs text-gray-400">×</span>
                    <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-20 text-center" placeholder="Reps" value={ex.repeticoes} onChange={e => { const n = [...exerciciosForm]; n[i].repeticoes = e.target.value; setExerciciosForm(n) }} />
                    {exerciciosForm.length > 1 && (
                      <button onClick={() => setExerciciosForm(exerciciosForm.filter((_, j) => j !== i))}><X size={15} className="text-gray-400 hover:text-red-500" /></button>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={() => setExerciciosForm([...exerciciosForm, { nome: '', series: 3, repeticoes: '10' }])} className="mt-2 text-sm text-green-600 hover:text-green-700 flex items-center gap-1">
                <Plus size={14} /> Adicionar exercício
              </button>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={resetForm} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-200 transition-colors text-sm">Cancelar</button>
              <button onClick={salvar} disabled={saving || !nome.trim()} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">
                <Check size={14} /> {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">Carregando...</div>
        ) : treinos.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum treino ainda. Crie o primeiro!</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {treinos.map(t => {
              const exs = exerciciosPorTreino[t.id] || []
              return (
                <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{t.nome}</h3>
                      {t.descricao && <p className="text-xs text-gray-400 mt-0.5">{t.descricao}</p>}
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => startEdit(t)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => deletar(t.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Layers size={12} />{exs.length} exercício{exs.length !== 1 ? 's' : ''}</span>
                    <Link href={`/treino/${t.id}`} className="text-xs text-green-600 hover:text-green-700 flex items-center gap-0.5 font-medium">
                      Iniciar <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
