// Conexão com o banco SQLite (usando sql.js, que não precisa compilar nada no Windows).
// O banco fica na memória e é gravado no arquivo a cada alteração.
const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { caminhoBanco } = require('../utils/paths');

let SQL = null;
let db = null;
let emTransacao = false;
let aoAlterar = null; // avisado a cada alteração gravada (usado pela sincronização com o Drive)

async function abrirBanco() {
  const wasm = fs.readFileSync(require.resolve('sql.js/dist/sql-wasm.wasm'));
  SQL = await initSqlJs({ wasmBinary: wasm });

  const arquivo = caminhoBanco();
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  db = fs.existsSync(arquivo) ? new SQL.Database(fs.readFileSync(arquivo)) : new SQL.Database();

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
  const arquivo = caminhoBanco();
  const temporario = `${arquivo}.tmp`;
  fs.writeFileSync(temporario, Buffer.from(dados));
  fs.renameSync(temporario, arquivo); // grava de forma segura
  if (aoAlterar) aoAlterar();
}

function definirAoAlterar(funcao) {
  aoAlterar = funcao;
}

function limparParametros(parametros) {
  return parametros.map((v) => (v === undefined ? null : v));
}

// Retorna todas as linhas de uma consulta
function todos(sql, parametros = []) {
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

// Retorna só a primeira linha (ou null)
function um(sql, parametros = []) {
  return todos(sql, parametros)[0] || null;
}

// Executa INSERT / UPDATE / DELETE
function executar(sql, parametros = []) {
  db.run(sql, limparParametros(parametros));
  const alteradas = db.getRowsModified();
  const id = db.exec('SELECT last_insert_rowid()')[0].values[0][0];
  salvarArquivo();
  return { id, alteradas };
}

// Executa várias operações de uma vez: ou salva tudo, ou nada
function transacao(funcao) {
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

function aplicarPasta(pasta, prefixo) {
  if (!fs.existsSync(pasta)) return;
  const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith('.sql')).sort();

  for (const arquivo of arquivos) {
    const nome = `${prefixo}${arquivo}`;
    const jaAplicada = db.exec('SELECT 1 FROM _migrations WHERE nome = ?', [nome]).length > 0;
    if (jaAplicada) continue;

    const sql = fs.readFileSync(path.join(pasta, arquivo), 'utf8');
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
}

// Cria/atualiza as tabelas automaticamente, na ordem dos arquivos
function rodarMigrations() {
  db.run(`CREATE TABLE IF NOT EXISTS _migrations (
    nome TEXT PRIMARY KEY,
    aplicada_em TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`);
  aplicarPasta(path.join(__dirname, 'migrations'), '');
  aplicarPasta(path.join(__dirname, 'seeds'), 'seed:');
  salvarArquivo();
}

function exportarBanco() {
  const dados = Buffer.from(db.export());
  configurar();
  return dados;
}

function substituirBanco(buffer) {
  if (buffer.subarray(0, 15).toString('latin1') !== 'SQLite format 3') {
    throw new Error('O arquivo escolhido não é um backup válido do EletroGestor.');
  }
  const novo = new SQL.Database(buffer);
  if (!novo.exec("SELECT name FROM sqlite_master WHERE name = 'orcamentos'").length) {
    novo.close();
    throw new Error('O arquivo escolhido não é um backup do EletroGestor.');
  }
  db.close();
  db = novo;
  configurar();
  rodarMigrations();
}

module.exports = { abrirBanco, todos, um, executar, transacao, exportarBanco, substituirBanco, definirAoAlterar };
