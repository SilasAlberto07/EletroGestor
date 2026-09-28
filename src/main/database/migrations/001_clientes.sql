CREATE TABLE clientes (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT NOT NULL,
  documento   TEXT,            -- CPF ou CNPJ
  telefone    TEXT,
  email       TEXT,
  endereco    TEXT,
  observacoes TEXT,
  criado_em   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE INDEX idx_clientes_nome ON clientes (nome);
