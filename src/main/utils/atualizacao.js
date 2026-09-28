// Atualização automática pelo GitHub Releases (electron-updater).
// Fluxo: verifica ao abrir -> baixa em segundo plano -> avisa na tela -> usuário clica em "Reiniciar e atualizar".
const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const { registrar } = require('../modules/ipc');
const { exportarBanco } = require('../database/connection');
const { pastaDados } = require('./paths');

// estado: 'parado' | 'verificando' | 'atualizado' | 'baixando' | 'pronta' | 'erro' | 'dev'
let estado = { estado: 'parado', versaoAtual: app.getVersion() };

function avisarTelas(novo) {
  estado = { ...estado, ...novo };
  BrowserWindow.getAllWindows().forEach((janela) => janela.webContents.send('atualizacao', estado));
}

function traduzirErro(erro) {
  const msg = String(erro?.message || erro);
  if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|net::/i.test(msg)) return 'Sem conexão com a internet.';
  if (/404/.test(msg)) return 'Nenhuma versão publicada encontrada no GitHub.';
  return 'Não foi possível verificar atualizações.';
}

// Guarda uma cópia do banco antes de instalar, por segurança
function backupAntesDeAtualizar() {
  const pasta = path.join(pastaDados(), 'backups');
  fs.mkdirSync(pasta, { recursive: true });
  const arquivo = path.join(pasta, `antes-da-v${estado.versaoNova || 'nova'}-${Date.now()}.db`);
  fs.writeFileSync(arquivo, exportarBanco());
}

async function verificar() {
  if (!app.isPackaged) {
    avisarTelas({ estado: 'dev', mensagem: 'A atualização automática só funciona no programa instalado.' });
    return estado;
  }
  if (['verificando', 'baixando', 'pronta'].includes(estado.estado)) return estado;
  try {
    await autoUpdater.checkForUpdates();
  } catch (erro) {
    avisarTelas({ estado: 'erro', mensagem: traduzirErro(erro) });
  }
  return estado;
}

function iniciarAtualizacao() {
  autoUpdater.autoDownload = true; // baixa sozinho quando houver versão nova
  autoUpdater.autoInstallOnAppQuit = true; // se o usuário não reiniciar, instala ao fechar

  autoUpdater.on('checking-for-update', () => avisarTelas({ estado: 'verificando', mensagem: '' }));
  autoUpdater.on('update-not-available', () => avisarTelas({ estado: 'atualizado', mensagem: '' }));
  autoUpdater.on('update-available', (info) => avisarTelas({ estado: 'baixando', versaoNova: info.version, progresso: 0 }));
  autoUpdater.on('download-progress', (p) => avisarTelas({ estado: 'baixando', progresso: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', (info) => avisarTelas({ estado: 'pronta', versaoNova: info.version }));
  autoUpdater.on('error', (erro) => {
    console.error('[atualizacao]', erro);
    avisarTelas({ estado: 'erro', mensagem: traduzirErro(erro) });
  });

  registrar('atualizacao:estado', () => estado);
  registrar('atualizacao:verificar', () => verificar());
  registrar('atualizacao:instalar', () => {
    if (estado.estado !== 'pronta') throw new Error('Nenhuma atualização pronta para instalar.');
    backupAntesDeAtualizar();
    setImmediate(() => autoUpdater.quitAndInstall(false, true)); // fecha, instala e abre de novo
    return true;
  });

  // Verifica 5 segundos depois de abrir e depois a cada 4 horas
  setTimeout(verificar, 5000);
  setInterval(verificar, 4 * 60 * 60 * 1000);
}

module.exports = { iniciarAtualizacao, verificar };
