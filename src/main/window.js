// Criação e configuração da janela principal
const { BrowserWindow, shell } = require('electron');
const path = require('path');

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 1100,
    minHeight: 680,
    title: 'EletroGestor',
    backgroundColor: '#eceff3',
    icon: path.join(__dirname, '..', 'renderer', 'assets', 'img', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true, // o HTML não acessa o Node diretamente
      nodeIntegration: false,
      sandbox: true,
    },
  });

  janela.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

  janela.once('ready-to-show', () => {
    janela.maximize();
    janela.show();
  });

  // Links externos abrem no navegador padrão, nunca dentro do app
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.argv.includes('--dev')) {
    janela.webContents.openDevTools({ mode: 'detach' });
  }

  return janela;
}

module.exports = { criarJanela };
