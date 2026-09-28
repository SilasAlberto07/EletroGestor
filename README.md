# EletroGestor

Sistema de orçamentos para serviços elétricos, feito com **Electron + HTML/CSS/JavaScript** e banco **SQLite** local.

## Como rodar

1. Instale o **Node.js** (versão 20 ou mais nova): https://nodejs.org
2. Abra o terminal na pasta do projeto e rode:

```bash
npm install
npm start
```

Para abrir já com as ferramentas de desenvolvedor: `npm run dev`

## Como gerar o instalador (.exe)

```bash
npm run dist
```

O instalador aparece na pasta `dist/`.

Para publicar uma versão nova no GitHub (os programas instalados atualizam sozinhos): `npm run publicar`. Veja [`docs/ATUALIZACOES.md`](docs/ATUALIZACOES.md).

## Funcionalidades

- **Início (Dashboard):** cards de resumo, orçamentos recentes e criação rápida de orçamento
- **Orçamentos:** lista com filtro por status, busca, troca de status, edição, exclusão e PDF
- **Clientes, Serviços e Materiais:** cadastro completo com busca
- **Configurações:** logo da empresa (vai para o PDF), dados da empresa, deslocamento padrão, validade, condições, backup e restauração
- **PDF:** gerado pelo próprio Electron, salvo em `Documentos/EletroGestor/Orcamentos`
- **Atualização automática:** pelo GitHub Releases. Veja o passo a passo em [`docs/ATUALIZACOES.md`](docs/ATUALIZACOES.md)

Na primeira vez que abre, o sistema cria dados de exemplo (5 clientes, 5 orçamentos). Pode excluí-los pelo próprio sistema.

## Onde ficam os dados

O banco (`eletrogestor.db`) fica na pasta de dados do usuário, **não** na pasta do programa. Assim ele não se perde ao atualizar:

- Windows: `C:\Users\SEU_USUARIO\AppData\Roaming\eletrogestor\`

Em **Configurações → Abrir pasta dos dados** você chega direto nela.

## Estrutura de pastas

```
src/
├── main/                     PROCESSO PRINCIPAL (Node.js)
│   ├── main.js               Ponto de entrada
│   ├── window.js             Janela principal
│   ├── menu.js               Menu do topo
│   ├── database/
│   │   ├── connection.js     Conexão SQLite (todos, um, executar, transacao)
│   │   ├── migrations/       Criação das tabelas (rodam sozinhas, em ordem)
│   │   └── seeds/            Dados de exemplo
│   ├── modules/              Um módulo por área do sistema
│   │   ├── ipc.js            Ajuda a registrar canais com tratamento de erro
│   │   ├── index.js          Registra todos os módulos
│   │   ├── dashboard/
│   │   ├── orcamentos/       repository (SQL) → service (regras) → ipc (canais)
│   │   │   └── pdf/          gerarPdf.js + template.html
│   │   ├── clientes/
│   │   ├── servicos/
│   │   ├── materiais/
│   │   └── configuracoes/
│   └── utils/                paths.js, backup.js, atualizacao.js
│
├── preload/
│   └── preload.js            Ponte segura: tudo que a tela pode chamar (window.api)
│
└── renderer/                 TELAS
    ├── index.html
    ├── css/                  variaveis.css (cores), base, layout, componentes
    ├── components/           sidebar, card, tabela, modal, toast, formOrcamento, crudPage
    ├── pages/                uma pasta por item do menu
    ├── js/                   app.js, router.js, utils/ (moeda, data, dom)
    └── assets/img/
```

## Como as partes conversam

Exemplo do botão **Salvar orçamento**:

1. `renderer/components/formOrcamento.js` chama `window.api.orcamentos.salvar(dados)`
2. `preload/preload.js` envia pelo canal `orcamentos:salvar`
3. `main/modules/orcamentos/orcamento.ipc.js` recebe e chama o service
4. `orcamento.service.js` valida e recalcula os totais
5. `orcamento.repository.js` grava no banco

## Como adicionar algo novo

**Nova coluna em uma tabela:** crie `src/main/database/migrations/006_nome.sql` com o `ALTER TABLE`. Ela roda sozinha na próxima abertura. Nunca edite uma migration que já rodou.

**Novo módulo (ex.: Financeiro):**
1. `src/main/modules/financeiro/` com `repository`, `service` e `ipc`
2. Registre em `src/main/modules/index.js`
3. Exponha os canais em `src/preload/preload.js`
4. Crie `src/renderer/pages/financeiro/financeiro.js`
5. Adicione a rota em `js/router.js` e o item em `components/sidebar.js`

**Mudar as cores:** edite `src/renderer/css/variaveis.css`.

**Mudar o layout do PDF:** edite `src/main/modules/orcamentos/pdf/template.html`.

## Segurança

A janela usa `contextIsolation: true`, `nodeIntegration: false` e `sandbox: true`. As telas nunca acessam o banco diretamente, só pelo `preload`.
