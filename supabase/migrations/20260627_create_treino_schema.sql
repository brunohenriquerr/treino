-- Cria schema isolado para treinos
CREATE SCHEMA IF NOT EXISTS treino;

CREATE TABLE treino.treinos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treino.exercicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id UUID NOT NULL REFERENCES treino.treinos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  series INTEGER NOT NULL DEFAULT 3,
  repeticoes TEXT NOT NULL DEFAULT '10',
  ordem INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treino.sessoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treino_id UUID NOT NULL REFERENCES treino.treinos(id) ON DELETE CASCADE,
  data_sessao DATE NOT NULL DEFAULT CURRENT_DATE,
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE treino.registros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sessao_id UUID NOT NULL REFERENCES treino.sessoes(id) ON DELETE CASCADE,
  exercicio_id UUID NOT NULL REFERENCES treino.exercicios(id) ON DELETE CASCADE,
  serie_numero INTEGER NOT NULL,
  carga_kg NUMERIC(6,2),
  repeticoes_feitas INTEGER,
  criado_em TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON treino.exercicios(treino_id);
CREATE INDEX ON treino.sessoes(treino_id);
CREATE INDEX ON treino.sessoes(data_sessao);
CREATE INDEX ON treino.registros(sessao_id);
CREATE INDEX ON treino.registros(exercicio_id);

ALTER TABLE treino.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino.exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino.sessoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE treino.registros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_treinos" ON treino.treinos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_exercicios" ON treino.exercicios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_sessoes" ON treino.sessoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_registros" ON treino.registros FOR ALL USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA treino TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA treino TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA treino TO anon, authenticated;
