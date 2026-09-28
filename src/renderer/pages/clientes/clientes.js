// Cadastro de clientes
import { criarPaginaCrud } from '../../components/crudPage.js';
import { esc } from '../../js/utils/dom.js';

const pagina = criarPaginaCrud({
  titulo: 'Clientes',
  singular: 'cliente',
  api: window.api.clientes,
  campoNome: 'nome',
  campos: [
    { nome: 'nome', rotulo: 'Nome', obrigatorio: true, inteira: true },
    { nome: 'telefone', rotulo: 'Telefone' },
    { nome: 'documento', rotulo: 'CPF / CNPJ' },
    { nome: 'email', rotulo: 'E-mail', tipo: 'email', inteira: true },
    { nome: 'endereco', rotulo: 'Endereço', inteira: true },
    { nome: 'observacoes', rotulo: 'Observações', tipo: 'textarea', inteira: true },
  ],
  colunas: [
    { titulo: 'Nome', campo: 'nome' },
    { titulo: 'Telefone', campo: 'telefone', formatar: (v) => esc(v || '-') },
    { titulo: 'E-mail', campo: 'email', formatar: (v) => esc(v || '-') },
    { titulo: 'Endereço', campo: 'endereco', formatar: (v) => esc(v || '-'), classe: 'fraco' },
  ],
});

export const render = pagina.render;
