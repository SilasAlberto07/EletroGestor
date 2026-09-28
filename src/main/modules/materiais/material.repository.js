// Acesso ao banco: tabela materiais
const { todos, um, executar } = require('../../database/connection');

function listar(busca = '') {
  return todos('SELECT * FROM materiais WHERE descricao LIKE ? ORDER BY descricao COLLATE NOCASE', [
    `%${busca}%`,
  ]);
}

function obter(id) {
  return um('SELECT * FROM materiais WHERE id = ?', [id]);
}

function inserir(m) {
  return executar('INSERT INTO materiais (descricao, unidade, preco) VALUES (?, ?, ?)', [
    m.descricao,
    m.unidade,
    m.preco,
  ]).id;
}

function atualizar(id, m) {
  executar('UPDATE materiais SET descricao = ?, unidade = ?, preco = ? WHERE id = ?', [
    m.descricao,
    m.unidade,
    m.preco,
    id,
  ]);
}

function excluir(id) {
  executar('DELETE FROM materiais WHERE id = ?', [id]);
}

module.exports = { listar, obter, inserir, atualizar, excluir };
