# Treino PWR

Aplicação de acompanhamento de treinos com registro de carga, histórico de sessões e análise de evolução.

## Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Banco de dados**: Supabase (schema `treino` dentro do projeto `pwr-meeting-app`)
- **Deploy**: Vercel
- **Gráficos**: Recharts

## Estrutura do banco de dados

Todas as tabelas ficam no schema `treino` (separado do `public`):

```
treino.treinos         → planos de treino
treino.exercicios      → exercícios de cada treino
treino.sessoes         → cada execução do treino
treino.registros       → carga e reps por série por exercício por sessão
```

## Funcionalidades

- ✅ Criar e editar treinos com lista de exercícios
- ✅ Iniciar sessão com registro de carga por série
- ✅ Exibe automaticamente a última carga usada
- ✅ Histórico de sessões
- ✅ Gráfico de evolução de carga por exercício
- ✅ KPIs: total de sessões, volume total, melhor evolução

## Como rodar localmente

```bash
npm install
npm run dev
```

Crie `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

## Deploy na Vercel

1. Faça push para o GitHub
2. Importe o repositório na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy automático a cada push na main

## Migrações do banco

O schema já foi aplicado via MCP. Para recriar manualmente, execute o arquivo `supabase/migrations/` no SQL Editor do Supabase.
