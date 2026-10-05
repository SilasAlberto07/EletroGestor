// Gera o PDF do orçamento no celular.
// Usa o MESMO modelo (template.html) e a mesma montagem do computador (montarHtml);
// só a "impressão" muda: desenha a página e monta o PDF com jsPDF.
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { montarHtml } from '../../src/main/modules/orcamentos/pdf/gerarPdf.js';
import * as orcamentos from '../../src/main/modules/orcamentos/orcamento.service.js';
import * as config from '../../src/main/modules/configuracoes/configuracao.service.js';
import { compartilharArquivo } from './arquivos.js';

// A4 com as mesmas margens do computador (0,5" em cima/baixo e 0,55" dos lados)
const PAGINA = { largura: 210, altura: 297, margemV: 12.7, margemH: 14 };
const PX_POR_MM = 96 / 25.4;
const ESCALA = 2; // mais nitidez

function slug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Monta a página escondida dentro de um iframe (assim o estilo do PDF não mexe no app)
async function renderizarPagina(html) {
  const larguraUtil = Math.round((PAGINA.largura - 2 * PAGINA.margemH) * PX_POR_MM);
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-10000px',
    top: '0',
    width: `${larguraUtil}px`,
    height: '10px', // pequeno: assim a altura medida é só a do conteúdo
    border: '0',
    visibility: 'hidden',
  });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(html);
  doc.close();

  // Espera as imagens (logo) carregarem
  await Promise.all(
    [...doc.images].map((img) => (img.complete ? null : new Promise((ok) => (img.onload = img.onerror = ok))))
  );
  if (doc.fonts?.ready) await doc.fonts.ready;
  const altura = Math.ceil(doc.documentElement.scrollHeight);
  iframe.style.height = `${altura}px`;
  return { iframe, doc, larguraUtil, altura };
}

// Lugares onde dá para quebrar a página sem cortar uma linha no meio
function pontosDeQuebra(doc) {
  const pontos = new Set();
  doc.querySelectorAll('.topo, .blocos, tr, .obs, .assinaturas').forEach((el) => {
    const r = el.getBoundingClientRect();
    pontos.add(Math.round(r.top));
    pontos.add(Math.round(r.bottom));
  });
  return [...pontos].sort((a, b) => a - b);
}

export async function gerarPdf(id) {
  const orc = orcamentos.obter(id);
  if (!orc) throw new Error('Orçamento não encontrado.');

  const { iframe, doc, larguraUtil, altura } = await renderizarPagina(montarHtml(orc, config.obter()));
  try {
    const canvas = await html2canvas(doc.body, {
      scale: ESCALA,
      backgroundColor: '#ffffff',
      width: larguraUtil,
      height: altura,
      windowWidth: larguraUtil,
      windowHeight: altura,
      useCORS: true,
      logging: false,
    });

    const alturaUtilPx = (PAGINA.altura - 2 * PAGINA.margemV) * PX_POR_MM;
    const alturaTotal = canvas.height / ESCALA;
    const quebras = pontosDeQuebra(doc);

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    let inicio = 0;
    let primeira = true;
    while (inicio < alturaTotal - 1) {
      let fim = Math.min(inicio + alturaUtilPx, alturaTotal);
      if (fim < alturaTotal) {
        const melhor = quebras.filter((q) => q > inicio + 40 && q <= fim).pop();
        if (melhor) fim = melhor;
      }

      const pedaco = document.createElement('canvas');
      pedaco.width = canvas.width;
      pedaco.height = Math.ceil((fim - inicio) * ESCALA);
      const ctx = pedaco.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, pedaco.width, pedaco.height);
      ctx.drawImage(canvas, 0, -Math.floor(inicio * ESCALA));

      if (!primeira) pdf.addPage();
      primeira = false;
      pdf.addImage(
        pedaco.toDataURL('image/jpeg', 0.92),
        'JPEG',
        PAGINA.margemH,
        PAGINA.margemV,
        PAGINA.largura - 2 * PAGINA.margemH,
        (fim - inicio) / PX_POR_MM
      );
      inicio = fim;
    }

    const bytes = new Uint8Array(pdf.output('arraybuffer'));
    const nome = `Orcamento-${orc.numero}-${slug(orc.cliente_nome)}.pdf`;
    return compartilharArquivo(nome, bytes, 'application/pdf', `Orçamento ${orc.numero}`);
  } finally {
    iframe.remove();
  }
}
