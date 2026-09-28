// Pequenas funções para montar HTML com segurança

// Evita que um texto digitado (ex.: nome do cliente) quebre o HTML
export function esc(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// "#001"
export function numeroOrcamento(id) {
  return `#${String(id).padStart(3, '0')}`;
}

// Executa a função só depois que o usuário parar de digitar
export function aguardarDigitacao(funcao, ms = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => funcao(...args), ms);
  };
}
