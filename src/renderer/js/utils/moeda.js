// Formatação de valores em Reais

const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const reaisSemCentavos = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const quantidade = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 });

// 1514 -> "R$ 1.514,00"
export function formatarMoeda(valor) {
  return reais.format(Number(valor) || 0).replace(/ /g, ' ');
}

// 34750 -> "R$ 34.750"  |  620.5 -> "R$ 620,50"
export function formatarMoedaCurta(valor) {
  const n = Number(valor) || 0;
  const texto = Number.isInteger(n) ? reaisSemCentavos.format(n) : reais.format(n);
  return texto.replace(/ /g, ' ');
}

// 4.8 -> "4,80" (usado dentro dos campos)
export function formatarDecimal(valor) {
  return decimal.format(Number(valor) || 0);
}

// 2.5 -> "2,5"
export function formatarQuantidade(valor) {
  return quantidade.format(Number(valor) || 0);
}

// "1.514,00" / "1514,5" / "R$ 18" -> número
export function lerNumero(texto) {
  if (typeof texto === 'number') return texto;
  let s = String(texto ?? '').replace(/[^\d,.-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
