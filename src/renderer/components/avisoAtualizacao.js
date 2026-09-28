// Aviso de atualização no rodapé do menu lateral
import { avisarErro } from './toast.js';
import { esc } from '../js/utils/dom.js';

export function textoEstado(e) {
  switch (e.estado) {
    case 'verificando':
      return 'Procurando atualizações...';
    case 'atualizado':
      return 'Você está usando a versão mais recente.';
    case 'baixando':
      return `Baixando a versão ${e.versaoNova || ''}... ${e.progresso || 0}%`;
    case 'pronta':
      return `A versão ${e.versaoNova} está pronta para instalar.`;
    case 'erro':
    case 'dev':
      return e.mensagem;
    default:
      return '';
  }
}

export async function instalarAtualizacao() {
  try {
    await window.api.atualizacao.instalar();
  } catch (err) {
    avisarErro(err);
  }
}

export async function montarAvisoAtualizacao(elemento) {
  function render(e) {
    if (e.estado === 'baixando') {
      elemento.hidden = false;
      elemento.innerHTML = `
        <div class="atualizacao-titulo">Baixando atualização</div>
        <div class="atualizacao-barra"><span style="width:${Number(e.progresso) || 0}%"></span></div>`;
    } else if (e.estado === 'pronta') {
      elemento.hidden = false;
      elemento.innerHTML = `
        <div class="atualizacao-titulo">Nova versão ${esc(e.versaoNova)} disponível</div>
        <button type="button" class="btn btn-primario" data-instalar>Reiniciar e atualizar</button>`;
    } else {
      elemento.hidden = true;
    }
  }

  elemento.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-instalar]')) instalarAtualizacao();
  });
  window.api.atualizacao.aoMudar(render);
  render(await window.api.atualizacao.estado());
}
