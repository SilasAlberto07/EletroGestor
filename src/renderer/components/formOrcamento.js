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
  const [clientes, servicos, materiais, tiposMaoObra, config] = await Promise.all([
    window.api.clientes.listar(),
    window.api.servicos.listar(),
    window.api.materiais.listar(),
    window.api.maoObra.listar(),
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

  function linhaMaoObraVazia() {
    return { tipo_id: null, descricao: '', unidade: '', quantidade: 0, unitario: 0 };
  }

  function novoEstado() {
    return {
      id: null,
      status: 'aguardando',
      cliente_id: '',
      servico_id: '',
      itens: [linhaVazia()],
      maoObra: [linhaMaoObraVazia()],
      deslocamento_km: 0,
      deslocamento_valor_km: lerNumero(config.valor_km_padrao),
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
      // Uma única mão de obra por orçamento
      maoObra: o.mao_obra_itens?.length ? [deMaoObra(o.mao_obra_itens[0])] : [linhaMaoObraVazia()],
      deslocamento_km: o.deslocamento_km || 0,
      deslocamento_valor_km: o.deslocamento_valor_km || 0,
      observacoes: o.observacoes || '',
    };
  }

  // Orçamento antigo (mão de obra sem tipo): mantém quantidade e valor,
  // mas pede para escolher um dos tipos ao salvar
  function deMaoObra(linha) {
    const tipo = tiposMaoObra.find((t) => t.id == linha.tipo_id);
    return tipo ? { ...linha } : { ...linha, tipo_id: null, descricao: '', unidade: '' };
  }

  async function carregar(orcamentoId) {
    const o = await window.api.orcamentos.obter(orcamentoId);
    return o ? deOrcamento(o) : null;
  }

  // Material, mão de obra e deslocamento usam a mesma conta: quantidade x valor
  const totalItem = (i) => Math.round(lerNumero(i.quantidade) * lerNumero(i.unitario) * 100) / 100;
  const totalDeslocamento = () =>
    totalItem({ quantidade: estado.deslocamento_km, unitario: estado.deslocamento_valor_km });
  const totalGeral = () =>
    estado.itens.reduce((s, i) => s + totalItem(i), 0) +
    estado.maoObra.reduce((s, m) => s + totalItem(m), 0) +
    totalDeslocamento();

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
          <tbody>
            <tr class="linha-secao"><td colspan="5">MÃO DE OBRA</td></tr>
          </tbody>
          <tbody class="mao-obra"></tbody>
          <tbody class="extras">
            <tr class="linha-secao"><td colspan="5">DESLOCAMENTO</td></tr>
            <tr>
              <td>Deslocamento</td>
              <td><div class="qtd"><input data-campo="deslocamento_km" value="${estado.deslocamento_km ? formatarQuantidade(estado.deslocamento_km) : ''}" inputmode="decimal" placeholder="0" title="Quantidade de KM"><span>km</span></div></td>
              <td><div class="dinheiro"><span>R$</span><input data-campo="deslocamento_valor_km" value="${formatarDecimal(estado.deslocamento_valor_km)}" inputmode="decimal" title="Valor do KM"></div></td>
              <td class="total-deslocamento">${formatarMoeda(totalDeslocamento())}</td>
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
    renderMaoObra();
  }

  function opcoesMaoObra(linha) {
    return `
      <option value="">Selecione o tipo de mão de obra...</option>
      ${tiposMaoObra
        .map((t) => `<option value="${t.id}" ${t.id == linha.tipo_id ? 'selected' : ''}>${esc(t.descricao)}</option>`)
        .join('')}`;
  }

  function renderMaoObra() {
    const corpo = raiz.querySelector('tbody.mao-obra');
    corpo.innerHTML = estado.maoObra
      .map(
        (linha, i) => `
        <tr data-m="${i}">
          <td><select data-mo="tipo_id">${opcoesMaoObra(linha)}</select></td>
          <td><div class="qtd"><input data-mo="quantidade" value="${linha.quantidade ? formatarQuantidade(linha.quantidade) : ''}" inputmode="decimal" placeholder="0"><span>${esc(linha.unidade)}</span></div></td>
          <td><div class="dinheiro"><span>R$</span><input data-mo="unitario" value="${formatarDecimal(linha.unitario)}" inputmode="decimal"></div></td>
          <td class="total-item">${formatarMoeda(totalItem(linha))}</td>
          <td></td>
        </tr>`
      )
      .join('');
    atualizarTotal();
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

    // Quantidade ou valor de uma linha de mão de obra
    const linhaMo = alvo.closest('tr[data-m]');
    if (linhaMo && (alvo.dataset.mo === 'quantidade' || alvo.dataset.mo === 'unitario')) {
      const linha = estado.maoObra[linhaMo.dataset.m];
      linha[alvo.dataset.mo] = lerNumero(alvo.value);
      linhaMo.querySelector('.total-item').textContent = formatarMoeda(totalItem(linha));
      atualizarTotal();
      return;
    }

    if (alvo.dataset.campo === 'deslocamento_km' || alvo.dataset.campo === 'deslocamento_valor_km') {
      estado[alvo.dataset.campo] = lerNumero(alvo.value);
      raiz.querySelector('.total-deslocamento').textContent = formatarMoeda(totalDeslocamento());
      atualizarTotal();
    } else if (alvo.dataset.campo === 'observacoes') {
      estado.observacoes = alvo.value;
    }
  });

  // Ao sair do campo, formata o número ("4.8" -> "4,80")
  raiz.addEventListener('focusout', (e) => {
    const alvo = e.target;
    const campo = alvo.dataset.item || alvo.dataset.mo || alvo.dataset.campo;
    if (['unitario', 'deslocamento_valor_km'].includes(campo)) alvo.value = formatarDecimal(lerNumero(alvo.value));
    if (['quantidade', 'deslocamento_km'].includes(campo) && alvo.value) alvo.value = formatarQuantidade(lerNumero(alvo.value));
  });

  raiz.addEventListener('focusin', (e) => {
    if (e.target.matches('input[inputmode=decimal]')) e.target.select();
  });

  raiz.addEventListener('change', async (e) => {
    const alvo = e.target;

    // Escolheu o tipo de mão de obra: preenche a unidade e o valor sugerido
    if (alvo.dataset.mo === 'tipo_id') {
      const tr = alvo.closest('tr[data-m]');
      const linha = estado.maoObra[tr.dataset.m];
      const tipo = tiposMaoObra.find((t) => t.id == alvo.value);
      if (tipo) {
        linha.tipo_id = tipo.id;
        linha.descricao = tipo.descricao;
        linha.unidade = tipo.unidade;
        linha.unitario = tipo.preco;
      } else {
        Object.assign(linha, linhaMaoObraVazia());
        tr.querySelector('[data-mo=quantidade]').value = '';
      }
      tr.querySelector('.qtd span').textContent = linha.unidade;
      tr.querySelector('[data-mo=unitario]').value = formatarDecimal(linha.unitario);
      tr.querySelector('.total-item').textContent = formatarMoeda(totalItem(linha));
      atualizarTotal();
      if (tipo) tr.querySelector('[data-mo=quantidade]').focus();
      return;
    }

    if (alvo.dataset.campo === 'cliente_id') {
      if (alvo.value === '__novo__') {
        alvo.value = estado.cliente_id || '';
        cadastrarCliente();
      } else {
        estado.cliente_id = alvo.value;
      }
    }
    if (alvo.dataset.campo === 'servico_id') {
      estado.servico_id = alvo.value;
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
        mao_obra_itens: estado.maoObra.map((m) => ({
          tipo_id: m.tipo_id,
          descricao: m.descricao,
          unidade: m.unidade,
          quantidade: lerNumero(m.quantidade),
          unitario: lerNumero(m.unitario),
        })),
        deslocamento_km: lerNumero(estado.deslocamento_km),
        deslocamento_valor_km: lerNumero(estado.deslocamento_valor_km),
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
