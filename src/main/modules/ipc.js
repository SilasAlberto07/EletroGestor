// Ajuda a registrar canais IPC com tratamento de erro padronizado.
// Toda resposta volta como { ok: true, dados } ou { ok: false, erro }.
const { ipcMain } = require('electron');

function registrar(canal, funcao) {
  ipcMain.handle(canal, async (evento, ...args) => {
    try {
      return { ok: true, dados: await funcao(evento, ...args) };
    } catch (erro) {
      console.error(`[${canal}]`, erro);
      return { ok: false, erro: erro.message || 'Erro inesperado.' };
    }
  });
}

// Converte texto/número em valor monetário com 2 casas
function dinheiro(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function texto(valor) {
  return valor == null ? '' : String(valor).trim();
}

module.exports = { registrar, dinheiro, texto };
