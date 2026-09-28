// Cadastro de serviços
import { criarPaginaCrud } from '../../components/crudPage.js';
import { esc } from '../../js/utils/dom.js';
import { formatarMoeda } from '../../js/utils/moeda.js';

const pagina = criarPaginaCrud({
  titulo: 'Serviços',
  singular: 'serviço',
  api: window.api.servicos,
  campoNome: 'nome',
  campos: [
    { nome: 'nome', rotulo: 'Nome do serviço', obrigatorio: true, inteira: true },
    { nome: 'mao_obra_padrao', rotulo: 'Mão de obra padrão (R$)', tipo: 'dinheiro' },
    { nome: 'descricao', rotulo: 'Descrição', tipo: 'textarea', inteira: true },
  ],
  colunas: [
    { titulo: 'Serviço', campo: 'nome' },
    { titulo: 'Descrição', campo: 'descricao', formatar: (v) => esc(v || '-'), classe: 'fraco' },
    { titulo: 'Mão de obra padrão', campo: 'mao_obra_padrao', formatar: (v) => formatarMoeda(v) },
  ],
});

export const render = pagina.render;
