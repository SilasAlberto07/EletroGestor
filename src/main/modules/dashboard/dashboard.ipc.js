// Canais de comunicação do Dashboard
const { registrar } = require('../ipc');
const service = require('./dashboard.service');

function registrarDashboard() {
  registrar('dashboard:resumo', () => service.resumo());
}

module.exports = { registrarDashboard };
