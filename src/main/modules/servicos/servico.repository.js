// Acesso ao banco: tabela servicos
const { todos, um, executar } = require('../../database/connection');

function listar(busca = '') {
  const termo = `%${busca}%`;
  return todos(
    `SELECT * FROM servicos
     WHERE nome LIKE ? OR IFNULL(descricao, '') LIKE ?
     ORDER BY nome COLLATE NOCASE`,
    [termo, termo]
  );
}

function obter(id) {
  return um('SELECT * FROM servicos WHERE id = ?', [id]);
}

function inserir(s) {
  return executar('INSERT INTO servicos (nome, descricao, mao_obra_padrao) VALUES (?, ?, ?)', [
    s.nome,
    s.descricao,
    s.mao_obra_padrao,
  ]).id;
}

function atualizar(id, s) {
  executar('UPDATE servicos SET nome = ?, descricao = ?, mao_obra_padrao = ? WHERE id = ?', [
    s.nome,
    s.descricao,
    s.mao_obra_padrao,
    id,
  ]);
}

function excluir(id) {
  executar('DELETE FROM servicos WHERE id = ?', [id]);
}

function contarOrcamentos(id) {
  return um('SELECT COUNT(*) AS total FROM orcamentos WHERE servico_id = ?', [id]).total;
}

module.exports = { listar, obter, inserir, atualizar, excluir, contarOrcamentos };
