// Sincronização com o Google Drive no computador (Electron).
// Login: abre o navegador do computador na página do Google; depois do "Permitir",
// o Google devolve para um endereço local (127.0.0.1) que este arquivo escuta.
const { app, BrowserWindow, shell, safeStorage } = require('electron');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const config = require('./google-config');
const { criarSincronizacao } = require('./sincronizacao');
const { registrar } = require('../modules/ipc');
const { exportarBanco, substituirBanco, definirAoAlterar, um } = require('../database/connection');
const { pastaDados } = require('../utils/paths');

const ARQUIVO = () => path.join(pastaDados(), 'google-sync.json');
let tokens = null; // { access_token, refresh_token, expira }

// ---------- Guardar tokens e dados da sincronização (fora do banco, que vai para o Drive) ----------
function lerArquivo() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO(), 'utf8'));
  } catch {
    return {};
  }
}

function gravarArquivo(dados) {
  fs.mkdirSync(path.dirname(ARQUIVO()), { recursive: true });
  fs.writeFileSync(ARQUIVO(), JSON.stringify(dados, null, 2));
}

function protegerTokens(t) {
  const texto = JSON.stringify(t);
  if (safeStorage.isEncryptionAvailable()) return { cifrado: safeStorage.encryptString(texto).toString('base64') };
  return { aberto: texto };
}

function abrirTokens(salvo) {
  if (!salvo) return null;
  try {
    if (salvo.cifrado) return JSON.parse(safeStorage.decryptString(Buffer.from(salvo.cifrado, 'base64')));
    if (salvo.aberto) return JSON.parse(salvo.aberto);
  } catch {
    /* tokens inválidos */
  }
  return null;
}

function salvarTokens(t) {
  tokens = t;
  const dados = lerArquivo();
  if (t) dados.tokens = protegerTokens(t);
  else delete dados.tokens;
  gravarArquivo(dados);
}

// ---------- Google OAuth ----------
const base64url = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function pedirToken(parametros) {
  const resposta = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.desktopClientId, client_secret: config.desktopClientSecret, ...parametros }),
  });
  const json = await resposta.json();
  if (!resposta.ok) {
    const erro = new Error(json.error_description || json.error || `Google respondeu ${resposta.status}`);
    erro.codigo = json.error;
    throw erro;
  }
  return json;
}

function emailDoIdToken(idToken) {
  try {
    return JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString('utf8')).email || '';
  } catch {
    return '';
  }
}

function paginaResposta(titulo, texto) {
  return `<!doctype html><meta charset="utf-8"><title>EletroGestor</title>
  <body style="font-family:Segoe UI,Arial,sans-serif;background:#eceff3;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <div style="background:#fff;padding:32px 40px;border-radius:8px;box-shadow:0 2px 10px rgba(0,0,0,.1);text-align:center;max-width:420px">
  <h2 style="margin:0 0 10px;color:#1f2d3d">${titulo}</h2><p style="color:#5f6b7a;margin:0">${texto}</p></div>`;
}

