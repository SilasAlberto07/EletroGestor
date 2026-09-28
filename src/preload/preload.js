// Ponte segura entre as telas (HTML) e o processo principal.
// As telas só conseguem chamar o que estiver listado aqui, via window.api.
const { contextBridge, ipcRenderer } = require('electron');

const chamar =
  (canal) =>
  (...args) =>
    ipcRenderer.invoke(canal, ...args).then((resposta) => {
      if (!resposta.ok) throw new Error(resposta.erro);
      return resposta.dados;
    });

const crud = (modulo) => ({
  listar: chamar(`${modulo}:listar`),
  obter: chamar(`${modulo}:obter`),
  salvar: chamar(`${modulo}:salvar`),
  excluir: chamar(`${modulo}:excluir`),
});

contextBridge.exposeInMainWorld('api', {
  dashboard: {
    resumo: chamar('dashboard:resumo'),
  },
  orcamentos: {
    ...crud('orcamentos'),
    mudarStatus: chamar('orcamentos:mudarStatus'),
    gerarPdf: chamar('orcamentos:gerarPdf'),
  },
  clientes: crud('clientes'),
  servicos: crud('servicos'),
  materiais: crud('materiais'),
  config: {
    obter: chamar('config:obter'),
    salvar: chamar('config:salvar'),
    info: chamar('config:info'),
    backup: chamar('config:backup'),
    restaurar: chamar('config:restaurar'),
    abrirPastaDados: chamar('config:abrirPastaDados'),
    escolherLogo: chamar('config:escolherLogo'),
    removerLogo: chamar('config:removerLogo'),
  },
  // Permite que o menu do topo mude de tela
  aoNavegar: (callback) => ipcRenderer.on('navegar', (_evento, rota) => callback(rota)),
});
