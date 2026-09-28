// Backup e restauração do banco de dados
const { dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const { exportarBanco, substituirBanco } = require('../database/connection');

function dataHoje() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function fazerBackup(janela) {
  const resultado = await dialog.showSaveDialog(janela, {
    title: 'Salvar backup',
    defaultPath: path.join(app.getPath('documents'), `eletrogestor-backup-${dataHoje()}.db`),
    filters: [{ name: 'Backup EletroGestor', extensions: ['db'] }],
  });
  if (resultado.canceled || !resultado.filePath) return null;

  fs.writeFileSync(resultado.filePath, exportarBanco());
  return resultado.filePath;
}

async function restaurarBackup(janela) {
  const resultado = await dialog.showOpenDialog(janela, {
    title: 'Restaurar backup',
    properties: ['openFile'],
    filters: [{ name: 'Backup EletroGestor', extensions: ['db'] }],
  });
  if (resultado.canceled || !resultado.filePaths.length) return false;

  const confirmacao = await dialog.showMessageBox(janela, {
    type: 'warning',
    buttons: ['Restaurar', 'Cancelar'],
    defaultId: 1,
    cancelId: 1,
    title: 'Restaurar backup',
    message: 'Os dados atuais serão substituídos pelos dados do backup.',
    detail: 'Recomendamos fazer um backup dos dados atuais antes de continuar.',
  });
  if (confirmacao.response !== 0) return false;

  substituirBanco(fs.readFileSync(resultado.filePaths[0]));
  return true;
}

module.exports = { fazerBackup, restaurarBackup };
