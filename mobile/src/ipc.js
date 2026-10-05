// Versão para celular de src/main/modules/ipc.js (sem Electron).
// Os serviços usam só "dinheiro" e "texto" daqui.
export function registrar() {}

export function dinheiro(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

export function texto(valor) {
  return valor == null ? '' : String(valor).trim();
}
