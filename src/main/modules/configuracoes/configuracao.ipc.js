// Canais de comunicação das Configurações, backup e pasta de dados
const { app, BrowserWindow, dialog, shell } = require('electron');
const { registrar } = require('../ipc');
const service = require('./configuracao.service');
const { fazerBackup, restaurarBackup } = require('../../utils/backup');
const { caminhoBanco, pastaDados } = require('../../utils/paths');

function registrarConfiguracoes() {
  registrar('config:obter', () => service.obter());
  registrar('config:salvar', (_e, dados) => service.salvar(dados));
  registrar('config:info', () => ({ versao: app.getVersion(), caminhoBanco: caminhoBanco() }));
  registrar('config:backup', (e) => fazerBackup(BrowserWindow.fromWebContents(e.sender)));
  registrar('config:restaurar', (e) => restaurarBackup(BrowserWindow.fromWebContents(e.sender)));
  registrar('config:abrirPastaDados', () => shell.openPath(pastaDados()));

  // Abre a janela para escolher a imagem da logo. Retorna a logo ou null se cancelar.
  registrar('config:escolherLogo', async (e) => {
    const escolha = await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender), {
      title: 'Escolher logo da empresa',
      properties: ['openFile'],
      filters: [{ name: 'Imagens', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }],
    });
    if (escolha.canceled || !escolha.filePaths.length) return null;
    return service.salvarLogoDoArquivo(escolha.filePaths[0]);
  });
  registrar('config:removerLogo', () => service.removerLogo());
}

module.exports = { registrarConfiguracoes };
