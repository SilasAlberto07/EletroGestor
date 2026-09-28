// Regras de negócio: serviços
const repo = require('./servico.repository');
const { texto, dinheiro } = require('../ipc');

function validar(dados) {
  const servico = {
    nome: texto(dados.nome),
    descricao: texto(dados.descricao),
    mao_obra_padrao: dinheiro(dados.mao_obra_padrao),
  };
  if (!servico.nome) throw new Error('Informe o nome do serviço.');
  if (servico.mao_obra_padrao < 0) throw new Error('A mão de obra não pode ser negativa.');
  return servico;
}

function listar(busca) {
  return repo.listar(texto(busca));
}

function obter(id) {
  return repo.obter(id);
}

function salvar(dados) {
  const servico = validar(dados);
  if (dados.id) {
    repo.atualizar(dados.id, servico);
    return repo.obter(dados.id);
  }
  return repo.obter(repo.inserir(servico));
}

function excluir(id) {
  const qtd = repo.contarOrcamentos(id);
  if (qtd > 0) {
    throw new Error(`Este serviço é usado em ${qtd} orçamento(s) e não pode ser excluído.`);
  }
  repo.excluir(id);
  return true;
}

module.exports = { listar, obter, salvar, excluir };
