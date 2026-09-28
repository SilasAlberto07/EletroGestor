// Avisos rápidos no canto da tela
export function avisar(mensagem, tipo = 'sucesso') {
  const area = document.getElementById('toasts');
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = mensagem;
  area.appendChild(toast);
  setTimeout(() => toast.remove(), tipo === 'erro' ? 6000 : 3500);
}

export function avisarErro(erro) {
  const mensagem = (erro && erro.message) || String(erro);
  // Remove o prefixo técnico que o Electron adiciona às mensagens
  avisar(mensagem.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''), 'erro');
}
