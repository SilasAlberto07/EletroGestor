CREATE TABLE orcamentos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id    INTEGER NOT NULL REFERENCES clientes (id),
  servico_id    INTEGER REFERENCES servicos (id),
  status        TEXT NOT NULL DEFAULT 'aguardando'
                CHECK (status IN ('aguardando', 'aprovado', 'recusado')),
  mao_obra      REAL NOT NULL DEFAULT 0,
  deslocamento  REAL NOT NULL DEFAULT 0,
  total         REAL NOT NULL DEFAULT 0,
  observacoes   TEXT,
  criado_em     TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  atualizado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Cada linha da tabela "MATERIAIS" do orçamento
CREATE TABLE orcamento_itens (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  orcamento_id INTEGER NOT NULL REFERENCES orcamentos (id) ON DELETE CASCADE,
  material_id  INTEGER REFERENCES materiais (id) ON DELETE SET NULL,
  descricao    TEXT NOT NULL,   -- copiado do material, para o orçamento não mudar depois
  unidade      TEXT NOT NULL DEFAULT 'un',
  quantidade   REAL NOT NULL DEFAULT 0,
  unitario     REAL NOT NULL DEFAULT 0,
  total        REAL NOT NULL DEFAULT 0
);

CREATE INDEX idx_orcamentos_status ON orcamentos (status);
CREATE INDEX idx_orcamentos_criado ON orcamentos (criado_em);
CREATE INDEX idx_itens_orcamento ON orcamento_itens (orcamento_id);
