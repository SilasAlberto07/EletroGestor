CREATE TABLE materiais (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  descricao TEXT NOT NULL,
  unidade   TEXT NOT NULL DEFAULT 'un',   -- un, m, kg, cx, rolo...
  preco     REAL NOT NULL DEFAULT 0,
  criado_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
