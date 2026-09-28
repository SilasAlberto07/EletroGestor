// Janela de diálogo (modal) para formulários e confirmações
import { icones } from './icons.js';
import { esc } from '../js/utils/dom.js';

/**
 * Abre um modal com formulário.
 * aoConfirmar(form) pode ser async. Se lançar erro, a mensagem aparece no modal.
 */
export function abrirModal({ titulo, corpo, textoConfirmar = 'Salvar', classeConfirmar = 'btn-primario', aoConfirmar }) {
  const fundo = document.createElement('div');
  fundo.className = 'modal-fundo';
  fundo.innerHTML = `
    <form class="modal" novalidate>
      <header>
        <h3>${esc(titulo)}</h3>
        <button type="button" class="btn-icone" data-fechar title="Fechar">${icones.fechar}</button>
      </header>
      <div class="modal-corpo">
        ${corpo}
        <div class="modal-erro"></div>
      </div>
      <footer>
        <button type="button" class="btn btn-contorno" data-fechar>Cancelar</button>
        <button type="submit" class="btn ${classeConfirmar}">${esc(textoConfirmar)}</button>
      </footer>
    </form>`;

  const form = fundo.querySelector('form');
  const erro = fundo.querySelector('.modal-erro');
  const botao = fundo.querySelector('button[type=submit]');

  const fechar = () => {
    document.removeEventListener('keydown', aoTeclar);
    fundo.remove();
  };
  const aoTeclar = (e) => {
    if (e.key === 'Escape') fechar();
  };

  fundo.querySelectorAll('[data-fechar]').forEach((b) => b.addEventListener('click', fechar));
  fundo.addEventListener('mousedown', (e) => {
    if (e.target === fundo) fechar();
  });
  document.addEventListener('keydown', aoTeclar);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erro.textContent = '';
    botao.disabled = true;
    try {
      const resultado = await aoConfirmar?.(form);
      if (resultado !== false) fechar();
    } catch (err) {
      erro.textContent = err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '');
    } finally {
      botao.disabled = false;
    }
  });

  document.body.appendChild(fundo);
  const primeiroCampo = form.querySelector('input, select, textarea');
  (primeiroCampo || botao).focus();
  return { fechar, form };
}

// Pergunta de confirmação. Retorna true/false.
export function confirmar(mensagem, { titulo = 'Confirmar', textoConfirmar = 'Excluir', perigo = true } = {}) {
  return new Promise((resolver) => {
    let confirmado = false;
    const { form } = abrirModal({
      titulo,
      corpo: `<p>${esc(mensagem)}</p>`,
      textoConfirmar,
      classeConfirmar: perigo ? 'btn-perigo' : 'btn-primario',
      aoConfirmar: () => {
        confirmado = true;
      },
    });
    // Resolve quando o modal sair da tela (confirmado ou cancelado)
    const observador = new MutationObserver(() => {
      if (!document.body.contains(form)) {
        observador.disconnect();
        resolver(confirmado);
      }
    });
    observador.observe(document.body, { childList: true });
  });
}
