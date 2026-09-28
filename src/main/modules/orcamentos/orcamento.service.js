// Regras de negócio: orçamentos (cálculo dos totais, validação, status)
const repo = require('./orcamento.repository');
const clientes = require('../clientes/cliente.repository');
const servicos = require('../servicos/servico.repository');
const { transacao } = require('../../database/connection');
const { dinheiro, texto } = require('../ipc');

const STATUS = ['aguardando', 'aprovado', 'recusado'];

function numero(id) {
  return String(id).padStart(3, '0');
}

// Organiza e confere os dados vindos da tela, recalculando tudo no servidor
function montar(dados) {
  const clienteId = Number(dados.cliente_id);
  if (!clienteId || !clientes.obter(clienteId)) throw new Error('Selecione o cliente.');

  const servicoId = Number(dados.servico_id) || null;
  if (servicoId && !servicos.obter(servicoId)) throw new Error('Serviço não encontrado.');

  const itens = (dados.itens || [])
    .map((item) => ({
      material_id: Number(item.material_id) || null,
      descricao: texto(item.descricao),
      unidade: texto(item.unidade) || 'un',
      quantidade: Number(item.quantidade) || 0,
      unitario: dinheiro(item.unitario),
    }))
    .filter((item) => item.descricao || item.quantidade || item.unitario); // ignora linhas vazias

  itens.forEach((item, i) => {
    if (!item.descricao) throw new Error(`Informe a descrição do material na linha ${i + 1}.`);
    if (item.quantidade <= 0) throw new Error(`Informe a quantidade de "${item.descricao}".`);
    if (item.unitario < 0) throw new Error(`O valor unitário de "${item.descricao}" não pode ser negativo.`);
    item.total = dinheiro(item.quantidade * item.unitario);
  });

  const maoObra = dinheiro(dados.mao_obra);
  const deslocamento = dinheiro(dados.deslocamento);
  if (maoObra < 0 || deslocamento < 0) throw new Error('Valores não podem ser negativos.');

  const totalMateriais = itens.reduce((soma, item) => soma + item.total, 0);
  const total = dinheiro(totalMateriais + maoObra + deslocamento);
  if (total <= 0) throw new Error('Adicione pelo menos um material, a mão de obra ou o deslocamento.');

  return {
    cliente_id: clienteId,
    servico_id: servicoId,
    mao_obra: maoObra,
    deslocamento,
    total,
    observacoes: texto(dados.observacoes),
    itens,
  };
}

function listar(filtros) {
  return repo.listar({ status: texto(filtros?.status), busca: texto(filtros?.busca) });
}

function obter(id) {
  const orcamento = repo.obter(id);
  if (!orcamento) return null;
  orcamento.numero = numero(orcamento.id);
  orcamento.itens = repo.itens(id);
  return orcamento;
}

function salvar(dados) {
  const orc = montar(dados);
  const id = transacao(() => {
    let orcamentoId = Number(dados.id) || null;
    if (orcamentoId) {
      if (!repo.obter(orcamentoId)) throw new Error('Orçamento não encontrado.');
      repo.atualizar(orcamentoId, orc);
      repo.removerItens(orcamentoId);
    } else {
      orcamentoId = repo.inserir(orc);
    }
    orc.itens.forEach((item) => repo.inserirItem(orcamentoId, item));
    return orcamentoId;
  });
  return obter(id);
}

function mudarStatus(id, status) {
  if (!STATUS.includes(status)) throw new Error('Status inválido.');
  repo.atualizarStatus(id, status);
  return obter(id);
}

function excluir(id) {
  repo.excluir(id);
  return true;
}

module.exports = { listar, obter, salvar, mudarStatus, excluir, numero };
