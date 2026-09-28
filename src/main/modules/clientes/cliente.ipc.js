// Canais de comunicação entre a tela e o módulo de clientes
const { registrar } = require('../ipc');
const service = require('./cliente.service');

function registrarClientes() {
  registrar('clientes:listar', (_e, busca) => service.listar(busca));
  registrar('clientes:obter', (_e, id) => service.obter(id));
  registrar('clientes:salvar', (_e, dados) => service.salvar(dados));
  registrar('clientes:excluir', (_e, id) => service.excluir(id));
}

module.exports = { registrarClientes };
