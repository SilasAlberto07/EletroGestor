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

  // Lista de mão de obra: tipo x quantidade x valor
  const maoObraItens = (dados.mao_obra_itens || [])
    .map((linha) => ({
      tipo_id: Number(linha.tipo_id) || null,
      descricao: texto(linha.descricao),
      unidade: texto(linha.unidade) || 'un',
      quantidade: Number(linha.quantidade) || 0,
      unitario: dinheiro(linha.unitario),
    }))
    .filter((linha) => linha.descricao || linha.quantidade || linha.unitario); // ignora linhas vazias

  if (maoObraItens.length > 1) throw new Error('Informe apenas um tipo de mão de obra por orçamento.');

  maoObraItens.forEach((linha) => {
    if (!linha.tipo_id || !linha.descricao) throw new Error('Selecione o tipo de mão de obra.');
    if (linha.quantidade <= 0) throw new Error(`Informe a quantidade de "${linha.descricao}".`);
    if (linha.unitario < 0) throw new Error(`O valor de "${linha.descricao}" não pode ser negativo.`);
    linha.total = dinheiro(linha.quantidade * linha.unitario);
  });

  // Deslocamento: KM x valor do KM
  const km = Number(dados.deslocamento_km) || 0;
  const valorKm = dinheiro(dados.deslocamento_valor_km);
  if (km < 0 || valorKm < 0) throw new Error('Os valores do deslocamento não podem ser negativos.');

  const maoObra = dinheiro(maoObraItens.reduce((soma, linha) => soma + linha.total, 0));
  const deslocamento = dinheiro(km * valorKm);

  const totalMateriais = itens.reduce((soma, item) => soma + item.total, 0);
  const total = dinheiro(totalMateriais + maoObra + deslocamento);
  if (total <= 0) throw new Error('Adicione pelo menos um material, a mão de obra ou o deslocamento.');

  return {
    cliente_id: clienteId,
    servico_id: servicoId,
    mao_obra: maoObra,
    deslocamento,
    deslocamento_km: km,
    deslocamento_valor_km: valorKm,
    total,
    observacoes: texto(dados.observacoes),
    itens,
    mao_obra_itens: maoObraItens,
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
  orcamento.mao_obra_itens = repo.maoObra(id);

  // Orçamentos antigos (antes da lista de mão de obra / KM): mostra o valor como uma linha só
  if (!orcamento.mao_obra_itens.length && orcamento.mao_obra > 0) {
    orcamento.mao_obra_itens = [
      { tipo_id: null, descricao: 'Mão de obra', unidade: 'un', quantidade: 1, unitario: orcamento.mao_obra, total: orcamento.mao_obra },
    ];
  }
  if (!orcamento.deslocamento_km && orcamento.deslocamento > 0) {
    orcamento.deslocamento_km = 1;
    orcamento.deslocamento_valor_km = orcamento.deslocamento;
  }
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
      repo.removerMaoObra(orcamentoId);
    } else {
      orcamentoId = repo.inserir(orc);
    }
    orc.itens.forEach((item) => repo.inserirItem(orcamentoId, item));
    orc.mao_obra_itens.forEach((linha) => repo.inserirMaoObra(orcamentoId, linha));
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
