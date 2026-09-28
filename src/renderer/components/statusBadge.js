// Etiqueta de status (● Aguardando / ● Aprovado / ● Recusado)
export const STATUS = {
  aguardando: 'Aguardando',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

export function statusBadge(status) {
  return `<span class="status status-${status}">${STATUS[status] || status}</span>`;
}

// Versão que permite trocar o status direto na lista
export function statusSelect(status, id) {
  const opcoes = Object.entries(STATUS)
    .map(([valor, nome]) => `<option value="${valor}" ${valor === status ? 'selected' : ''}>● ${nome}</option>`)
    .join('');
  return `<select class="select-status status-${status}" data-status-id="${id}" title="Alterar status">${opcoes}</select>`;
}
