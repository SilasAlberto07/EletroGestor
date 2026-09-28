// Lista de todos os orçamentos, com filtro por status e busca
import { tabela } from '../../components/tabela.js';
import { statusSelect } from '../../components/statusBadge.js';
import { confirmar } from '../../components/modal.js';
import { avisar, avisarErro } from '../../components/toast.js';
import { icones } from '../../components/icons.js';
import { esc, numeroOrcamento, aguardarDigitacao } from '../../js/utils/dom.js';
import { formatarMoeda } from '../../js/utils/moeda.js';
import { formatarData } from '../../js/utils/data.js';

const FILTROS = [
  { valor: '', nome: 'Todos' },
  { valor: 'aguardando', nome: 'Aguardando' },
  { valor: 'aprovado', nome: 'Aprovados' },
  { valor: 'recusado', nome: 'Recusados' },
];

export async function render(raiz) {
  let status = '';
  let linhas = [];

  raiz.innerHTML = `
    <div class="pagina">
      <div class="pagina-topo">
        <h1>Orçamentos</h1>
        <a class="btn btn-primario" href="#/orcamentos/novo">${icones.mais} Novo orçamento</a>
      </div>
      <section class="painel">
        <div class="filtros">
          <div class="abas">
            ${FILTROS.map((f) => `<button type="button" data-filtro="${f.valor}" class="${f.valor === status ? 'ativa' : ''}">${f.nome}</button>`).join('')}
          </div>
          <input type="search" class="busca" placeholder="Buscar por cliente, serviço ou número...">
        </div>
        <div class="lista"><div class="carregando">Carregando...</div></div>
      </section>
    </div>`;

  const lista = raiz.querySelector('.lista');
  const busca = raiz.querySelector('.busca');

  async function carregar() {
    try {
      linhas = await window.api.orcamentos.listar({ status, busca: busca.value });
      lista.innerHTML = tabela({
        colunas: [
          { titulo: 'Nº', campo: 'id', formatar: (id) => numeroOrcamento(id) },
          { titulo: 'Data', campo: 'criado_em', formatar: (d) => formatarData(d), classe: 'fraco' },
          { titulo: 'Cliente', campo: 'cliente_nome' },
          { titulo: 'Serviço', campo: 'servico_nome', formatar: (v) => esc(v || '-') },
          { titulo: 'Valor', campo: 'total', formatar: (v) => formatarMoeda(v) },
          { titulo: 'Status', campo: 'status', formatar: (s, l) => statusSelect(s, l.id) },
        ],
        linhas,
        acoes: ['editar', 'pdf', 'excluir'],
        clicavel: true,
        classe: 'tabela-grande',
        vazio: 'Nenhum orçamento encontrado.',
      });
    } catch (err) {
      avisarErro(err);
    }
  }

  raiz.querySelector('.abas').addEventListener('click', (e) => {
    const botao = e.target.closest('[data-filtro]');
    if (!botao) return;
    status = botao.dataset.filtro;
    raiz.querySelectorAll('.abas button').forEach((b) => b.classList.toggle('ativa', b === botao));
    carregar();
  });

  busca.addEventListener('input', aguardarDigitacao(carregar));

  // Troca de status direto na lista
  lista.addEventListener('change', async (e) => {
    const select = e.target.closest('[data-status-id]');
    if (!select) return;
    try {
      await window.api.orcamentos.mudarStatus(Number(select.dataset.statusId), select.value);
      select.className = `select-status status-${select.value}`;
      avisar(`Status de ${numeroOrcamento(select.dataset.statusId)} alterado.`);
      if (status) carregar(); // some da lista filtrada
    } catch (err) {
      avisarErro(err);
    }
  });

  lista.addEventListener('click', async (e) => {
    if (e.target.closest('select')) return;
    const tr = e.target.closest('tr[data-id]');
    if (!tr) return;
    const id = Number(tr.dataset.id);
    const acao = e.target.closest('[data-acao]')?.dataset.acao;

    if (acao === 'pdf') {
      try {
        const caminho = await window.api.orcamentos.gerarPdf(id);
        if (caminho) avisar(`PDF gerado: ${caminho}`);
      } catch (err) {
        avisarErro(err);
      }
      return;
    }

    if (acao === 'excluir') {
      const orc = linhas.find((l) => l.id === id);
      const ok = await confirmar(
        `Excluir o orçamento ${numeroOrcamento(id)} de ${orc.cliente_nome}? Esta ação não pode ser desfeita.`,
        { titulo: 'Excluir orçamento' }
      );
      if (!ok) return;
      try {
        await window.api.orcamentos.excluir(id);
        avisar('Orçamento excluído.');
        carregar();
      } catch (err) {
        avisarErro(err);
      }
      return;
    }

    location.hash = `#/orcamentos/${id}`; // editar
  });

  await carregar();
}