function entrarComGoogle() {
  if (config.desktopClientId.startsWith('PREENCHER')) {
    return Promise.reject(new Error('A sincronização ainda não foi configurada (códigos do Google Cloud).'));
  }
  return new Promise((resolver, rejeitar) => {
    const verificador = base64url(crypto.randomBytes(32));
    const desafio = base64url(crypto.createHash('sha256').update(verificador).digest());
    const estadoOAuth = base64url(crypto.randomBytes(16));
    let redirect = '';

    const servidor = http.createServer(async (req, res) => {
      const url = new URL(req.url, redirect);
      if (url.pathname !== '/') {
        res.writeHead(404).end();
        return;
      }
      const codigo = url.searchParams.get('code');
      const erro = url.searchParams.get('error');
      if (url.searchParams.get('state') !== estadoOAuth || (!codigo && !erro)) {
        res.writeHead(400).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      finalizar();
      if (erro) {
        res.end(paginaResposta('Login cancelado', 'Você pode fechar esta janela e voltar ao EletroGestor.'));
        rejeitar(new Error('Login cancelado.'));
        return;
      }
      try {
        const t = await pedirToken({ code: codigo, code_verifier: verificador, redirect_uri: redirect, grant_type: 'authorization_code' });
        if (!t.refresh_token) throw new Error('O Google não devolveu a autorização completa. Tente novamente.');
        salvarTokens({ access_token: t.access_token, refresh_token: t.refresh_token, expira: Date.now() + (t.expires_in - 60) * 1000 });
        res.end(paginaResposta('Pronto! ✔', 'O EletroGestor está conectado ao seu Google Drive. Pode fechar esta janela.'));
        const janela = BrowserWindow.getAllWindows()[0];
        if (janela) {
          if (janela.isMinimized()) janela.restore();
          janela.focus();
        }
        resolver(emailDoIdToken(t.id_token));
      } catch (e) {
        res.end(paginaResposta('Não foi possível entrar', 'Volte ao EletroGestor e tente novamente.'));
        rejeitar(e);
      }
    });

    const tempo = setTimeout(() => {
      finalizar();
      rejeitar(new Error('O login demorou demais. Tente novamente.'));
    }, 5 * 60 * 1000);

    function finalizar() {
      clearTimeout(tempo);
      setTimeout(() => servidor.close(), 1000);
    }

    servidor.listen(0, '127.0.0.1', () => {
      redirect = `http://127.0.0.1:${servidor.address().port}/`;
      const params = new URLSearchParams({
        client_id: config.desktopClientId,
        redirect_uri: redirect,
        response_type: 'code',
        scope: config.escopos.join(' '),
        code_challenge: desafio,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent select_account',
        state: estadoOAuth,
      });
      shell.openExternal(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    });
  });
}

async function obterToken() {
  if (!tokens) tokens = abrirTokens(lerArquivo().tokens);
  if (!tokens) return null;
  if (tokens.access_token && Date.now() < tokens.expira) return tokens.access_token;
  try {
    const t = await pedirToken({ refresh_token: tokens.refresh_token, grant_type: 'refresh_token' });
    salvarTokens({ ...tokens, access_token: t.access_token, expira: Date.now() + (t.expires_in - 60) * 1000 });
    return tokens.access_token;
  } catch (erro) {
    if (erro.codigo === 'invalid_grant') {
      salvarTokens(null); // acesso removido pelo usuário ou expirado
      return null;
    }
    throw erro;
  }
}

// ---------- Ligação com o resto do sistema ----------
function avisarTelas(canal, dados) {
  BrowserWindow.getAllWindows().forEach((j) => j.webContents.send(canal, dados));
}

let baixando = false;
const sync = criarSincronizacao({
  obterToken,
  exportar: () => new Uint8Array(exportarBanco()),
  substituir: (bytes) => {
    baixando = true;
    try {
      substituirBanco(Buffer.from(bytes));
    } finally {
      baixando = false;
    }
  },
  temDados: () => {
    const r = um('SELECT (SELECT COUNT(*) FROM orcamentos) + (SELECT COUNT(*) FROM clientes) AS total');
    return r && r.total > 0;
  },
  lerMeta: async () => lerArquivo().meta || {},
  gravarMeta: async (meta) => gravarArquivo({ ...lerArquivo(), meta }),
  aoMudar: (estado) => avisarTelas('sync', estado),
  aoBaixar: () => avisarTelas('sync:dados', true),
  // Só confere com a janela aberta (não minimizada)
  podeConferir: () => BrowserWindow.getAllWindows().some((j) => j.isVisible() && !j.isMinimized()),
});

function registrarSincronizacao() {
  definirAoAlterar(() => {
    if (!baixando) sync.alterado();
  });

  registrar('sync:estado', () => sync.estado());
  registrar('sync:sincronizar', () => sync.sincronizar().then(() => sync.estado()));
  registrar('sync:resolverConflito', (_e, escolha) => sync.resolverConflito(escolha).then(() => sync.estado()));
  registrar('sync:entrar', async () => {
    const email = await entrarComGoogle();
    return sync.conectado(email);
  });
  registrar('sync:sair', async () => {
    const t = tokens || abrirTokens(lerArquivo().tokens);
    if (t?.refresh_token) {
      fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(t.refresh_token)}`, { method: 'POST' }).catch(() => {});
    }
    salvarTokens(null);
    return sync.desconectado();
  });

  // Ao voltar para a janela, confere na hora se o outro aparelho mudou algo
  let ultimaConferencia = 0;
  app.on('browser-window-focus', () => {
    const e = sync.estado();
    if (!e.conectado || Date.now() - ultimaConferencia < 5000) return;
    ultimaConferencia = Date.now();
    sync.conferir();
  });
}

function iniciarSincronizacao() {
  sync.iniciar().catch((erro) => console.error('[sincronização]', erro));
}

module.exports = { registrarSincronizacao, iniciarSincronizacao };
