// Sincronização com o Google Drive: aviso no menu lateral, textos e ações comuns
import { avisar, avisarErro } from './toast.js';
import { confirmar } from './modal.js';
import { esc } from '../js/utils/dom.js';

function hora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hoje = new Date().toDateString() === d.toDateString();
  return hoje
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function textoSincronizacao(e) {
  if (!e || !e.conectado) return 'Desligada';
  switch (e.situacao) {
    case 'sincronizando':
      return 'Sincronizando...';
    case 'pendente':
      return 'Alterações a enviar...';
    case 'ok':
      return e.ultima ? `Sincronizado às ${hora(e.ultima)}` : 'Sincronizado';
    case 'offline':
      return 'Sem internet (envia depois)';
    case 'login':
      return 'Entre novamente no Google';
    case 'conflito':
      return 'Escolha qual versão manter';
    case 'erro':
      return 'Erro ao sincronizar';
    default:
      return '';
  }
}

export async function resolverConflito(escolha) {
  const mensagem =
    escolha === 'nuvem'
      ? 'Os dados DESTE aparelho serão trocados pelos dados do Google Drive (do outro aparelho). As alterações feitas aqui desde a última sincronização serão perdidas.'
      : 'Os dados do Google Drive serão trocados pelos dados DESTE aparelho. As alterações feitas no outro aparelho desde a última sincronização serão perdidas.';
  if (!(await confirmar(mensagem, { titulo: 'Confirmar escolha', textoConfirmar: 'Confirmar', perigo: true }))) return;
  try {
    await window.api.sync.resolverConflito(escolha);
    avisar('Pronto, dados sincronizados.');
  } catch (err) {
    avisarErro(err);
  }
}

export function htmlConflito() {
  return `
    <div class="sync-conflito">
      <p>Os dados foram alterados <strong>neste aparelho</strong> e também <strong>no outro</strong>. Qual versão manter?</p>
      <button type="button" class="btn btn-primario" data-sync="nuvem">Usar a do Google Drive</button>
      <button type="button" class="btn btn-contorno" data-sync="local">Manter a deste aparelho</button>
    </div>`;
}

// Bolinha + texto no menu lateral
export async function montarAvisoSincronizacao(elemento) {
  if (!window.api.sync) return;

  function render(e) {
    if (!e || !e.conectado) {
      elemento.hidden = true;
      return;
    }
    elemento.hidden = false;
    elemento.className = `sync-menu situacao-${e.situacao}`;
    elemento.innerHTML =
      e.situacao === 'conflito'
        ? htmlConflito()
        : `<a href="#/configuracoes" title="${esc(e.mensagem || '')}"><span class="sync-bolinha"></span>${esc(textoSincronizacao(e))}</a>`;
  }

  elemento.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-sync]');
    if (b) resolverConflito(b.dataset.sync);
  });

  window.api.sync.aoMudar(render);
  // Outro aparelho mudou os dados: mostra a página de novo com os dados atualizados
  // Se a pessoa estiver digitando (formulário aberto), não recarrega a tela no meio:
  // os dados novos aparecem quando ela trocar de página ou salvar.
  window.api.sync.aoBaixar(() => {
    const digitando =
      document.querySelector('.modal-fundo') ||
      document.activeElement?.matches?.('input, select, textarea') ||
      /^#\/orcamentos\/(novo|\d+)$/.test(location.hash);
    if (digitando) {
      avisar('Chegaram alterações do outro aparelho. Elas aparecem ao trocar de página.');
    } else {
      avisar('Dados atualizados com as alterações do outro aparelho.');
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    }
  });
  render(await window.api.sync.estado());
}
