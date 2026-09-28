// Ponto de entrada do EletroGestor (processo principal do Electron)
const { app, BrowserWindow } = require('electron');
const { abrirBanco } = require('./database/connection');
const { registrarModulos } = require('./modules');
const { criarJanela } = require('./window');
const { criarMenu } = require('./menu');

// Impede abrir o programa duas vezes ao mesmo tempo
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const janela = BrowserWindow.getAllWindows()[0];
    if (janela) {
      if (janela.isMinimized()) janela.restore();
      janela.focus();
    }
  });

  app.whenReady().then(async () => {
    await abrirBanco();
    registrarModulos();
    criarMenu();
    criarJanela();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) criarJanela();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
