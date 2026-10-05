// Ajustes de interface que só existem no celular:
// barra do topo com botão de menu, menu lateral que abre por cima,
// botão "voltar" do Android e textos que mudam no celular.
import { App } from '@capacitor/app';
import { ehCelular, aguardarGravacao } from './armazenamento.js';

const ICONE_MENU =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>';

function abrirMenu(sim) {
  document.body.classList.toggle('menu-aberto', sim);
}

function montarBarraTopo() {
  const barra = document.createElement('header');
  barra.className = 'barra-celular';
  barra.innerHTML = `
    <button type="button" class="botao-menu" aria-label="Abrir menu">${ICONE_MENU}</button>
    <span class="barra-titulo">EletroGestor</span>`;
  document.body.prepend(barra);

  const fundo = document.createElement('div');
  fundo.className = 'menu-fundo';
  document.body.appendChild(fundo);

  barra.querySelector('.botao-menu').addEventListener('click', () =>
    abrirMenu(!document.body.classList.contains('menu-aberto'))
  );
  fundo.addEventListener('click', () => abrirMenu(false));
  // Escolheu uma página no menu: fecha o menu
  document.getElementById('sidebar').addEventListener('click', (e) => {
    if (e.target.closest('a')) abrirMenu(false);
  });
  window.addEventListener('hashchange', () => abrirMenu(false));
}

// Alguns textos do computador não fazem sentido no celular
const TEXTOS = [
  ['[data-instalar], [data-acao=instalar-atualizacao]', 'Baixar atualização'],
  ['[data-acao=backup]', 'Fazer backup (compartilhar)'],
];

function ajustarTextos() {
  const aplicar = () =>
    TEXTOS.forEach(([seletor, texto]) =>
      document.querySelectorAll(seletor).forEach((el) => {
        if (el.textContent !== texto) el.textContent = texto;
      })
    );
  new MutationObserver(aplicar).observe(document.body, { childList: true, subtree: true });
  aplicar();
}

function botaoVoltarAndroid() {
  App.addListener('backButton', () => {
    const modal = document.querySelector('.modal-fundo [data-fechar]');
    if (modal) return modal.click(); // fecha a janela aberta
    if (document.body.classList.contains('menu-aberto')) return abrirMenu(false);
    const pagina = location.hash || '#/inicio';
    if (pagina === '#/inicio') return App.exitApp();
    if (history.length > 1) history.back();
    else location.hash = '#/inicio';
  });

  // Antes de ir para segundo plano, termina de gravar os dados
  App.addListener('pause', () => aguardarGravacao());
}

export function iniciarInterfaceCelular() {
  document.body.classList.add('celular');
  const iniciar = () => {
    montarBarraTopo();
    ajustarTextos();
    if (ehCelular()) botaoVoltarAndroid();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
}
