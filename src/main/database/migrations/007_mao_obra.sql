-- Tipos de mão de obra (cadastrados na página "Mão de Obra")
CREATE TABLE mao_obra_tipos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL,
  unidade   TEXT NOT NULL DEFAULT 'un',   -- cv, ponto, h, m, dia, un...
  preco     REAL NOT NULL DEFAULT 0,       -- valor sugerido (pode ser alterado no orçamento)
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

INSERT INTO mao_obra_tipos (descricao, unidade, preco) VALUES
  ('Mão de Obra por CV', 'cv', 0),
  ('Mão de Obra por Pontos', 'ponto', 0),
  ('Mão de Obra por Horas', 'h', 0),
  ('Mão de Obra por Metros', 'm', 0),
  ('Mão de Obra por Dia', 'dia', 0),
  ('Mão de Obra Emergencial', 'un', 0);

-- Cada linha da lista "MÃO DE OBRA" do orçamento
CREATE TABLE orcamento_mao_obra (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos (id) ON DELETE CASCADE,
  tipo_id      INTEGER REFERENCES mao_obra_tipos (id) ON DELETE SET NULL,
  descricao    TEXT NOT NULL,   -- copiado do tipo, para o orçamento não mudar depois
  unidade      TEXT NOT NULL DEFAULT 'un',
  quantidade   REAL NOT NULL DEFAULT 0,
  unitario     REAL NOT NULL DEFAULT 0,
  total        REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_mao_obra_orcamento ON orcamento_mao_obra (orcamento_id);

-- Deslocamento passa a ser KM x valor do KM
-- (as colunas mao_obra e deslocamento continuam guardando os totais)
ALTER TABLE orcamentos ADD COLUMN deslocamento_km REAL NOT NULL DEFAULT 0;
ALTER TABLE orcamentos ADD COLUMN deslocamento_valor_km REAL NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES ('valor_km_padrao', '0');
