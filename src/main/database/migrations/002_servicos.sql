CREATE TABLE servicos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  descricao       TEXT,
  mao_obra_padrao REAL NOT NULL DEFAULT 0,
  criado_em       TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
