// Formatação de datas

// "2026-09-28 10:15:00" -> "28/09/2026"
export function formatarData(texto) {
  if (!texto) return '';
  const d = new Date(String(texto).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
}
