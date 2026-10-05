// Sincronização do banco com o Google Drive (usada no computador E no celular).
//
// Ideia: o banco inteiro (eletrogestor.db) fica guardado no Drive do cliente.
//  - Ao abrir o app (ou voltar para ele): se o Drive tem uma versão mais nova, baixa.
//  - Ao salvar qualquer coisa: envia o banco atualizado para o Drive.
//  - Se os DOIS mudaram desde a última sincronização (ex.: os dois aparelhos
//    usados sem internet), não apaga nada sozinho: pergunta qual versão manter.
//
// Este arquivo não sabe nada de Electron nem de Android. Quem usa passa as funções
// de cada plataforma (como pegar o token do Google, ler/gravar o banco etc.).

const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const NOME_ARQUIVO = 'EletroGestor - dados (não apague).db';
const MARCA = { eletrogestor: 'banco' };
const CAMPOS = 'id,md5Checksum,modifiedTime,trashed';

class ErroSemLogin extends Error {}

/**
 * plataforma = {
 *   obterToken(): Promise<string|null>   token do Google ou null se não estiver conectado
 *   exportar(): Uint8Array                bytes do banco atual
 *   substituir(bytes): void               troca o banco local pelo baixado (sem marcar como alterado)
 *   temDados(): boolean                   se o banco local já tem clientes/orçamentos
 *   lerMeta(): Promise<object>            dados da sincronização guardados no aparelho
 *   gravarMeta(meta): Promise<void>
 *   aoMudar(estado): void                 avisa a tela
 *   aoBaixar(): void                      avisa a tela que os dados mudaram (recarregar)
 * }
 */
