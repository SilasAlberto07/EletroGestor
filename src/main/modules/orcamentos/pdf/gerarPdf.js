// Gera o PDF do orçamento usando o próprio Electron (printToPDF)
const { BrowserWindow, dialog, shell } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const service = require('../orcamento.service');
const config = require('../../configuracoes/configuracao.service');
const { pastaPdfs } = require('../../../utils/paths');

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numeroFmt = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

const LOGO_PADRAO =
  '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="#1f2d3d" stroke-width="7" stroke-dasharray="6.68 6.68"/>' +
  '<circle cx="24" cy="24" r="14" fill="none" stroke="#1f2d3d" stroke-width="4"/><path d="M27 8 15 27h8l-3 13 13-20h-8z" fill="#f2a93b"/></svg>';

function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function dataBr(data) {
  const d = data instanceof Date ? data : new Date(String(data).replace(' ', 'T'));
  return d.toLocaleDateString('pt-BR');
}

function juntar(...partes) {
  return partes.filter(Boolean).join('  •  ');
}

function slug(texto) {
  return String(texto)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function montarHtml(orc, cfg) {
  const emissao = new Date(orc.criado_em.replace(' ', 'T'));
  const validade = new Date(emissao);
  validade.setDate(validade.getDate() + (parseInt(cfg.validade_dias, 10) || 15));

  const linha = (descricao, quantidade, unidade, unitario, total) =>
    `<tr><td>${esc(descricao)}</td>
      <td class="cen">${esc(numeroFmt.format(quantidade))} ${esc(unidade)}</td>
      <td class="num">${moeda.format(unitario)}</td>
      <td class="num">${moeda.format(total)}</td></tr>`;
  const secao = (titulo) => `<tr class="secao"><td colspan="4">${titulo}</td></tr>`;

  const itensHtml = orc.itens.length
    ? secao('MATERIAIS') + orc.itens.map((i) => linha(i.descricao, i.quantidade, i.unidade, i.unitario, i.total)).join('')
    : '';

  const maoObraHtml = orc.mao_obra_itens.length
    ? secao('MÃO DE OBRA') +
      orc.mao_obra_itens.map((m) => linha(m.descricao, m.quantidade, m.unidade, m.unitario, m.total)).join('')
    : '';

  const deslocamentoHtml =
    orc.deslocamento > 0
      ? secao('DESLOCAMENTO') +
        linha('Deslocamento', orc.deslocamento_km, 'km', orc.deslocamento_valor_km, orc.deslocamento)
      : '';

  const observacoes = [orc.observacoes, cfg.condicoes].filter(Boolean).join('\n\n');

  // Logo escolhida nas Configurações; se não tiver, usa a logo padrão
  const logoValida = /^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(cfg.logo || '');
  const logoHtml = logoValida ? `<img class="logo" src="${cfg.logo}" alt="">` : LOGO_PADRAO;

  const dados = {
    logo_html: logoHtml,
    numero: esc(orc.numero),
    data: dataBr(emissao),
    validade: dataBr(validade),
    empresa_nome: esc(cfg.empresa_nome || 'Minha Empresa'),
    empresa_linha1: esc(juntar(cfg.empresa_documento && `CNPJ/CPF: ${cfg.empresa_documento}`, cfg.empresa_telefone, cfg.empresa_email)),
    empresa_linha2: esc(cfg.empresa_endereco),
    cliente_nome: esc(orc.cliente_nome),
    cliente_linha1: esc(juntar(orc.cliente_telefone, orc.cliente_email, orc.cliente_documento)),
    cliente_linha2: esc(orc.cliente_endereco),
    servico_nome: esc(orc.servico_nome || 'Serviço elétrico'),
    itens_html: itensHtml,
    mao_obra_html: maoObraHtml,
    deslocamento_html: deslocamentoHtml,
    total: moeda.format(orc.total),
    observacoes_html: observacoes
      ? `<div class="obs"><h2>OBSERVAÇÕES E CONDIÇÕES</h2><p>${esc(observacoes)}</p></div>`
      : '',
    responsavel: esc(cfg.responsavel || cfg.empresa_nome || 'Responsável'),
  };

  const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  return template.replace(/\{\{(\w+)\}\}/g, (_, chave) => dados[chave] ?? '');
}

/**
 * Gera o PDF de um orçamento.
 * @param {number} id - id do orçamento
 * @param {object} opcoes - { janela, caminho, abrir }
 * @returns caminho do arquivo salvo, ou null se o usuário cancelar
 */
async function gerarPdf(id, { janela = null, caminho = null, abrir = true } = {}) {
  const orc = service.obter(id);
  if (!orc) throw new Error('Orçamento não encontrado.');

  if (!caminho) {
    const nomeArquivo = `Orcamento-${orc.numero}-${slug(orc.cliente_nome)}.pdf`;
    const escolha = await dialog.showSaveDialog(janela, {
      title: 'Salvar orçamento em PDF',
      defaultPath: path.join(pastaPdfs(), nomeArquivo),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (escolha.canceled || !escolha.filePath) return null;
    caminho = escolha.filePath;
  }

  const arquivoTemp = path.join(os.tmpdir(), `eletrogestor-orcamento-${id}-${Date.now()}.html`);
  fs.writeFileSync(arquivoTemp, montarHtml(orc, config.obter()), 'utf8');

  const janelaPdf = new BrowserWindow({ show: false, webPreferences: { javascript: false, sandbox: true } });
  try {
    await janelaPdf.loadFile(arquivoTemp);
    const pdf = await janelaPdf.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: { top: 0.5, bottom: 0.5, left: 0.55, right: 0.55 }, // em polegadas
    });
    fs.writeFileSync(caminho, pdf);
  } finally {
    janelaPdf.destroy();
    fs.rmSync(arquivoTemp, { force: true });
  }

  if (abrir) shell.openPath(caminho);
  return caminho;
}

module.exports = { gerarPdf, montarHtml };
