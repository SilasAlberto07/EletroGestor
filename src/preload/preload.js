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
  maoObra: crud('maoObra'),
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
  atualizacao: {
    estado: chamar('atualizacao:estado'),
    verificar: chamar('atualizacao:verificar'),
    instalar: chamar('atualizacao:instalar'),
    // Retorna uma função para parar de escutar
    aoMudar: (callback) => {
      const ouvinte = (_evento, estado) => callback(estado);
      ipcRenderer.on('atualizacao', ouvinte);
      return () => ipcRenderer.removeListener('atualizacao', ouvinte);
    },
  },
  // Permite que o menu do topo mude de tela
  aoNavegar: (callback) => ipcRenderer.on('navegar', (_evento, rota) => callback(rota)),
});
