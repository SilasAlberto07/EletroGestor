// Formulário "Novo Orçamento" (usado no Dashboard e na página de orçamentos)
import { esc, numeroOrcamento } from '../js/utils/dom.js';
import { formatarMoeda, formatarDecimal, formatarQuantidade, lerNumero } from '../js/utils/moeda.js';
import { statusBadge } from './statusBadge.js';
import { abrirModal } from './modal.js';
import { avisar, avisarErro } from './toast.js';
import { icones } from './icons.js';

let contador = 0;

/**
 * Monta o formulário dentro de "raiz".
 * opcoes: { id, compacto, aoSalvar(orcamento) }
 */
export async function montarFormOrcamento(raiz, { id = null, compacto = false, aoSalvar } = {}) {
  const uid = `orc${++contador}`;
  const [clientes, servicos, materiais, config] = await Promise.all([
    window.api.clientes.listar(),
    window.api.servicos.listar(),
    window.api.materiais.listar(),
    window.api.config.obter(),
  ]);

  let estado = id ? await carregar(id) : novoEstado();
  if (!estado) {
    raiz.innerHTML = '<div class="painel carregando">Orçamento não encontrado.</div>';
    return;
  }
  let ocupado = false;

  // ---------- Estado ----------
  function linhaVazia() {
    return { material_id: null, descricao: '', unidade: 'un', quantidade: 0, unitario: 0 };
  }

  function novoEstado() {
    return {
      id: null,
      status: 'aguardando',
      cliente_id: '',
      servico_id: '',
      itens: [linhaVazia()],
      mao_obra: 0,
      deslocamento: lerNumero(config.deslocamento_padrao),
      observacoes: '',
    };
  }

  function deOrcamento(o) {
    return {
      id: o.id,
      status: o.status,
      cliente_id: o.cliente_id,
      servico_id: o.servico_id || '',
      itens: o.itens.length ? o.itens.map((i) => ({ ...i })) : [linhaVazia()],
      mao_obra: o.mao_obra,
      deslocamento: o.deslocamento,
      observacoes: o.observacoes || '',
    };
  }

  async function carregar(orcamentoId) {
    const o = await window.api.orcamentos.obter(orcamentoId);
    return o ? deOrcamento(o) : null;
  }

  const totalItem = (i) => Math.round(lerNumero(i.quantidade) * lerNumero(i.unitario) * 100) / 100;
  const totalGeral = () =>
    estado.itens.reduce((s, i) => s + totalItem(i), 0) + lerNumero(estado.mao_obra) + lerNumero(estado.deslocamento);

  // ---------- Tela ----------
  function opcoesClientes() {
    return `
      <option value="">Selecione o cliente...</option>
      ${clientes
        .map((c) => `<option value="${c.id}" ${c.id == estado.cliente_id ? 'selected' : ''}>${esc(c.nome)}</option>`)
        .join('')}
      <option value="__novo__">+ Cadastrar novo cliente...</option>`;
  }

  function opcoesServicos() {
    return `
      <option value="">Selecione o serviço...</option>
      ${servicos
        .map((s) => `<option value="${s.id}" ${s.id == estado.servico_id ? 'selected' : ''}>${esc(s.nome)}</option>`)
        .join('')}`;
  }

  function render() {
    const titulo = estado.id ? `Orçamento ${numeroOrcamento(estado.id)}` : 'Novo Orçamento';
    raiz.innerHTML = `
      <section class="painel painel-destaque">
        <div class="painel-cabecalho">
          <h2>${titulo} ${estado.id ? statusBadge(estado.status) : ''}</h2>
          ${estado.id && compacto ? `<button type="button" class="btn btn-contorno" data-acao="novo">${icones.mais} Novo orçamento</button>` : ''}
        </div>

        <div class="form-linha">
          <label class="grupo"><span>Cliente</span><select data-campo="cliente_id">${opcoesClientes()}</select></label>
          <label class="grupo"><span>Serviço</span><select data-campo="servico_id">${opcoesServicos()}</select></label>
        </div>

        <div class="secao-titulo">MATERIAIS</div>
        <datalist id="${uid}-materiais">
          ${materiais.map((m) => `<option value="${esc(m.descricao)}">`).join('')}
        </datalist>

        <table class="tabela tabela-itens">
          <thead>
            <tr>
              <th>Descrição</th>
              <th class="col-qtd">Qtd</th>
              <th class="col-unit">Unitário</th>
              <th class="col-total">Total</th>
              <th class="col-acao"></th>
            </tr>
          </thead>
          <tbody class="itens"></tbody>
          <tbody>
            <tr class="linha-add"><td colspan="5">
              <button type="button" class="btn btn-link" data-acao="adicionar">${icones.mais} Adicionar material</button>
            </td></tr>
          </tbody>
          <tbody class="extras">
            <tr>
              <td>Mão de obra</td><td>-</td><td>-</td>
              <td><div class="dinheiro"><span>R$</span><input data-campo="mao_obra" value="${formatarDecimal(estado.mao_obra)}" inputmode="decimal"></div></td>
              <td></td>
            </tr>
            <tr>
              <td>Deslocamento</td><td>-</td><td>-</td>
              <td><div class="dinheiro"><span>R$</span><input data-campo="deslocamento" value="${formatarDecimal(estado.deslocamento)}" inputmode="decimal"></div></td>
              <td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="3">TOTAL</td><td class="total-geral" colspan="2"></td></tr>
          </tfoot>
        </table>

        ${
          compacto
            ? ''
            : `<label class="campo form-observacoes">Observações (aparecem no PDF)
                 <textarea data-campo="observacoes" rows="3">${esc(estado.observacoes)}</textarea>
               </label>`
        }

        <div class="form-botoes">
          <button type="button" class="btn btn-secundario" data-acao="salvar">${icones.salvar} Salvar orçamento</button>
          <button type="button" class="btn btn-primario" data-acao="pdf">${icones.pdf} Gerar PDF</button>
        </div>
      </section>`;
    renderItens();
  }

  function renderItens() {
    const corpo = raiz.querySelector('tbody.itens');
    corpo.innerHTML = estado.itens
      .map(
        (item, i) => `
        <tr data-i="${i}">
          <td><input data-item="descricao" list="${uid}-materiais" value="${esc(item.descricao)}" placeholder="Digite ou escolha um material"></td>
          <td><div class="qtd"><input data-item="quantidade" value="${item.quantidade ? formatarQuantidade(item.quantidade) : ''}" inputmode="decimal" placeholder="0"><span>${esc(item.unidade)}</span></div></td>
          <td><div class="dinheiro"><span>R$</span><input data-item="unitario" value="${formatarDecimal(item.unitario)}" inputmode="decimal"></div></td>
          <td class="total-item">${formatarMoeda(totalItem(item))}</td>
          <td class="col-acao"><button type="button" class="btn-icone perigo" data-acao="remover" title="Remover linha">${icones.remover}</button></td>
        </tr>`
      )
      .join('');
    atualizarTotal();
  }

  function atualizarTotal() {
    raiz.querySelector('.total-geral').textContent = formatarMoeda(totalGeral());
  }

  // ---------- Eventos ----------
  raiz.addEventListener('input', (e) => {
    const alvo = e.target;
    const linha = alvo.closest('tr[data-i]');

    if (linha && alvo.dataset.item) {
      const item = estado.itens[linha.dataset.i];
      const campo = alvo.dataset.item;
      item[campo] = campo === 'descricao' ? alvo.value : lerNumero(alvo.value);

      if (campo === 'descricao') {
        // Escolheu um material da lista? Preenche unidade e preço
        const material = materiais.find((m) => m.descricao.toLowerCase() === alvo.value.trim().toLowerCase());
        if (material && item.material_id !== material.id) {
          item.material_id = material.id;
          item.unidade = material.unidade;
          item.unitario = material.preco;
          linha.querySelector('.qtd span').textContent = material.unidade;
          linha.querySelector('[data-item=unitario]').value = formatarDecimal(material.preco);
          if (!item.quantidade) linha.querySelector('[data-item=quantidade]').focus();
        } else if (!material) {
          item.material_id = null;
        }
      }
      linha.querySelector('.total-item').textContent = formatarMoeda(totalItem(item));
      atualizarTotal();
      return;
    }

    if (alvo.dataset.campo === 'mao_obra' || alvo.dataset.campo === 'deslocamento') {
      estado[alvo.dataset.campo] = lerNumero(alvo.value);
      atualizarTotal();
    } else if (alvo.dataset.campo === 'observacoes') {
      estado.observacoes = alvo.value;
    }
  });

  // Ao sair do campo, formata o número ("4.8" -> "4,80")
  raiz.addEventListener('focusout', (e) => {
    const alvo = e.target;
    const campo = alvo.dataset.item || alvo.dataset.campo;
    if (['unitario', 'mao_obra', 'deslocamento'].includes(campo)) alvo.value = formatarDecimal(lerNumero(alvo.value));
    if (campo === 'quantidade' && alvo.value) alvo.value = formatarQuantidade(lerNumero(alvo.value));
  });

  raiz.addEventListener('focusin', (e) => {
    if (e.target.matches('input[inputmode=decimal]')) e.target.select();
  });

  raiz.addEventListener('change', async (e) => {
    const alvo = e.target;
    if (alvo.dataset.campo === 'cliente_id') {
      if (alvo.value === '__novo__') {
        alvo.value = estado.cliente_id || '';
        cadastrarCliente();
      } else {
        estado.cliente_id = alvo.value;
      }
    }
    if (alvo.dataset.campo === 'servico_id') {
      const anterior = servicos.find((s) => s.id == estado.servico_id);
      const novo = servicos.find((s) => s.id == alvo.value);
      estado.servico_id = alvo.value;
      // Sugere a mão de obra padrão do serviço, se ainda não foi alterada à mão
      const maoAtual = lerNumero(estado.mao_obra);
      if (novo && (maoAtual === 0 || (anterior && maoAtual === anterior.mao_obra_padrao))) {
        estado.mao_obra = novo.mao_obra_padrao;
        raiz.querySelector('[data-campo=mao_obra]').value = formatarDecimal(novo.mao_obra_padrao);
        atualizarTotal();
      }
    }
  });

  raiz.addEventListener('keydown', (e) => {
    // Enter na última linha adiciona uma nova linha de material
    if (e.key === 'Enter' && e.target.closest('tbody.itens')) {
      e.preventDefault();
      adicionarLinha();
    }
  });

  raiz.addEventListener('click', async (e) => {
    const botao = e.target.closest('[data-acao]');
    if (!botao || ocupado) return;
    const acao = botao.dataset.acao;

    if (acao === 'adicionar') adicionarLinha();

    if (acao === 'remover') {
      const i = Number(botao.closest('tr').dataset.i);
      estado.itens.splice(i, 1);
      if (!estado.itens.length) estado.itens.push(linhaVazia());
      renderItens();
    }

    if (acao === 'novo') {
      estado = novoEstado();
      render();
    }

    if (acao === 'salvar') await salvar();

    if (acao === 'pdf') {
      const salvo = await salvar({ silencioso: true });
      if (!salvo) return;
      trabalhando(true);
      try {
        const caminho = await window.api.orcamentos.gerarPdf(salvo.id);
        if (caminho) avisar(`PDF gerado: ${caminho}`);
      } catch (err) {
        avisarErro(err);
      } finally {
        trabalhando(false);
      }
    }
  });

  function adicionarLinha() {
    estado.itens.push(linhaVazia());
    renderItens();
    raiz.querySelector(`tr[data-i="${estado.itens.length - 1}"] [data-item=descricao]`).focus();
  }

  function trabalhando(sim) {
    ocupado = sim;
    raiz.querySelectorAll('.form-botoes button').forEach((b) => (b.disabled = sim));
  }

  async function salvar({ silencioso = false } = {}) {
    if (!estado.cliente_id) {
      avisar('Selecione o cliente.', 'erro');
      raiz.querySelector('[data-campo=cliente_id]').focus();
      return null;
    }
    trabalhando(true);
    try {
      const salvo = await window.api.orcamentos.salvar({
        id: estado.id,
        cliente_id: Number(estado.cliente_id),
        servico_id: Number(estado.servico_id) || null,
        itens: estado.itens.map((i) => ({
          material_id: i.material_id,
          descricao: i.descricao,
          unidade: i.unidade,
          quantidade: lerNumero(i.quantidade),
          unitario: lerNumero(i.unitario),
        })),
        mao_obra: lerNumero(estado.mao_obra),
        deslocamento: lerNumero(estado.deslocamento),
        observacoes: estado.observacoes,
      });
      const eraNovo = !estado.id;
      estado = deOrcamento(salvo);
      render();
      if (!silencioso) avisar(`Orçamento ${numeroOrcamento(salvo.id)} ${eraNovo ? 'criado' : 'salvo'}.`);
      aoSalvar?.(salvo, eraNovo);
      return salvo;
    } catch (err) {
      avisarErro(err);
      return null;
    } finally {
      trabalhando(false);
    }
  }

  function cadastrarCliente() {
    abrirModal({
      titulo: 'Novo cliente',
      corpo: `
        <div class="grade-form">
          <label class="campo inteira"><span>Nome <span class="obrigatorio">*</span></span><input name="nome" required></label>
          <label class="campo">Telefone<input name="telefone"></label>
          <label class="campo">CPF / CNPJ<input name="documento"></label>
          <label class="campo inteira">Endereço<input name="endereco"></label>
        </div>`,
      aoConfirmar: async (form) => {
        const dados = Object.fromEntries(new FormData(form));
        const cliente = await window.api.clientes.salvar(dados);
        clientes.push(cliente);
        clientes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        estado.cliente_id = cliente.id;
        raiz.querySelector('[data-campo=cliente_id]').innerHTML = opcoesClientes();
        avisar('Cliente cadastrado.');
      },
    });
  }

  render();
}
