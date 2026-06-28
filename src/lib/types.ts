export interface Treino {
  id: string
  nome: string
  descricao: string | null
  ficha_id: string | null
  usuario: string
  criado_em: string
  atualizado_em: string
}

export interface Ficha {
  id: string
  nome: string
  descricao: string | null
  usuario: string
  ativa: boolean
  criado_em: string
}

export interface Exercicio {
  id: string
  treino_id: string
  nome: string
  series: number
  repeticoes: string
  ordem: number
  criado_em: string
}

export interface Sessao {
  id: string
  treino_id: string
  data_sessao: string
  observacoes: string | null
  criado_em: string
  treinos?: Treino
}

export interface Registro {
  id: string
  sessao_id: string
  exercicio_id: string
  serie_numero: number
  carga_kg: number | null
  repeticoes_feitas: number | null
  criado_em: string
  exercicios?: Exercicio
}

export interface ExercicioComUltimaCarga extends Exercicio {
  ultima_carga?: number | null
  ultima_sessao?: string | null
}

export interface RegistroComExercicio extends Registro {
  exercicios: Exercicio
}

export interface SessaoComTreino extends Sessao {
  treinos: Treino
}

export interface EvolucaoCarga {
  data: string
  carga: number
  sessao_id: string
}
