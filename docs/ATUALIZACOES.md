# Atualização automática pelo GitHub

O EletroGestor instalado verifica sozinho se existe versão nova nas **Releases** do seu repositório no GitHub:

1. Ao abrir o programa (e a cada 4 horas), ele consulta o GitHub.
2. Se houver versão nova, **baixa em segundo plano** (aparece a barra no menu lateral).
3. Quando termina, aparece o botão **"Reiniciar e atualizar"**.
4. Antes de instalar, o sistema faz uma **cópia de segurança do banco** em `AppData\Roaming\eletrogestor\backups`.
5. Se o usuário não clicar, a atualização é instalada na próxima vez que fechar o programa.

Os dados (orçamentos, clientes, logo) **não são apagados** na atualização, porque ficam na pasta do usuário e não na pasta do programa.

> A verificação só funciona no programa **instalado** (.exe). Rodando com `npm start` aparece o aviso "só funciona no programa instalado".

---

## Configuração (só uma vez)

### 1. Criar o repositório no GitHub

1. Crie uma conta em https://github.com (se ainda não tiver).
2. Clique em **New repository**, nome: `eletrogestor`.
3. Marque **Public**. (Veja abaixo sobre repositório privado.)

### 2. Colocar seu usuário no projeto

No arquivo `electron-builder.yml`, troque `SEU_USUARIO_GITHUB` pelo seu usuário do GitHub:

```yaml
publish:
  provider: github
  owner: seu-usuario-aqui
  repo: eletrogestor
```

### 3. Enviar o código para o GitHub

No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Primeira versão do EletroGestor"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/eletrogestor.git
git push -u origin main
```

O `.gitignore` já impede que `node_modules` e `dist` sejam enviados.

### 4. Permitir que o GitHub publique

No repositório: **Settings** → **Actions** → **General** → em **Workflow permissions**, marque **Read and write permissions** e clique em **Save**.

Não precisa criar token: o GitHub usa um token automático próprio para publicar.

---

## Publicar uma versão nova (toda vez)

1. Faça as alterações e teste com `npm start`.
2. Salve as alterações no Git:

```bash
git add .
git commit -m "O que mudou nesta versão"
```

3. Lance a versão com **um** destes comandos:

| Comando | Quando usar | Exemplo |
|---|---|---|
| `npm run lancar` | Correção pequena | 1.0.0 → 1.0.**1** |
| `npm run lancar:funcao` | Função nova | 1.0.1 → 1.**1**.0 |
| `npm run lancar:grande` | Mudança grande | 1.1.0 → **2**.0.0 |

O comando faz tudo sozinho:
- aumenta a versão no `package.json`;
- cria o commit "Versão 1.0.1" e a tag `v1.0.1`;
- envia para o GitHub.

4. Ao receber a tag, o GitHub gera o instalador no Windows e publica a Release (leva uns 5 a 10 minutos). Acompanhe na aba **Actions** do repositório: bolinha amarela = gerando, verde = publicado, vermelha = erro.

5. Pronto! Os computadores com o EletroGestor instalado recebem a atualização sozinhos.

> O `npm run lancar` só funciona se não houver alterações sem commit. Se aparecer o erro "Git working directory not clean", faça o passo 2 antes.

### A primeira instalação

Rode `npm run lancar` uma vez para gerar a primeira Release. Depois baixe o instalador `EletroGestor-Setup-x.x.x.exe` na página **Releases** do repositório e instale normalmente. Daí em diante, as atualizações chegam sozinhas.

### Publicar pelo seu computador (alternativa)

Se preferir gerar o instalador na sua máquina em vez do GitHub, crie um token (GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic), permissão **repo**), aumente a versão no `package.json` e rode no PowerShell:

```powershell
$env:GH_TOKEN="ghp_seu_token_aqui"
npm run publicar
```

**Nunca coloque o token dentro de arquivos do projeto.**

---

## Repositório privado

Com repositório **privado**, o programa instalado precisaria de um token para baixar as atualizações, e esse token ficaria dentro do .exe, onde qualquer pessoa conseguiria extrair. Por isso não é recomendado.

Se quiser manter o código fechado, a solução é ter **dois repositórios**:

- `eletrogestor` (privado): o código-fonte.
- `eletrogestor-releases` (público): só os instaladores. No `electron-builder.yml`, coloque `repo: eletrogestor-releases`.

---

## Problemas comuns

| Mensagem | O que fazer |
|---|---|
| "Nenhuma versão publicada encontrada no GitHub" | Ainda não rodou `npm run publicar`, ou o usuário/repositório no `electron-builder.yml` está errado. |
| "Sem conexão com a internet" | O computador está offline. Ele tenta de novo depois. |
| Erro 401 ao publicar | Token errado ou sem a permissão **repo** (só na publicação pelo computador). |
| Erro 403 na aba Actions | Faltou marcar **Read and write permissions** (passo 4 da configuração). |
| "Git working directory not clean" | Faça `git add .` e `git commit` antes do `npm run lancar`. |
| Atualização não aparece | Confira se a versão no `package.json` é **maior** que a instalada. |
