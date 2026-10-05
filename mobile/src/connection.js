// Versão para celular de src/main/database/connection.js.
// Mesmas funções (todos, um, executar, transacao...), mas o banco fica no
// armazenamento do aplicativo em vez de um arquivo do Windows.
// As migrations são as mesmas do computador (copiadas na hora de montar o app).
import initSqlJs from 'sql.js/dist/sql-wasm.js';
import { MIGRATIONS } from './migrations.gerado.js';
import { lerBanco, gravarBanco } from './armazenamento.js';

let SQL = null;
let db = null;
let emTransacao = false;

export async function abrirBanco() {
  SQL = await initSqlJs({ locateFile: () => 'sql-wasm.wasm' });
  const salvo = await lerBanco();
  db = salvo ? new SQL.Database(salvo) : new SQL.Database();
  configurar();
  rodarMigrations();
}

function configurar() {
  db.run('PRAGMA foreign_keys = ON;');
}

function salvarArquivo() {
  if (emTransacao) return;
  const dados = db.export(); // o export reinicia as configurações do banco
  configurar();
  gravarBanco(dados);
}

function limparParametros(parametros) {
  return parametros.map((v) => (v === undefined ? null : v));
}

export function todos(sql, parametros = []) {
  const stmt = db.prepare(sql);
  try {
    stmt.bind(limparParametros(parametros));
    const linhas = [];
    while (stmt.step()) linhas.push(stmt.getAsObject());
    return linhas;
  } finally {
    stmt.free();
  }
}

export function um(sql, parametros = []) {
  return todos(sql, parametros)[0] || null;
}

export function executar(sql, parametros = []) {
  db.run(sql, limparParametros(parametros));
  const alteradas = db.getRowsModified();
  const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  salvarArquivo();
  return { id, alteradas };
}

export function transacao(funcao) {
  db.run('BEGIN');
  emTransacao = true;
  try {
    const resultado = funcao();
    db.run('COMMIT');
    emTransacao = false;
    salvarArquivo();
    return resultado;
  } catch (erro) {
    emTransacao = false;
    try {
      db.run('ROLLBACK');
    } catch (_) {
      /* nada a desfazer */
    }
    throw erro;
  }
}

function rodarMigrations() {
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    nome TEXT PRIMARY KEY,
    aplicada_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`);
  for (const { nome, sql } of MIGRATIONS) {
    const jaAplicada = db.exec('SELECT 1 FROM _migrations WHERE nome = ?', [nome]).length > 0;
    if (jaAplicada) continue;
    db.run('BEGIN');
    try {
      db.exec(sql);
      db.run('INSERT INTO _migrations (nome) VALUES (?)', [nome]);
      db.run('COMMIT');
    } catch (erro) {
      db.run('ROLLBACK');
      throw new Error(`Erro ao aplicar ${nome}: ${erro.message}`);
    }
  }
  salvarArquivo();
}

export function exportarBanco() {
  const dados = db.export();
  configurar();
  return dados;
}

// Aceita o mesmo arquivo .db do backup feito no computador
export function substituirBanco(bytes) {
  const cabecalho = String.fromCharCode(...bytes.subarray(0, 15));
  if (cabecalho !== 'SQLite format 3') {
    throw new Error('O arquivo escolhido não é um backup válido do EletroGestor.');
  }
  const novo = new SQL.Database(bytes);
  if (!novo.exec("SELECT name FROM sqlite_master WHERE name = 'orcamentos'").length) {
    novo.close();
    throw new Error('O arquivo escolhido não é um backup do EletroGestor.');
  }
  db.close();
  db = novo;
  configurar();
  rodarMigrations();
}
