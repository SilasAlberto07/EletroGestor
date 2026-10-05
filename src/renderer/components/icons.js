// Ícones em SVG usados no sistema

const svg = (conteudo, extra = '') =>
  `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" ${extra}>${conteudo}</svg>`;

export const icones = {
  inicio: svg('<path d="M12 3 2.5 11h2.7v9.5h5.3v-6h3v6h5.3V11h2.7z"/>'),

  orcamentos: svg(
    '<rect x="5" y="4.5" width="14" height="16.5" rx="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
      '<rect x="8.5" y="2.5" width="7" height="4" rx="1"/>' +
      '<path d="M8.5 10.5h7M8.5 14h7M8.5 17.5h4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
  ),

  clientes: svg(
    '<circle cx="9" cy="8" r="3.6"/><path d="M1.8 20c0-4 3.2-6.6 7.2-6.6s7.2 2.6 7.2 6.6z"/>' +
      '<circle cx="17.2" cy="8.8" r="2.9"/><path d="M17.2 13.4c3 0 5.1 2.2 5.1 5.6h-4.7c0-2.2-.8-4-2.3-5.3.6-.2 1.2-.3 1.9-.3z"/>'
  ),

  servicos: svg(
    '<path d="M21.4 6.3a5.6 5.6 0 0 1-7.2 5.9l-7.7 7.7a2.2 2.2 0 1 1-3.1-3.1l7.7-7.7a5.6 5.6 0 0 1 5.9-7.2l-3.3 3.3.6 3 3 .6z"/>'
  ),

  materiais: svg(
    '<path d="M12 2.2 3 6.8v10.4l9 4.6 9-4.6V6.8zm0 2.3 6.2 3.2L12 10.9 5.8 7.7zM5 9.4l6 3.1v6.6l-6-3.1zm8 9.7v-6.6l6-3.1v6.6z"/>'
  ),

  // Capacete de eletricista
  maoobra: svg(
    '<path d="M3.6 16.2A8.4 8.4 0 0 1 9.6 8.2V12h1.5V7.9a8.4 8.4 0 0 1 1.8 0V12h1.5V8.2a8.4 8.4 0 0 1 6 8z"/>' +
      '<rect x="1.8" y="16.9" width="20.4" height="3.2" rx="1.2"/>'
  ),

  configuracoes: svg(
    '<circle cx="12" cy="12" r="7.6" fill="none" stroke="currentColor" stroke-width="4" stroke-dasharray="3 2.97"/>' +
      '<circle cx="12" cy="12" r="6.4" fill="none" stroke="currentColor" stroke-width="3.2"/>'
  ),

  mais: svg('<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>'),
  editar: svg('<path d="M4 16.6V20h3.4L17.6 9.8l-3.4-3.4zM20.3 7.1a1 1 0 0 0 0-1.4l-2-2a1 1 0 0 0-1.4 0l-1.6 1.6 3.4 3.4z"/>'),
  excluir: svg('<path d="M8 4V3h8v1h5v2H3V4zm-2 4h12l-1 13H7z"/>'),
  pdf: svg('<path d="M6 2h8l5 5v15H6zm7 1.5V8h4.5zM8.5 13v5h1.2v-1.6h.8a1.7 1.7 0 0 0 0-3.4zm1.2 1h.8a.7.7 0 0 1 0 1.4h-.8zm3.1-1v5h1.6a2.5 2.5 0 0 0 0-5zm1.2 1h.4a1.5 1.5 0 0 1 0 3h-.4zm3-1v5h1.2v-2h1.5v-1H18v-1h1.8v-1z"/>'),
  salvar: svg('<path d="M4 3h13l3 3v15H4zm3 2v5h9V5zm5 9a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/>'),
  fechar: svg('<path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z"/>'),
  remover: svg('<path d="m7.8 6.4 4.2 4.2 4.2-4.2 1.4 1.4-4.2 4.2 4.2 4.2-1.4 1.4-4.2-4.2-4.2 4.2-1.4-1.4 4.2-4.2-4.2-4.2z"/>'),
};

// Logo: engrenagem com raio
export const logo = `
<svg viewBox="0 0 48 48" aria-hidden="true">
  <circle cx="24" cy="24" r="17" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="6.68 6.68"/>
  <circle cx="24" cy="24" r="14" fill="none" stroke="#fff" stroke-width="4"/>
  <circle cx="24" cy="24" r="12" fill="#1f2d3d"/>
  <path d="M27 8 15 27h8l-3 13 13-20h-8z" fill="#f2a93b" stroke="#1f2d3d" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`;
