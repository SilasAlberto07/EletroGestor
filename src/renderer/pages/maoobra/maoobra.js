// Cadastro dos tipos de mão de obra (usados na lista "Mão de Obra" do orçamento)
import { criarPaginaCrud } from '../../components/crudPage.js';
import { esc } from '../../js/utils/dom.js';
import { formatarMoeda } from '../../js/utils/moeda.js';

const UNIDADES = [
  { valor: 'cv', nome: 'CV' },
  { valor: 'ponto', nome: 'Ponto' },
  { valor: 'h', nome: 'Hora (h)' },
  { valor: 'm', nome: 'Metro (m)' },
  { valor: 'dia', nome: 'Dia' },
  { valor: 'un', nome: 'Unidade / chamado (un)' },
];

const pagina = criarPaginaCrud({
  titulo: 'Mão de Obra',
  singular: 'tipo de mão de obra',
  api: window.api.maoObra,
  campoNome: 'descricao',
  // Os 6 tipos são fixos: só o valor de cada um pode ser alterado
  permitirNovo: false,
  acoes: ['editar'],
  campos: [
    { nome: 'descricao', rotulo: 'Tipo de mão de obra', inteira: true, somenteLeitura: true },
    { nome: 'unidade', rotulo: 'Cobrado por', tipo: 'select', opcoes: UNIDADES, somenteLeitura: true },
    { nome: 'preco', rotulo: 'Valor (R$)', tipo: 'dinheiro' },
  ],
  colunas: [
    { titulo: 'Tipo de mão de obra', campo: 'descricao' },
    { titulo: 'Cobrado por', campo: 'unidade', formatar: (v) => esc(UNIDADES.find((u) => u.valor === v)?.nome || v) },
    { titulo: 'Valor', campo: 'preco', formatar: (v) => formatarMoeda(v) },
  ],
});

export const render = pagina.render;
