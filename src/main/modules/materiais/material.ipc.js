// Canais de comunicação entre a tela e o módulo de materiais
const { registrar } = require('../ipc');
const service = require('./material.service');

function registrarMateriais() {
  registrar('materiais:listar', (_e, busca) => service.listar(busca));
  registrar('materiais:obter', (_e, id) => service.obter(id));
  registrar('materiais:salvar', (_e, dados) => service.salvar(dados));
  registrar('materiais:excluir', (_e, id) => service.excluir(id));
}

module.exports = { registrarMateriais };
