// Card de resumo do topo do Dashboard
import { esc } from '../js/utils/dom.js';

export function card(titulo, valor, cor = '') {
  return `
    <div class="card">
      <div class="card-titulo">${esc(titulo)}</div>
      <div class="card-valor ${cor}">${esc(valor)}</div>
    </div>`;
}
