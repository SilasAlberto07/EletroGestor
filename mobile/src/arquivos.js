// Enviar arquivos (PDF, backup) e escolher arquivos no celular
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { ehCelular, paraBase64 } from './armazenamento.js';

/**
 * Abre a tela de compartilhar do Android (WhatsApp, e-mail, Drive, salvar em Arquivos...).
 * No navegador (testes) apenas baixa o arquivo.
 */
export async function compartilharArquivo(nome, bytes, tipo, titulo) {
  if (!ehCelular()) {
    const url = URL.createObjectURL(new Blob([bytes], { type: tipo }));
    const a = Object.assign(document.createElement('a'), { href: url, download: nome });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return nome;
  }

  const { uri } = await Filesystem.writeFile({ path: nome, data: paraBase64(bytes), directory: Directory.Cache });
  try {
    await Share.share({ title: titulo, url: uri, dialogTitle: titulo });
  } catch (erro) {
    // Fechar a tela de compartilhar sem escolher nada não é erro
    if (!/cancel/i.test(erro?.message || '')) throw erro;
  }
  return null;
}

/**
 * Abre o seletor de arquivos do Android. Retorna o File escolhido ou null.
 */
export function escolherArquivo(aceitar = '') {
  return new Promise((resolver) => {
    const input = document.createElement('input');
    input.type = 'file';
    if (aceitar) input.accept = aceitar;
    input.style.display = 'none';
    let resolvido = false;
    const terminar = (arquivo) => {
      if (resolvido) return;
      resolvido = true;
      input.remove();
      resolver(arquivo || null);
    };
    input.addEventListener('change', () => terminar(input.files[0]));
    input.addEventListener('cancel', () => terminar(null));
    document.body.appendChild(input);
    input.click();
  });
}

export function dataHoje() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
