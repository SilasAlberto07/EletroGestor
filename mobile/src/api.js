// window.api para o celular.
// No computador, as telas falam com o Electron pelo preload.js. No celular não
// existe Electron: este arquivo cria o MESMO window.api, chamando diretamente os
// mesmos serviços (regras de negócio) da pasta src/main.
// Assim as telas (src/renderer) são exatamente as mesmas nos dois.
import { abrirBanco, exportarBanco, substituirBanco } from './connection.js';
import * as dashboard from '../../src/main/modules/dashboard/dashboard.service.js';
import * as orcamentos from '../../src/main/modules/orcamentos/orcamento.service.js';
import * as clientes from '../../src/main/modules/clientes/cliente.service.js';
import * as servicos from '../../src/main/modules/servicos/servico.service.js';
import * as materiais from '../../src/main/modules/materiais/material.service.js';
import * as maoObra from '../../src/main/modules/maoobra/maoobra.service.js';
import * as configuracoes from '../../src/main/modules/configuracoes/configuracao.service.js';
import { gerarPdf } from './pdf.js';
import { escolherLogo, removerLogo } from './logo.js';
import { compartilharArquivo, escolherArquivo, dataHoje } from './arquivos.js';
import * as atualizacao from './atualizacao.js';
import { iniciarInterfaceCelular } from './ui.js';
import { iniciarSincronizacao } from './sync-celular.js';

/* global __VERSAO__ */
const VERSAO = __VERSAO__;

// O banco abre uma vez; todas as chamadas esperam ele estar pronto
const pronto = abrirBanco();
pronto.catch((erro) => {
  console.error(erro);
  document.getElementById('app').innerHTML = `<div class="painel carregando">Erro ao abrir os dados: ${erro.message}</div>`;
});

// Igual ao preload: chama a função e devolve uma cópia do resultado
const chamar =
  (funcao) =>
  async (...args) => {
    await pronto;
    const resultado = await funcao(...args);
    return resultado === undefined ? undefined : structuredClone(resultado);
  };

const crud = (servico) => ({
  listar: chamar(servico.listar),
  obter: chamar(servico.obter),
  salvar: chamar(servico.salvar),
  excluir: chamar(servico.excluir),
});

async function fazerBackup() {
  const nome = `eletrogestor-backup-${dataHoje()}.db`;
  await compartilharArquivo(nome, exportarBanco(), 'application/octet-stream', 'Backup do EletroGestor');
  return null; // a tela de compartilhar já mostra o resultado
}

async function restaurarBackup() {
  const arquivo = await escolherArquivo();
  if (!arquivo) return false;
  const ok = window.confirm(
    'Os dados atuais serão substituídos pelos dados do backup.\n\nRecomendamos fazer um backup dos dados atuais antes de continuar.'
  );
  if (!ok) return false;
  substituirBanco(new Uint8Array(await arquivo.arrayBuffer()));
  exportarBanco(); // garante que ficou tudo certo
  return true;
}

window.api = {
  dashboard: { resumo: chamar(dashboard.resumo) },
  orcamentos: {
    ...crud(orcamentos),
    mudarStatus: chamar(orcamentos.mudarStatus),
    gerarPdf: chamar(gerarPdf),
  },
  clientes: crud(clientes),
  servicos: crud(servicos),
  materiais: crud(materiais),
  maoObra: crud(maoObra),
  config: {
    obter: chamar(configuracoes.obter),
    salvar: chamar(configuracoes.salvar),
    info: chamar(() => ({ versao: VERSAO, caminhoBanco: 'memória interna do celular (pasta do aplicativo)' })),
    backup: chamar(fazerBackup),
    restaurar: chamar(restaurarBackup),
    abrirPastaDados: chamar(() => {
      throw new Error('No celular, use "Fazer backup" para salvar uma cópia dos dados.');
    }),
    escolherLogo: chamar(escolherLogo),
    removerLogo: chamar(removerLogo),
  },
  atualizacao: {
    estado: async () => atualizacao.obterEstado(),
    verificar: async () => atualizacao.verificar(VERSAO),
    instalar: async () => atualizacao.instalar(),
    aoMudar: (callback) => atualizacao.aoMudar(callback),
  },
  sync: iniciarSincronizacao(pronto),
  aoNavegar: () => {},
};

iniciarInterfaceCelular();

// Procura atualização sozinho ao abrir (igual ao computador)
pronto.then(() => setTimeout(() => atualizacao.verificar(VERSAO), 4000));
