// Ponto de entrada das telas
import { montarSidebar } from '../components/sidebar.js';
import { montarAvisoAtualizacao } from '../components/avisoAtualizacao.js';
import { montarAvisoSincronizacao } from '../components/avisoSincronizacao.js';
import { iniciarRotas } from './router.js';

montarSidebar(document.getElementById('sidebar'));
iniciarRotas();
montarAvisoAtualizacao(document.querySelector('.sidebar .atualizacao'));
montarAvisoSincronizacao(document.querySelector('.sidebar .sync-menu'));

// Mostra a versão real no rodapé do menu
window.api.config.info().then((info) => {
  document.querySelector('.sidebar .rodape').textContent = `EletroGestor v${info.versao}`;
});

// O menu do topo (Arquivo > Novo orçamento, etc.) pede para trocar de tela
window.api.aoNavegar((rota) => {
  location.hash = `#${rota}`;
});
