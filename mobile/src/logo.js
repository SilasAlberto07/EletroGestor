// Logo da empresa no celular: escolhe a imagem, corta as margens em branco
// (igual ao computador) e salva no banco como data URL.
import { executar } from './connection.js';
import { escolherArquivo } from './arquivos.js';

const TIPOS = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB

function lerComoDataUrl(arquivo) {
  return new Promise((ok, falha) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(leitor.result);
    leitor.onerror = () => falha(new Error('Não foi possível ler a imagem.'));
    leitor.readAsDataURL(arquivo);
  });
}

function carregarImagem(src) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => falha(new Error('Não foi possível abrir a imagem.'));
    img.src = src;
  });
}

// Considera "fundo" o pixel transparente ou quase branco
const ehFundo = (d, i) => d[i + 3] < 20 || (d[i] > 235 && d[i + 1] > 235 && d[i + 2] > 235);

async function recortarMargens(dataUrl) {
  const img = await carregarImagem(dataUrl);
  const { naturalWidth: largura, naturalHeight: altura } = img;
  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const d = ctx.getImageData(0, 0, largura, altura).data;

  let minX = largura;
  let minY = altura;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (!ehFundo(d, (y * largura + x) * 4)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;

  const folga = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
  const x = Math.max(0, minX - folga);
  const y = Math.max(0, minY - folga);
  const w = Math.min(largura, maxX + folga + 1) - x;
  const h = Math.min(altura, maxY + folga + 1) - y;
  if (w >= largura * 0.97 && h >= altura * 0.97) return null;

  const corte = document.createElement('canvas');
  corte.width = w;
  corte.height = h;
  corte.getContext('2d').drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return corte.toDataURL('image/png');
}

function gravarLogo(valor) {
  executar(
    'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    ['logo', valor]
  );
}

export async function escolherLogo() {
  const arquivo = await escolherArquivo('image/*');
  if (!arquivo) return null;
  if (!TIPOS.includes(arquivo.type)) throw new Error('Formato não suportado. Use PNG, JPG, WEBP ou SVG.');
  if (arquivo.size > TAMANHO_MAXIMO) throw new Error('A imagem é muito grande. Use uma logo de até 2 MB.');

  let logo = await lerComoDataUrl(arquivo);
  if (arquivo.type === 'image/png' || arquivo.type === 'image/jpeg') {
    logo = (await recortarMargens(logo)) || logo;
  }
  gravarLogo(logo);
  return logo;
}

export function removerLogo() {
  gravarLogo('');
  return true;
}
