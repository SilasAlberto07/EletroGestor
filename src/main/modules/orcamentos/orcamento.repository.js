// Acesso ao banco: tabelas orcamentos e orcamento_itens
const { todos, um, executar } = require('../../database/connection');

const SELECT_BASE = `
  SELECT o.*, c.nome AS cliente_nome, c.telefone AS cliente_telefone, c.email AS cliente_email,
         c.endereco AS cliente_endereco, c.documento AS cliente_documento,
         s.nome AS servico_nome
  FROM orcamentos o
  LEFT JOIN clientes c ON c.id = o.cliente_id
  LEFT JOIN servicos s ON s.id = o.servico_id`;

function listar({ status = '', busca = '' } = {}) {
  const condicoes = [];
  const parametros = [];

  if (status) {
    condicoes.push('o.status = ?');
    parametros.push(status);
  }
  if (busca) {
    const numero = parseInt(busca.replace(/\D/g, ''), 10);
    condicoes.push('(c.nome LIKE ? OR IFNULL(s.nome, \'\') LIKE ? OR o.id = ?)');
    parametros.push(`%${busca}%`, `%${busca}%`, Number.isNaN(numero) ? -1 : numero);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  return todos(`${SELECT_BASE} ${where} ORDER BY o.id DESC`, parametros);
}

function recentes(limite = 5) {
  return todos(`${SELECT_BASE} ORDER BY o.id DESC LIMIT ?`, [limite]);
}

function obter(id) {
  return um(`${SELECT_BASE} WHERE o.id = ?`, [id]);
}

function itens(orcamentoId) {
  return todos('SELECT * FROM orcamento_itens WHERE orcamento_id = ? ORDER BY id', [orcamentoId]);
}

function inserir(o) {
  return executar(
    `INSERT INTO orcamentos (cliente_id, servico_id, mao_obra, deslocamento, total, observacoes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [o.cliente_id, o.servico_id, o.mao_obra, o.deslocamento, o.total, o.observacoes]
  ).id;
}

function atualizar(id, o) {
  executar(
    `UPDATE orcamentos
     SET cliente_id = ?, servico_id = ?, mao_obra = ?, deslocamento = ?, total = ?, observacoes = ?,
         atualizado_em = datetime('now', 'localtime')
     WHERE id = ?`,
    [o.cliente_id, o.servico_id, o.mao_obra, o.deslocamento, o.total, o.observacoes, id]
  );
}

function removerItens(orcamentoId) {
  executar('DELETE FROM orcamento_itens WHERE orcamento_id = ?', [orcamentoId]);
}

function inserirItem(orcamentoId, item) {
  executar(
    `INSERT INTO orcamento_itens (orcamento_id, material_id, descricao, unidade, quantidade, unitario, total)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [orcamentoId, item.material_id, item.descricao, item.unidade, item.quantidade, item.unitario, item.total]
  );
}

function atualizarStatus(id, status) {
  executar(
    "UPDATE orcamentos SET status = ?, atualizado_em = datetime('now', 'localtime') WHERE id = ?",
    [status, id]
  );
}

function excluir(id) {
  executar('DELETE FROM orcamentos WHERE id = ?', [id]);
}

module.exports = {
  listar,
  recentes,
  obter,
  itens,
  inserir,
  atualizar,
  removerItens,
  inserirItem,
  atualizarStatus,
  excluir,
};
