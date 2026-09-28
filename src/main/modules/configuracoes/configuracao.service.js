// Configurações da empresa (aparecem no PDF) e valores padrão
const { todos, executar, transacao } = require('../../database/connection');
const { texto } = require('../ipc');

const CHAVES = [
  'empresa_nome',
  'empresa_documento',
  'empresa_telefone',
  'empresa_email',
  'empresa_endereco',
  'responsavel',
  'deslocamento_padrao',
  'validade_dias',
  'condicoes',
];

function obter() {
  const config = {};
  todos('SELECT chave, valor FROM configuracoes').forEach((linha) => {
    config[linha.chave] = linha.valor ?? '';
  });
  return config;
}

function salvar(dados) {
  if (!texto(dados.empresa_nome)) throw new Error('Informe o nome da empresa.');
  const validade = parseInt(dados.validade_dias, 10);
  if (!(validade > 0)) throw new Error('A validade do orçamento deve ser de pelo menos 1 dia.');

  transacao(() => {
    CHAVES.forEach((chave) => {
      if (chave in dados) {
        executar(
          'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
          [chave, texto(dados[chave])]
        );
      }
    });
  });
  return obter();
}

// ---------- Logo da empresa ----------
// A logo fica salva no banco como imagem em texto (data URL), assim ela
// entra junto no backup e não depende de nenhum arquivo externo.
const fs = require('fs');
const path = require('path');
const { nativeImage } = require('electron');

const TIPOS_LOGO = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB

function salvarLogoDoArquivo(caminho) {
  let tipo = TIPOS_LOGO[path.extname(caminho).toLowerCase()];
  if (!tipo) throw new Error('Formato não suportado. Use PNG, JPG, WEBP ou SVG.');

  let dados = fs.readFileSync(caminho);
  if (dados.length > TAMANHO_MAXIMO) throw new Error('A imagem é muito grande. Use uma logo de até 2 MB.');

  // PNG e JPG: corta a borda vazia em volta do desenho
  if (tipo === 'image/png' || tipo === 'image/jpeg') {
    const recortada = recortarMargens(dados);
    if (recortada) {
      dados = recortada;
      tipo = 'image/png';
    }
  }

  const logo = `data:${tipo};base64,${dados.toString('base64')}`;
  gravarChave('logo', logo);
  return logo;
}

// Considera "fundo" o pixel transparente ou quase branco
function ehFundo(bmp, i) {
  const azul = bmp[i];
  const verde = bmp[i + 1];
  const vermelho = bmp[i + 2];
  const alfa = bmp[i + 3];
  return alfa < 20 || (vermelho > 235 && verde > 235 && azul > 235);
}

/**
 * Remove as margens brancas/transparentes da imagem, deixando só o desenho.
 * Retorna o novo PNG, ou null se não houver nada para cortar.
 */
function recortarMargens(buffer) {
  const imagem = nativeImage.createFromBuffer(buffer);
  if (imagem.isEmpty()) return null;

  const { width, height } = imagem.getSize();
  const bmp = imagem.toBitmap(); // 4 bytes por pixel (BGRA)
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!ehFundo(bmp, (y * width + x) * 4)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null; // imagem toda em branco

  // Deixa uma pequena folga para o desenho não ficar colado na borda
  const folga = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
  const x = Math.max(0, minX - folga);
  const y = Math.max(0, minY - folga);
  const largura = Math.min(width, maxX + folga + 1) - x;
  const altura = Math.min(height, maxY + folga + 1) - y;

  if (largura >= width * 0.97 && altura >= height * 0.97) return null; // já está sem margem
  return imagem.crop({ x, y, width: largura, height: altura }).toPNG();
}

function removerLogo() {
  gravarChave('logo', '');
  return true;
}

function gravarChave(chave, valor) {
  executar(
    'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor',
    [chave, valor]
  );
}

module.exports = { obter, salvar, salvarLogoDoArquivo, removerLogo };
