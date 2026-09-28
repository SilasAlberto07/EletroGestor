// Página padrão de cadastro (lista + busca + formulário em modal).
// Usada por Clientes, Serviços e Materiais.
import { tabela } from './tabela.js';
import { abrirModal, confirmar } from './modal.js';
import { avisar, avisarErro } from './toast.js';
import { icones } from './icons.js';
import { esc, aguardarDigitacao } from '../js/utils/dom.js';
import { formatarDecimal, lerNumero } from '../js/utils/moeda.js';

/**
 * cfg = {
 *   titulo: 'Clientes', singular: 'cliente', api: window.api.clientes,
 *   campos: [{ nome, rotulo, tipo: 'text'|'dinheiro'|'textarea'|'select', opcoes, obrigatorio, inteira }],
 *   colunas: [{ titulo, campo, formatar, classe }],
 *   campoNome: 'nome'  // usado na mensagem de exclusão
 * }
 */
export function criarPaginaCrud(cfg) {
  return {
    async render(raiz) {
      raiz.innerHTML = `
        <div class="pagina">
          <div class="pagina-topo">
            <h1>${esc(cfg.titulo)}</h1>
            <button class="btn btn-primario" data-acao="novo">${icones.mais} Novo ${esc(cfg.singular)}</button>
          </div>
          <section class="painel">
            <div class="filtros">
              <input type="search" class="busca" placeholder="Buscar ${esc(cfg.singular)}...">
            </div>
            <div class="lista"><div class="carregando">Carregando...</div></div>
          </section>
        </div>`;

      const lista = raiz.querySelector('.lista');
      const busca = raiz.querySelector('.busca');
      let linhas = [];

      async function carregar() {
        try {
          linhas = await cfg.api.listar(busca.value);
          lista.innerHTML = tabela({
            colunas: cfg.colunas,
            linhas,
            acoes: ['editar', 'excluir'],
            clicavel: true,
            classe: 'tabela-grande',
            vazio: busca.value ? 'Nada encontrado para esta busca.' : `Nenhum ${cfg.singular} cadastrado ainda.`,
          });
        } catch (err) {
          avisarErro(err);
        }
      }

      function abrirFormulario(registro = null) {
        const corpo = `<div class="grade-form">${cfg.campos.map((c) => campoHtml(c, registro)).join('')}</div>`;
        abrirModal({
          titulo: registro ? `Editar ${cfg.singular}` : `Novo ${cfg.singular}`,
          corpo,
          aoConfirmar: async (form) => {
            const dados = Object.fromEntries(new FormData(form));
            cfg.campos.forEach((c) => {
              if (c.tipo === 'dinheiro') dados[c.nome] = lerNumero(dados[c.nome]);
            });
            if (registro) dados.id = registro.id;
            await cfg.api.salvar(dados);
            avisar(registro ? 'Alterações salvas.' : `${capitalizar(cfg.singular)} cadastrado.`);
            await carregar();
          },
        });
      }

      raiz.addEventListener('click', async (e) => {
        if (e.target.closest('[data-acao=novo]')) return abrirFormulario();

        const tr = e.target.closest('tr[data-id]');
        if (!tr) return;
        const registro = linhas.find((l) => String(l.id) === tr.dataset.id);
        const acao = e.target.closest('[data-acao]')?.dataset.acao;

        if (acao === 'excluir') {
          const nome = registro[cfg.campoNome || 'nome'];
          if (await confirmar(`Excluir "${nome}"? Esta ação não pode ser desfeita.`, { titulo: `Excluir ${cfg.singular}` })) {
            try {
              await cfg.api.excluir(registro.id);
              avisar(`${capitalizar(cfg.singular)} excluído.`);
              await carregar();
            } catch (err) {
              avisarErro(err);
            }
          }
          return;
        }
        abrirFormulario(registro); // clique na linha ou no lápis
      });

      busca.addEventListener('input', aguardarDigitacao(carregar));
      await carregar();
    },
  };
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function campoHtml(campo, registro) {
  const valor = registro ? registro[campo.nome] ?? '' : campo.padrao ?? '';
  const obrigatorio = campo.obrigatorio ? ' <span class="obrigatorio">*</span>' : '';
  const classe = `campo ${campo.inteira ? 'inteira' : ''}`;
  let controle;

  switch (campo.tipo) {
    case 'textarea':
      controle = `<textarea name="${campo.nome}" rows="3">${esc(valor)}</textarea>`;
      break;
    case 'select':
      controle = `<select name="${campo.nome}">${campo.opcoes
        .map((o) => `<option value="${esc(o.valor)}" ${o.valor === valor ? 'selected' : ''}>${esc(o.nome)}</option>`)
        .join('')}</select>`;
      break;
    case 'dinheiro':
      controle = `<input name="${campo.nome}" inputmode="decimal" value="${formatarDecimal(valor || 0)}">`;
      break;
    default:
      controle = `<input name="${campo.nome}" type="${campo.tipo || 'text'}" value="${esc(valor)}" ${campo.obrigatorio ? 'required' : ''}>`;
  }
  return `<label class="${classe}"><span>${esc(campo.rotulo)}${obrigatorio}</span>${controle}</label>`;
}
