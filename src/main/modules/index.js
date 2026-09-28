// Registra os canais de todos os módulos.
// Para criar um módulo novo: crie a pasta, o arquivo *.ipc.js e adicione aqui.
const { registrarDashboard } = require('./dashboard/dashboard.ipc');
const { registrarOrcamentos } = require('./orcamentos/orcamento.ipc');
const { registrarClientes } = require('./clientes/cliente.ipc');
const { registrarServicos } = require('./servicos/servico.ipc');
const { registrarMateriais } = require('./materiais/material.ipc');
const { registrarConfiguracoes } = require('./configuracoes/configuracao.ipc');

function registrarModulos() {
  registrarDashboard();
  registrarOrcamentos();
  registrarClientes();
  registrarServicos();
  registrarMateriais();
  registrarConfiguracoes();
}

module.exports = { registrarModulos };
