// Página inicial: Dashboard
import { card } from '../../components/card.js';
import { tabela } from '../../components/tabela.js';
import { statusBadge } from '../../components/statusBadge.js';
import { montarFormOrcamento } from '../../components/formOrcamento.js';
import { avisarErro } from '../../components/toast.js';
import { esc, numeroOrcamento } from '../../js/utils/dom.js';
import { formatarMoedaCurta } from '../../js/utils/moeda.js';

export async function render(raiz) {
  raiz.innerHTML = `
    <div class="pagina">
      <div class="pagina-topo"><h1>Dashboard</h1></div>
      <div class="cards"></div>
      <section class="painel">
        <div class="painel-cabecalho">
          <h2>Orçamentos recentes</h2>
          <a href="#/orcamentos">Ver todos</a>
        </div>
        <div class="recentes"><div class="carregando">Carregando...</div></div>
      </section>
      <div class="novo-orcamento"></div>
    </div>`;

  async function atualizarResumo() {
    try {
      const r = await window.api.dashboard.resumo();

      raiz.querySelector('.cards').innerHTML = [
        card('Orçamentos deste mês', r.orcamentosMes),
        card('Aguardando aprovação', r.aguardando, 'laranja'),
        card('Aprovados', r.aprovadosMes, 'verde'),
        card('Valor total orçado', formatarMoedaCurta(r.valorMes), 'azul'),
      ].join('');

      raiz.querySelector('.recentes').innerHTML = tabela({
        colunas: [
          { titulo: 'Nº', campo: 'id', formatar: (id) => numeroOrcamento(id) },
          { titulo: 'Cliente', campo: 'cliente_nome' },
          { titulo: 'Serviço', campo: 'servico_nome', formatar: (v) => esc(v || '-') },
          { titulo: 'Valor', campo: 'total', formatar: (v) => formatarMoedaCurta(v) },
          { titulo: 'Status', campo: 'status', formatar: (s) => statusBadge(s) },
        ],
        linhas: r.recentes,
        clicavel: true,
        vazio: 'Nenhum orçamento ainda. Crie o primeiro logo abaixo.',
      });
    } catch (err) {
      avisarErro(err);
    }
  }

  // Clique em um orçamento recente abre para edição
  raiz.querySelector('.recentes').addEventListener('click', (e) => {
    const tr = e.target.closest('tr[data-id]');
    if (tr) location.hash = `#/orcamentos/${tr.dataset.id}`;
  });

  await Promise.all([
    atualizarResumo(),
    montarFormOrcamento(raiz.querySelector('.novo-orcamento'), {
      compacto: true,
      aoSalvar: atualizarResumo,
    }),
  ]);
}