function criarSincronizacao(plataforma) {
  let meta = null;
  let estado = { conectado: false, email: '', situacao: 'desconectado', ultima: null, mensagem: '' };
  let rodando = null;
  let pedirDeNovo = false;
  let agendado = null;

  function mudar(parcial) {
    estado = { ...estado, ...parcial };
    plataforma.aoMudar({ ...estado });
  }

  async function carregarMeta() {
    if (!meta) meta = (await plataforma.lerMeta()) || {};
    return meta;
  }

  async function salvarMeta(parcial) {
    meta = { ...(await carregarMeta()), ...parcial };
    await plataforma.gravarMeta(meta);
  }

  // ---------- Google Drive ----------
  async function pedir(url, opcoes = {}) {
    const token = await plataforma.obterToken();
    if (!token) throw new ErroSemLogin('Não conectado ao Google.');
    const resposta = await fetch(url, { ...opcoes, headers: { ...(opcoes.headers || {}), Authorization: `Bearer ${token}` } });
    if (resposta.status === 401) throw new ErroSemLogin('O login do Google expirou. Entre novamente.');
    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => '');
      throw new Error(`Google Drive respondeu ${resposta.status}: ${texto.slice(0, 200)}`);
    }
    return resposta;
  }

  async function procurarArquivo() {
    const m = await carregarMeta();
    if (m.arquivoId) {
      try {
        const r = await pedir(`${DRIVE}/${m.arquivoId}?fields=${CAMPOS}`);
        const arq = await r.json();
        if (!arq.trashed) return arq;
      } catch (erro) {
        if (erro instanceof ErroSemLogin) throw erro;
        // arquivo apagado ou inacessível: procura de novo
      }
    }
    const q = encodeURIComponent("appProperties has { key='eletrogestor' and value='banco' } and trashed = false");
    const r = await pedir(`${DRIVE}?q=${q}&orderBy=modifiedTime desc&pageSize=1&fields=files(${CAMPOS})&spaces=drive`);
    const { files } = await r.json();
    return files && files[0] ? files[0] : null;
  }

  async function baixar(arquivo) {
    const r = await pedir(`${DRIVE}/${arquivo.id}?alt=media`);
    return new Uint8Array(await r.arrayBuffer());
  }

  async function enviar(arquivoId) {
    const bytes = plataforma.exportar();
    if (arquivoId) {
      const r = await pedir(`${UPLOAD}/${arquivoId}?uploadType=media&fields=${CAMPOS}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: bytes,
      });
      return r.json();
    }
    // Primeiro envio: cria o arquivo (multipart = dados do arquivo + conteúdo)
    const limite = `eletrogestor${Date.now()}`;
    const cabecalho = new TextEncoder().encode(
      `--${limite}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify({ name: NOME_ARQUIVO, mimeType: 'application/x-sqlite3', appProperties: MARCA }) +
        `\r\n--${limite}\r\nContent-Type: application/octet-stream\r\n\r\n`
    );
    const rodape = new TextEncoder().encode(`\r\n--${limite}--`);
    const corpo = new Uint8Array(cabecalho.length + bytes.length + rodape.length);
    corpo.set(cabecalho, 0);
    corpo.set(bytes, cabecalho.length);
    corpo.set(rodape, cabecalho.length + bytes.length);
    const r = await pedir(`${UPLOAD}?uploadType=multipart&fields=${CAMPOS}`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${limite}` },
      body: corpo,
    });
    return r.json();
  }

  // ---------- Regras ----------
  async function sincronizarUmaVez(escolha) {
    const m = await carregarMeta();
    if (!m.conectado) {
      mudar({ conectado: false, situacao: 'desconectado', mensagem: '' });
      return;
    }
    mudar({ situacao: 'sincronizando', mensagem: '' });

    const remoto = await procurarArquivo();
    const mudouNoDrive = remoto && remoto.md5Checksum !== m.md5Sincronizado;
    const mudouAqui = !!m.alteradoLocal;

    let acao;
    if (escolha === 'nuvem') acao = remoto ? 'baixar' : 'enviar';
    else if (escolha === 'local') acao = 'enviar';
    else if (!remoto) acao = 'enviar';
    else if (mudouNoDrive && mudouAqui) acao = 'conflito';
    else if (mudouNoDrive) acao = 'baixar';
    else if (mudouAqui) acao = 'enviar';
    else acao = 'nada';

    if (acao === 'conflito') {
      mudar({
        situacao: 'conflito',
        mensagem:
          'Os dados foram alterados neste aparelho e também em outro aparelho (no Drive). Escolha qual versão quer manter.',
        dataDrive: remoto.modifiedTime,
      });
      return;
    }
    if (acao === 'baixar') {
      const bytes = await baixar(remoto);
      plataforma.substituir(bytes);
      await salvarMeta({ arquivoId: remoto.id, md5Sincronizado: remoto.md5Checksum, alteradoLocal: false });
      plataforma.aoBaixar();
    }
    if (acao === 'enviar') {
      await salvarMeta({ alteradoLocal: false }); // se mudar algo durante o envio, volta a ficar true
      try {
        const arq = await enviar(remoto ? remoto.id : null);
        await salvarMeta({ arquivoId: arq.id, md5Sincronizado: arq.md5Checksum });
      } catch (erro) {
        await salvarMeta({ alteradoLocal: true });
        throw erro;
      }
    }
    const agora = new Date().toISOString();
    await salvarMeta({ ultima: agora });
    mudar({ situacao: meta.alteradoLocal ? 'pendente' : 'ok', ultima: agora, mensagem: '', dataDrive: undefined });
  }

  async function sincronizar(escolha) {
    if (rodando) {
      pedirDeNovo = true;
      return rodando;
    }
    rodando = (async () => {
      try {
        do {
          pedirDeNovo = false;
          try {
            await sincronizarUmaVez(escolha);
          } catch (erro) {
            if (erro instanceof ErroSemLogin) {
              mudar({ situacao: 'login', mensagem: erro.message });
            } else if (erro instanceof TypeError || /fetch|network|Failed to fetch|ENOTFOUND|ETIMEDOUT/i.test(erro.message)) {
              mudar({ situacao: 'offline', mensagem: 'Sem internet. Os dados serão enviados quando a conexão voltar.' });
            } else {
              console.error('[sincronização]', erro);
              mudar({ situacao: 'erro', mensagem: erro.message });
            }
            return;
          }
          escolha = undefined;
        } while (pedirDeNovo);
      } finally {
        rodando = null;
      }
    })();
    return rodando;
  }

  return {
    async iniciar() {
      const m = await carregarMeta();
      mudar({ conectado: !!m.conectado, email: m.email || '', ultima: m.ultima || null, situacao: m.conectado ? 'ok' : 'desconectado' });
      if (m.conectado) await sincronizar();
      // Se ficou algo sem enviar (ex.: sem internet), tenta de novo de tempos em tempos
      setInterval(() => {
        if (meta && meta.conectado && meta.alteradoLocal) sincronizar();
      }, 60 * 1000);
    },

    // Chamado depois de fazer login no Google
    async conectado(email) {
      // Se este aparelho já tem dados, na primeira vez pergunta o que fazer caso o Drive também tenha
      await salvarMeta({ conectado: true, email: email || '', md5Sincronizado: null, arquivoId: null, alteradoLocal: plataforma.temDados() });
      mudar({ conectado: true, email: email || '' });
      await sincronizar();
      return { ...estado };
    },

    async desconectado() {
      await salvarMeta({ conectado: false, email: '', md5Sincronizado: null, arquivoId: null, alteradoLocal: false });
      mudar({ conectado: false, email: '', situacao: 'desconectado', mensagem: '', ultima: null });
      return { ...estado };
    },

    // Chamado a cada alteração no banco: envia alguns segundos depois (junta várias alterações seguidas)
    async alterado() {
      const m = await carregarMeta();
      if (!m.conectado) return;
      if (!m.alteradoLocal) await salvarMeta({ alteradoLocal: true });
      if (estado.situacao !== 'conflito') mudar({ situacao: 'pendente' });
      clearTimeout(agendado);
      agendado = setTimeout(() => {
        if (estado.situacao !== 'conflito') sincronizar();
      }, 3000);
    },

    sincronizar: () => sincronizar(),
    resolverConflito: (escolha) => sincronizar(escolha === 'local' ? 'local' : 'nuvem'),
    estado: () => ({ ...estado }),
  };
}

module.exports = { criarSincronizacao, NOME_ARQUIVO };
