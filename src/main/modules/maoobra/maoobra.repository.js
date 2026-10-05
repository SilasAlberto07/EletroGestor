// Acesso ao banco: tabela mao_obra_tipos
const { todos, um, executar } = require('../../database/connection');

function listar(busca = '') {
  return todos('SELECT * FROM mao_obra_tipos WHERE descricao LIKE ? ORDER BY id', [`%${busca}%`]);
}

function obter(id) {
  return um('SELECT * FROM mao_obra_tipos WHERE id = ?', [id]);
}

function inserir(t) {
  return executar('INSERT INTO mao_obra_tipos (descricao, unidade, preco) VALUES (?, ?, ?)', [
    t.descricao,
    t.unidade,
    t.preco,
  ]).id;
}

function atualizar(id, t) {
  executar('UPDATE mao_obra_tipos SET descricao = ?, unidade = ?, preco = ? WHERE id = ?', [
    t.descricao,
    t.unidade,
    t.preco,
    id,
  ]);
}

function excluir(id) {
  executar('DELETE FROM mao_obra_tipos WHERE id = ?', [id]);
}

module.exports = { listar, obter, inserir, atualizar, excluir };
