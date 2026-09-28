// Acesso ao banco: tabela clientes
const { todos, um, executar } = require('../../database/connection');

function listar(busca = '') {
  const termo = `%${busca}%`;
  return todos(
    `SELECT * FROM clientes
     WHERE nome LIKE ? OR IFNULL(telefone, '') LIKE ? OR IFNULL(documento, '') LIKE ?
     ORDER BY nome COLLATE NOCASE`,
    [termo, termo, termo]
  );
}

function obter(id) {
  return um('SELECT * FROM clientes WHERE id = ?', [id]);
}

function inserir(c) {
  return executar(
    `INSERT INTO clientes (nome, documento, telefone, email, endereco, observacoes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [c.nome, c.documento, c.telefone, c.email, c.endereco, c.observacoes]
  ).id;
}

function atualizar(id, c) {
  executar(
    `UPDATE clientes SET nome = ?, documento = ?, telefone = ?, email = ?, endereco = ?, observacoes = ?
     WHERE id = ?`,
    [c.nome, c.documento, c.telefone, c.email, c.endereco, c.observacoes, id]
  );
}

function excluir(id) {
  executar('DELETE FROM clientes WHERE id = ?', [id]);
}

function contarOrcamentos(id) {
  return um('SELECT COUNT(*) AS total FROM orcamentos WHERE cliente_id = ?', [id]).total;
}

module.exports = { listar, obter, inserir, atualizar, excluir, contarOrcamentos };
