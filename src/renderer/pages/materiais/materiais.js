// Cadastro de materiais
import { criarPaginaCrud } from '../../components/crudPage.js';
import { esc } from '../../js/utils/dom.js';
import { formatarMoeda } from '../../js/utils/moeda.js';

const UNIDADES = [
  { valor: 'un', nome: 'Unidade (un)' },
  { valor: 'm', nome: 'Metro (m)' },
  { valor: 'rolo', nome: 'Rolo' },
  { valor: 'cx', nome: 'Caixa (cx)' },
  { valor: 'pç', nome: 'Peça (pç)' },
  { valor: 'par', nome: 'Par' },
  { valor: 'kg', nome: 'Quilo (kg)' },
  { valor: 'h', nome: 'Hora (h)' },
];

const pagina = criarPaginaCrud({
  titulo: 'Materiais',
  singular: 'material',
  api: window.api.materiais,
  campoNome: 'descricao',
  campos: [
    { nome: 'descricao', rotulo: 'Descrição', obrigatorio: true, inteira: true },
    { nome: 'unidade', rotulo: 'Unidade', tipo: 'select', opcoes: UNIDADES, padrao: 'un' },
    { nome: 'preco', rotulo: 'Preço unitário (R$)', tipo: 'dinheiro' },
  ],
  colunas: [
    { titulo: 'Descrição', campo: 'descricao' },
    { titulo: 'Unidade', campo: 'unidade', formatar: (v) => esc(v) },
    { titulo: 'Preço', campo: 'preco', formatar: (v) => formatarMoeda(v) },
  ],
});

export const render = pagina.render;
