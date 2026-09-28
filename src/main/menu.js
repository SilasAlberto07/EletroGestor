// Menu do topo da janela (Arquivo, Exibir, Ajuda)
const { app, Menu, dialog, BrowserWindow } = require('electron');
const { fazerBackup } = require('./utils/backup');
const { verificar } = require('./utils/atualizacao');

function janelaAtual() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
}

function navegar(rota) {
  const janela = janelaAtual();
  if (janela) janela.webContents.send('navegar', rota);
}

function criarMenu() {
  const modelo = [
    {
      label: 'Arquivo',
      submenu: [
        { label: 'Novo orçamento', accelerator: 'CmdOrCtrl+N', click: () => navegar('/orcamentos/novo') },
        { type: 'separator' },
        { label: 'Fazer backup...', click: () => fazerBackup(janelaAtual()) },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ],
    },
    {
      label: 'Ir para',
      submenu: [
        { label: 'Início', accelerator: 'CmdOrCtrl+1', click: () => navegar('/inicio') },
        { label: 'Orçamentos', accelerator: 'CmdOrCtrl+2', click: () => navegar('/orcamentos') },
        { label: 'Clientes', accelerator: 'CmdOrCtrl+3', click: () => navegar('/clientes') },
        { label: 'Serviços', accelerator: 'CmdOrCtrl+4', click: () => navegar('/servicos') },
        { label: 'Materiais', accelerator: 'CmdOrCtrl+5', click: () => navegar('/materiais') },
        { label: 'Configurações', accelerator: 'CmdOrCtrl+6', click: () => navegar('/configuracoes') },
      ],
    },
    {
      label: 'Exibir',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Ferramentas do desenvolvedor', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Tamanho normal', role: 'resetZoom' },
        { label: 'Aumentar zoom', role: 'zoomIn' },
        { label: 'Diminuir zoom', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Tela cheia', role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Verificar atualizações',
          click: () => {
            navegar('/configuracoes');
            verificar();
          },
        },
        { type: 'separator' },
        {
          label: 'Sobre o EletroGestor',
          click: () =>
            dialog.showMessageBox(janelaAtual(), {
              type: 'info',
              title: 'Sobre',
              message: 'EletroGestor',
              detail: `Versão ${app.getVersion()}\nSistema de orçamentos para serviços elétricos.`,
            }),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(modelo));
}

module.exports = { criarMenu };
