// Ponto de entrada das telas
import { montarSidebar } from '../components/sidebar.js';
import { iniciarRotas } from './router.js';

montarSidebar(document.getElementById('sidebar'));
iniciarRotas();

// O menu do topo (Arquivo > Novo orçamento, etc.) pede para trocar de tela
window.api.aoNavegar((rota) => {
  location.hash = `#${rota}`;
});
