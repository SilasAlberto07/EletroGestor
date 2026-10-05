// Canais de comunicação entre a tela e o módulo de mão de obra
const { registrar } = require('../ipc');
const service = require('./maoobra.service');

function registrarMaoObra() {
  registrar('maoObra:listar', (_e, busca) => service.listar(busca));
  registrar('maoObra:obter', (_e, id) => service.obter(id));
  registrar('maoObra:salvar', (_e, dados) => service.salvar(dados));
  registrar('maoObra:excluir', (_e, id) => service.excluir(id));
}

module.exports = { registrarMaoObra };
