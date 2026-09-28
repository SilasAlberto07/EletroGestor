// Regras de negócio: materiais
const repo = require('./material.repository');
const { texto, dinheiro } = require('../ipc');

function validar(dados) {
  const material = {
    descricao: texto(dados.descricao),
    unidade: texto(dados.unidade) || 'un',
    preco: dinheiro(dados.preco),
  };
  if (!material.descricao) throw new Error('Informe a descrição do material.');
  if (material.preco < 0) throw new Error('O preço não pode ser negativo.');
  return material;
}

function listar(busca) {
  return repo.listar(texto(busca));
}

function obter(id) {
  return repo.obter(id);
}

function salvar(dados) {
  const material = validar(dados);
  if (dados.id) {
    repo.atualizar(dados.id, material);
    return repo.obter(dados.id);
  }
  return repo.obter(repo.inserir(material));
}

// Os orçamentos guardam uma cópia da descrição e do preço,
// então excluir um material não altera orçamentos antigos.
function excluir(id) {
  repo.excluir(id);
  return true;
}

module.exports = { listar, obter, salvar, excluir };
