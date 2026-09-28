// Configurações: dados da empresa, valores padrão e backup
import { avisar, avisarErro } from '../../components/toast.js';
import { icones, logo as logoPadrao } from '../../components/icons.js';
import { textoEstado, instalarAtualizacao } from '../../components/avisoAtualizacao.js';
import { esc } from '../../js/utils/dom.js';
import { formatarDecimal, lerNumero } from '../../js/utils/moeda.js';

export async function render(raiz) {
  const [config, info] = await Promise.all([window.api.config.obter(), window.api.config.info()]);

  const campo = (nome, rotulo, extra = '') =>
    `<label class="campo ${extra}">${rotulo}<input name="${nome}" value="${esc(config[nome])}"></label>`;

  raiz.innerHTML = `
    <div class="pagina">
      <div class="pagina-topo"><h1>Configurações</h1></div>

      <section class="painel">
        <div class="painel-cabecalho"><h2>Logo da empresa</h2></div>
        <p class="info-linha" style="margin:0 0 12px">
          A logo aparece no cabeçalho do PDF. Use PNG, JPG, WEBP ou SVG de até 2 MB (de preferência com fundo transparente).
        </p>
        <div class="logo-config">
          <div class="logo-preview"></div>
          <div class="botoes-linha">
            <button type="button" class="btn btn-primario" data-acao="trocar-logo">Trocar logo</button>
            <button type="button" class="btn btn-contorno" data-acao="remover-logo">Usar logo padrão</button>
          </div>
        </div>
      </section>

      <form class="painel form-config" novalidate>
        <div class="painel-cabecalho"><h2>Dados da empresa</h2></div>
        <p class="info-linha" style="margin:0 0 12px">Estas informações aparecem no cabeçalho do PDF.</p>
        <div class="grade-form">
          ${campo('empresa_nome', 'Nome da empresa', 'inteira')}
          ${campo('empresa_documento', 'CNPJ / CPF')}
          ${campo('empresa_telefone', 'Telefone')}
          ${campo('empresa_email', 'E-mail')}
          ${campo('responsavel', 'Responsável técnico (assinatura)')}
          ${campo('empresa_endereco', 'Endereço', 'inteira')}
        </div>

        <div class="painel-cabecalho" style="margin-top:22px"><h2>Padrões do orçamento</h2></div>
        <div class="grade-form">
          <label class="campo">Deslocamento padrão (R$)
            <input name="deslocamento_padrao" inputmode="decimal" value="${formatarDecimal(lerNumero(config.deslocamento_padrao))}">
          </label>
          <label class="campo">Validade do orçamento (dias)
            <input name="validade_dias" type="number" min="1" value="${esc(config.validade_dias)}">
          </label>
          <label class="campo inteira">Condições (aparecem no PDF)
            <textarea name="condicoes" rows="3">${esc(config.condicoes)}</textarea>
          </label>
        </div>

        <div class="form-botoes">
          <button type="submit" class="btn btn-primario">${icones.salvar} Salvar configurações</button>
        </div>
      </form>

      <section class="painel">
        <div class="painel-cabecalho"><h2>Backup dos dados</h2></div>
        <p class="info-linha" style="margin:0 0 12px">
          Faça backup com frequência e guarde em um pendrive ou na nuvem.<br>
          Arquivo do banco: ${esc(info.caminhoBanco)}
        </p>
        <div class="botoes-linha">
          <button type="button" class="btn btn-primario" data-acao="backup">Fazer backup</button>
          <button type="button" class="btn btn-contorno" data-acao="restaurar">Restaurar backup</button>
          <button type="button" class="btn btn-contorno" data-acao="pasta">Abrir pasta dos dados</button>
        </div>
      </section>

      <section class="painel">
        <div class="painel-cabecalho"><h2>Atualizações</h2></div>
        <p class="info-linha" style="margin:0 0 12px">
          Versão instalada: <strong>${esc(info.versao)}</strong>. O sistema procura atualizações sozinho ao abrir.
        </p>
        <div class="botoes-linha">
          <button type="button" class="btn btn-contorno" data-acao="verificar-atualizacao">Verificar atualizações</button>
          <button type="button" class="btn btn-primario" data-acao="instalar-atualizacao" hidden>Reiniciar e atualizar</button>
        </div>
        <p class="info-linha estado-atualizacao" style="margin:12px 0 0"></p>
      </section>
    </div>`;

  function mostrarLogo(logo) {
    const preview = raiz.querySelector('.logo-preview');
    preview.innerHTML = logo
      ? `<img src="${esc(logo)}" alt="Logo da empresa">`
      : `<div class="logo-padrao">${logoPadrao}<span>Logo padrão</span></div>`;
    raiz.querySelector('[data-acao=remover-logo]').hidden = !logo;
  }
  mostrarLogo(config.logo);

  // ---------- Atualizações ----------
  function mostrarAtualizacao(e) {
    if (!raiz.isConnected) return pararDeOuvir?.(); // saiu da página
    const texto = raiz.querySelector('.estado-atualizacao');
    texto.textContent = textoEstado(e);
    raiz.querySelector('[data-acao=instalar-atualizacao]').hidden = e.estado !== 'pronta';
    raiz.querySelector('[data-acao=verificar-atualizacao]').disabled = ['verificando', 'baixando'].includes(e.estado);
  }
  const pararDeOuvir = window.api.atualizacao.aoMudar(mostrarAtualizacao);
  mostrarAtualizacao(await window.api.atualizacao.estado());

  raiz.querySelector('.form-config').addEventListener('submit', async (e) => {
    e.preventDefault();
    const botao = e.target.querySelector('[type=submit]');
    botao.disabled = true;
    try {
      const dados = Object.fromEntries(new FormData(e.target));
      dados.deslocamento_padrao = String(lerNumero(dados.deslocamento_padrao));
      await window.api.config.salvar(dados);
      avisar('Configurações salvas.');
    } catch (err) {
      avisarErro(err);
    } finally {
      botao.disabled = false;
    }
  });

  raiz.addEventListener('click', async (e) => {
    const acao = e.target.closest('[data-acao]')?.dataset.acao;
    try {
      if (acao === 'verificar-atualizacao') mostrarAtualizacao(await window.api.atualizacao.verificar());
      if (acao === 'instalar-atualizacao') await instalarAtualizacao();
      if (acao === 'trocar-logo') {
        const logo = await window.api.config.escolherLogo();
        if (logo) {
          mostrarLogo(logo);
          avisar('Logo atualizada. Ela já aparece nos próximos PDFs.');
        }
      }
      if (acao === 'remover-logo') {
        await window.api.config.removerLogo();
        mostrarLogo('');
        avisar('Voltando a usar a logo padrão.');
      }
      if (acao === 'backup') {
        const caminho = await window.api.config.backup();
        if (caminho) avisar(`Backup salvo em ${caminho}`);
      }
      if (acao === 'restaurar') {
        if (await window.api.config.restaurar()) location.reload(); // recarrega com os dados restaurados
      }
      if (acao === 'pasta') await window.api.config.abrirPastaDados();
    } catch (err) {
      avisarErro(err);
    }
  });
}
