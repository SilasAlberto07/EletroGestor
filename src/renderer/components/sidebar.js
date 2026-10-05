// Menu lateral
import { icones, logo } from './icons.js';

const itens = [
  { rota: '/inicio', nome: 'Início', icone: 'inicio', chave: 'inicio' },
  { rota: '/orcamentos', nome: 'Orçamentos', icone: 'orcamentos', chave: 'orcamentos' },
  { rota: '/clientes', nome: 'Clientes', icone: 'clientes', chave: 'clientes' },
  { rota: '/servicos', nome: 'Serviços', icone: 'servicos', chave: 'servicos' },
  { rota: '/materiais', nome: 'Materiais', icone: 'materiais', chave: 'materiais' },
  { rota: '/mao-de-obra', nome: 'Mão de Obra', icone: 'maoobra', chave: 'maoobra' },
  { rota: '/configuracoes', nome: 'Configurações', icone: 'configuracoes', chave: 'configuracoes' },
];

export function montarSidebar(elemento) {
  elemento.innerHTML = `
    <div class="logo">${logo}<span>EletroGestor</span></div>
    <nav>
      ${itens
        .map((i) => `<a href="#${i.rota}" data-menu="${i.chave}">${icones[i.icone]}<span>${i.nome}</span></a>`)
        .join('')}
    </nav>
    <div class="sync-menu" hidden></div>
    <div class="atualizacao" hidden></div>
    <div class="rodape">EletroGestor v1.0</div>`;
}

export function marcarMenuAtivo(chave) {
  document.querySelectorAll('.sidebar nav a').forEach((a) => {
    a.classList.toggle('ativo', a.dataset.menu === chave);
  });
}
