// Página de criar / editar um orçamento
import { montarFormOrcamento } from '../../components/formOrcamento.js';

export async function render(raiz, { id } = {}) {
  raiz.innerHTML = `
    <div class="pagina">
      <div class="pagina-topo">
        <div>
          <a class="voltar" href="#/orcamentos">← Voltar para orçamentos</a>
          <h1>${id ? 'Editar orçamento' : 'Novo orçamento'}</h1>
        </div>
      </div>
      <div class="formulario"></div>
    </div>`;

  await montarFormOrcamento(raiz.querySelector('.formulario'), {
    id: id ? Number(id) : null,
    aoSalvar: (orcamento, eraNovo) => {
      if (eraNovo) {
        // Atualiza o endereço sem recarregar a tela
        history.replaceState(null, '', `#/orcamentos/${orcamento.id}`);
        raiz.querySelector('h1').textContent = 'Editar orçamento';
      }
    },
  });
}
