// Sincronização com o Google Drive no celular.
// Login: usa o login de contas Google do próprio Android (sem digitar senha).
import { SocialLogin } from '@capgo/capacitor-social-login';
import { App } from '@capacitor/app';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import config from '../../src/main/sync/google-config.js';
import { criarSincronizacao } from '../../src/main/sync/sincronizacao.js';
import { exportarBanco, substituirBanco, definirAoAlterar, um } from './connection.js';
import { ehCelular } from './armazenamento.js';

const ARQUIVO_META = 'sincronizacao.json';
const ESCOPO_DRIVE = 'https://www.googleapis.com/auth/drive.file';
const configurado = !config.webClientId.startsWith('PREENCHER');

let iniciado = null;
let token = null; // { valor, quando }

function iniciarLogin() {
  if (!iniciado) iniciado = SocialLogin.initialize({ google: { webClientId: config.webClientId, mode: 'online' } });
  return iniciado;
}

// ---------- Guardar dados da sincronização (fora do banco) ----------
async function lerMeta() {
  if (!ehCelular()) return JSON.parse(localStorage.getItem(ARQUIVO_META) || '{}');
  try {
    const { data } = await Filesystem.readFile({ path: ARQUIVO_META, directory: Directory.Data, encoding: Encoding.UTF8 });
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function gravarMeta(meta) {
  const texto = JSON.stringify(meta);
  if (!ehCelular()) return localStorage.setItem(ARQUIVO_META, texto);
  await Filesystem.writeFile({ path: ARQUIVO_META, data: texto, directory: Directory.Data, encoding: Encoding.UTF8 });
}

// ---------- Token do Google ----------
async function obterToken() {
  if (!ehCelular()) return localStorage.getItem('eletrogestor.tokenTeste'); // só para testes no navegador
  if (token && Date.now() - token.quando < 45 * 60 * 1000) return token.valor;
  await iniciarLogin();
  try {
    // Renova em silêncio (sem mostrar nada) usando a conta já autorizada
    await SocialLogin.refresh({ provider: 'google', options: { scopes: [ESCOPO_DRIVE] } });
    const { accessToken } = await SocialLogin.getAuthorizationCode({ provider: 'google' });
    if (!accessToken) return null;
    token = { valor: accessToken, quando: Date.now() };
    return accessToken;
  } catch (erro) {
    console.warn('Não foi possível renovar o login do Google', erro);
    return null;
  }
}

async function entrar() {
  if (!ehCelular()) {
    if (localStorage.getItem('eletrogestor.tokenTeste')) return 'teste@exemplo.com';
    throw new Error('O login do Google só funciona no aplicativo instalado no celular.');
  }
  if (!configurado) throw new Error('A sincronização ainda não foi configurada (códigos do Google Cloud).');
  await iniciarLogin();
  const { result } = await SocialLogin.login({
    provider: 'google',
    options: { scopes: [ESCOPO_DRIVE], forcePrompt: true },
  });
  const valor = result?.accessToken?.token;
  if (!valor) throw new Error('O Google não liberou o acesso ao Drive. Tente novamente e marque a permissão do Drive.');
  token = { valor, quando: Date.now() };
  return result?.profile?.email || '';
}

async function sair() {
  token = null;
  if (ehCelular()) {
    try {
      await iniciarLogin();
      await SocialLogin.logout({ provider: 'google' });
    } catch {
      /* já estava desconectado */
    }
  } else {
    localStorage.removeItem('eletrogestor.tokenTeste');
  }
}

// ---------- Ligação com o resto do app ----------
const ouvintes = new Set();
const ouvintesDados = new Set();
let baixando = false;
let appNaTela = true;

const sync = criarSincronizacao({
  obterToken,
  exportar: () => exportarBanco(),
  substituir: (bytes) => {
    baixando = true;
    try {
      substituirBanco(bytes);
    } finally {
      baixando = false;
    }
  },
  temDados: () => {
    const r = um('SELECT (SELECT COUNT(*) FROM orcamentos) + (SELECT COUNT(*) FROM clientes) AS total');
    return !!r && r.total > 0;
  },
  lerMeta,
  gravarMeta,
  aoMudar: (estado) => ouvintes.forEach((f) => f(estado)),
  aoBaixar: () => ouvintesDados.forEach((f) => f()),
  podeConferir: () => appNaTela,
});

export function iniciarSincronizacao(pronto) {
  pronto.then(() => {
    definirAoAlterar(() => {
      if (!baixando) sync.alterado();
    });
    sync.iniciar().catch((e) => console.error('[sincronização]', e));
  });

  // Ao voltar para o app, confere na hora se o computador mudou algo.
  // Com o app em segundo plano, não fica conferindo (economiza bateria e internet).
  let ultima = 0;
  if (ehCelular()) {
    App.addListener('appStateChange', ({ isActive }) => {
      appNaTela = isActive;
      const e = sync.estado();
      if (!isActive || !e.conectado || Date.now() - ultima < 5000) return;
      ultima = Date.now();
      sync.conferir();
    });
  }

  return {
    estado: async () => sync.estado(),
    entrar: async () => {
      await pronto;
      const email = await entrar();
      return sync.conectado(email);
    },
    sair: async () => {
      await sair();
      return sync.desconectado();
    },
    sincronizar: async () => {
      await pronto;
      await sync.sincronizar();
      return sync.estado();
    },
    resolverConflito: async (escolha) => {
      await sync.resolverConflito(escolha);
      return sync.estado();
    },
    aoMudar: (callback) => {
      ouvintes.add(callback);
      return () => ouvintes.delete(callback);
    },
    aoBaixar: (callback) => ouvintesDados.add(callback),
  };
}
