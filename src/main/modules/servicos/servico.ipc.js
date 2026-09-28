// Canais de comunicação entre a tela e o módulo de serviços
const { registrar } = require('../ipc');
const service = require('./servico.service');

function registrarServicos() {
  registrar('servicos:listar', (_e, busca) => service.listar(busca));
  registrar('servicos:obter', (_e, id) => service.obter(id));
  registrar('servicos:salvar', (_e, dados) => service.salvar(dados));
  registrar('servicos:excluir', (_e, id) => service.excluir(id));
}

module.exports = { registrarServicos };
