// Onde o banco fica guardado no celular.
// No app Android: arquivo "eletrogestor.db" na pasta privada do aplicativo.
// No navegador (só para testes): localStorage.
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

const ARQUIVO = 'eletrogestor.db';
const CHAVE_TESTE = 'eletrogestor.db';

export const ehCelular = () => Capacitor.isNativePlatform();

export function paraBase64(bytes) {
  let texto = '';
  const passo = 0x8000;
  for (let i = 0; i < bytes.length; i += passo) {
    texto += String.fromCharCode.apply(null, bytes.subarray(i, i + passo));
  }
  return btoa(texto);
}

export function deBase64(base64) {
  const texto = atob(base64);
  const bytes = new Uint8Array(texto.length);
  for (let i = 0; i < texto.length; i++) bytes[i] = texto.charCodeAt(i);
  return bytes;
}

// Retorna os bytes do banco salvo, ou null se ainda não existir
export async function lerBanco() {
  if (!ehCelular()) {
    const salvo = localStorage.getItem(CHAVE_TESTE);
    return salvo ? deBase64(salvo) : null;
  }
  try {
    const { data } = await Filesystem.readFile({ path: ARQUIVO, directory: Directory.Data });
    return typeof data === 'string' ? deBase64(data) : new Uint8Array(await data.arrayBuffer());
  } catch {
    return null; // primeira vez que o app abre
  }
}

// Grava em um arquivo temporário e depois troca, para não corromper se o app fechar no meio
async function gravarAgora(bytes) {
  if (!ehCelular()) {
    localStorage.setItem(CHAVE_TESTE, paraBase64(bytes));
    return;
  }
  const temporario = `${ARQUIVO}.tmp`;
  await Filesystem.writeFile({ path: temporario, data: paraBase64(bytes), directory: Directory.Data });
  await Filesystem.rename({ from: temporario, to: ARQUIVO, directory: Directory.Data, toDirectory: Directory.Data });
}

// As gravações acontecem uma de cada vez, sempre com a versão mais nova do banco
let pendente = null;
let gravando = null;

export function gravarBanco(bytes) {
  pendente = bytes;
  if (!gravando) {
    gravando = (async () => {
      while (pendente) {
        const atual = pendente;
        pendente = null;
        try {
          await gravarAgora(atual);
        } catch (erro) {
          console.error('Erro ao gravar o banco', erro);
        }
      }
      gravando = null;
    })();
  }
  return gravando;
}

// Espera terminar de gravar (usado antes de o app ir para segundo plano)
export function aguardarGravacao() {
  return gravando || Promise.resolve();
}
