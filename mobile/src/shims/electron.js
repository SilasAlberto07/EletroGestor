// No celular não existe Electron. Os arquivos do computador que importam
// "electron" só usam essas partes em funções que o celular não chama.
const nada = () => {
  throw new Error('Função disponível apenas no computador.');
};
export const app = { getPath: () => '', getVersion: () => '' };
export const nativeImage = { createFromBuffer: nada };
export const BrowserWindow = { fromWebContents: () => null };
export const dialog = { showSaveDialog: nada, showOpenDialog: nada, showMessageBox: nada };
export const shell = { openPath: nada };
export const ipcMain = { handle: () => {} };
export default { app, nativeImage, BrowserWindow, dialog, shell, ipcMain };
