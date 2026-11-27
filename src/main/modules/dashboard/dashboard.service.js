// Números dos cards e lista de orçamentos recentes do Dashboard
const { um } = require('../../database/connection');
const orcamentos = require('../orcamentos/orcamento.repository');
const { numero } = require('../orcamentos/orcamento.service');

const DESTE_MES = "strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now', 'localtime')";

function resumo() {
  const mes = um(
    `SELECT COUNT(*) AS quantidade,
            IFNULL(SUM(total), 0) AS valor,
            SUM(CASE WHEN status = 'aprovado' THEN 1 ELSE 0 END) AS aprovados
     FROM orcamentos WHERE ${DESTE_MES}`
  );
  const aguardando = um("SELECT COUNT(*) AS total FROM orcamentos WHERE status = 'aguardando'").total;
  // Aprovados: TODOS, de qualquer mês (antes só contava os criados no mês atual,
  // e os aprovados "sumiam" quando o mês virava)
  const aprovados = um(
    "SELECT COUNT(*) AS quantidade, IFNULL(SUM(total), 0) AS valor FROM orcamentos WHERE status = 'aprovado'"
  );

  return {
    orcamentosMes: mes.quantidade,
    aguardando,
    aprovadosMes: mes.aprovados || 0,
    aprovados: aprovados.quantidade,
    valorAprovado: aprovados.valor,
    valorMes: mes.valor,
    recentes: orcamentos.recentes(5).map((o) => ({ ...o, numero: numero(o.id) })),
  };
}

module.exports = { resumo };
