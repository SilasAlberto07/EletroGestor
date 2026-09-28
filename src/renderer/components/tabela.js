// Monta uma tabela HTML a partir de uma lista de colunas e linhas
import { esc } from '../js/utils/dom.js';
import { icones } from './icons.js';

/**
 * colunas: [{ titulo, campo, formatar(valor, linha) -> html, classe }]
 * acoes: ['editar', 'pdf', 'excluir'] - botões no fim de cada linha
 */
export function tabela({ colunas, linhas, vazio = 'Nenhum registro encontrado.', acoes = [], clicavel = false, classe = '' }) {
  const cabecalho = colunas.map((c) => `<th class="${c.classe || ''}">${esc(c.titulo)}</th>`).join('');
  const temAcoes = acoes.length > 0;

  const corpo = linhas.length
    ? linhas
        .map((linha) => {
          const celulas = colunas
            .map((c) => {
              const valor = linha[c.campo];
              const html = c.formatar ? c.formatar(valor, linha) : esc(valor);
              return `<td class="${c.classe || ''}">${html}</td>`;
            })
            .join('');
          const botoes = temAcoes ? `<td class="acoes">${acoes.map((a) => botaoAcao(a)).join('')}</td>` : '';
          return `<tr data-id="${linha.id}" class="${clicavel ? 'clicavel' : ''}">${celulas}${botoes}</tr>`;
        })
        .join('')
    : `<tr><td class="vazio" colspan="${colunas.length + (temAcoes ? 1 : 0)}">${esc(vazio)}</td></tr>`;

  return `
    <table class="tabela ${classe}">
      <thead><tr>${cabecalho}${temAcoes ? '<th></th>' : ''}</tr></thead>
      <tbody>${corpo}</tbody>
    </table>`;
}

const ACOES = {
  editar: { titulo: 'Editar', icone: 'editar', classe: '' },
  pdf: { titulo: 'Gerar PDF', icone: 'pdf', classe: '' },
  excluir: { titulo: 'Excluir', icone: 'excluir', classe: 'perigo' },
};

function botaoAcao(nome) {
  const a = ACOES[nome];
  return `<button type="button" class="btn-icone ${a.classe}" data-acao="${nome}" title="${a.titulo}">${icones[a.icone]}</button>`;
}
