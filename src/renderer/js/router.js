// Troca de páginas pelo endereço (#/inicio, #/orcamentos/3 ...)
import { marcarMenuAtivo } from '../components/sidebar.js';

const rotas = [
  { padrao: /^\/inicio$/, menu: 'inicio', pagina: () => import('../pages/inicio/inicio.js') },
  { padrao: /^\/orcamentos$/, menu: 'orcamentos', pagina: () => import('../pages/orcamentos/lista.js') },
  { padrao: /^\/orcamentos\/novo$/, menu: 'orcamentos', pagina: () => import('../pages/orcamentos/editor.js') },
  { padrao: /^\/orcamentos\/(?<id>\d+)$/, menu: 'orcamentos', pagina: () => import('../pages/orcamentos/editor.js') },
  { padrao: /^\/clientes$/, menu: 'clientes', pagina: () => import('../pages/clientes/clientes.js') },
  { padrao: /^\/servicos$/, menu: 'servicos', pagina: () => import('../pages/servicos/servicos.js') },
  { padrao: /^\/materiais$/, menu: 'materiais', pagina: () => import('../pages/materiais/materiais.js') },
  { padrao: /^\/configuracoes$/, menu: 'configuracoes', pagina: () => import('../pages/configuracoes/configuracoes.js') },
];

let navegacaoAtual = 0;

async function abrirRota() {
  const caminho = location.hash.slice(1) || '/inicio';
  const app = document.getElementById('app');
  const numero = ++navegacaoAtual;

  let rota = null;
  let parametros = {};
  for (const r of rotas) {
    const encontrado = caminho.match(r.padrao);
    if (encontrado) {
      rota = r;
      parametros = encontrado.groups || {};
      break;
    }
  }

  if (!rota) {
    location.hash = '#/inicio';
    return;
  }

  marcarMenuAtivo(rota.menu);
  const raiz = document.createElement('div');

  try {
    const modulo = await rota.pagina();
    if (numero !== navegacaoAtual) return; // o usuário já foi para outra página
    app.replaceChildren(raiz);
    app.scrollTop = 0;
    await modulo.render(raiz, parametros);
  } catch (erro) {
    console.error(erro);
    raiz.innerHTML = `<div class="painel carregando">Erro ao abrir a página: ${erro.message}</div>`;
    app.replaceChildren(raiz);
  }
}

export function iniciarRotas() {
  window.addEventListener('hashchange', abrirRota);
  abrirRota();
}
