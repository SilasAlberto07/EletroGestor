// Regras de negócio: clientes
const repo = require('./cliente.repository');
const { texto } = require('../ipc');

function validar(dados) {
  const cliente = {
    nome: texto(dados.nome),
    documento: texto(dados.documento),
    telefone: texto(dados.telefone),
    email: texto(dados.email),
    endereco: texto(dados.endereco),
    observacoes: texto(dados.observacoes),
  };
  if (!cliente.nome) throw new Error('Informe o nome do cliente.');
  if (cliente.email && !/^\S+@\S+\.\S+$/.test(cliente.email)) throw new Error('E-mail inválido.');
  return cliente;
}

function listar(busca) {
  return repo.listar(texto(busca));
}

function obter(id) {
  return repo.obter(id);
}

function salvar(dados) {
  const cliente = validar(dados);
  if (dados.id) {
    repo.atualizar(dados.id, cliente);
    return repo.obter(dados.id);
  }
  return repo.obter(repo.inserir(cliente));
}

function excluir(id) {
  const qtd = repo.contarOrcamentos(id);
  if (qtd > 0) {
    throw new Error(`Este cliente possui ${qtd} orçamento(s). Exclua os orçamentos antes de excluir o cliente.`);
  }
  repo.excluir(id);
  return true;
}

module.exports = { listar, obter, salvar, excluir };
