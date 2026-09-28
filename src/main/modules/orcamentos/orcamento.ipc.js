// Canais de comunicação entre a tela e o módulo de orçamentos
const { BrowserWindow } = require('electron');
const { registrar } = require('../ipc');
const service = require('./orcamento.service');
const { gerarPdf } = require('./pdf/gerarPdf');

function registrarOrcamentos() {
  registrar('orcamentos:listar', (_e, filtros) => service.listar(filtros));
  registrar('orcamentos:obter', (_e, id) => service.obter(id));
  registrar('orcamentos:salvar', (_e, dados) => service.salvar(dados));
  registrar('orcamentos:mudarStatus', (_e, id, status) => service.mudarStatus(id, status));
  registrar('orcamentos:excluir', (_e, id) => service.excluir(id));
  registrar('orcamentos:gerarPdf', (e, id) =>
    gerarPdf(id, { janela: BrowserWindow.fromWebContents(e.sender) })
  );
}

module.exports = { registrarOrcamentos };
