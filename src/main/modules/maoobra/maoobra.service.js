// Regras de negócio: tipos de mão de obra
// Os 6 tipos são fixos (criados pelo sistema). Só o valor de cada um pode ser alterado.
const repo = require('./maoobra.repository');
const { texto, dinheiro } = require('../ipc');

function listar(busca) {
  return repo.listar(texto(busca));
}

function obter(id) {
  return repo.obter(id);
}

function salvar(dados) {
  const atual = dados.id ? repo.obter(dados.id) : null;
  if (!atual) throw new Error('Os tipos de mão de obra são fixos. Só é possível alterar o valor.');

  const preco = dinheiro(dados.preco);
  if (preco < 0) throw new Error('O valor não pode ser negativo.');

  repo.atualizar(atual.id, { descricao: atual.descricao, unidade: atual.unidade, preco });
  return repo.obter(atual.id);
}

function excluir() {
  throw new Error('Os tipos de mão de obra são fixos e não podem ser excluídos.');
}

module.exports = { listar, obter, salvar, excluir };
