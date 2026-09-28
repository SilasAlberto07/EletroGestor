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

### 4. Criar o token de publicação

O token é a "senha" que permite ao seu computador publicar versões no GitHub.

1. GitHub → foto do perfil → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
2. Nome: `eletrogestor-publicar`. Marque a permissão **repo**.
3. Copie o token (começa com `ghp_`). Ele só aparece uma vez.

**Nunca coloque o token dentro do código nem envie para o GitHub.** Ele é usado só no terminal, na hora de publicar.

---

## Publicar uma versão nova (toda vez)

1. Faça as alterações no sistema e teste com `npm start`.
2. No `package.json`, aumente a versão. Exemplo: `"version": "1.0.0"` → `"version": "1.0.1"`.
   - Correção pequena: 1.0.**1**
   - Função nova: 1.**1**.0
   - Mudança grande: **2**.0.0
3. No **PowerShell**, dentro da pasta do projeto:

```powershell
$env:GH_TOKEN="ghp_seu_token_aqui"
npm run publicar
```

(No **Prompt de Comando (cmd)**, use `set GH_TOKEN=ghp_seu_token_aqui` no lugar da primeira linha.)

4. Pronto! O comando gera o instalador e publica em **Releases** no GitHub. Os computadores com o EletroGestor instalado vão receber a atualização sozinhos.

5. Salve o código também: `git add .`, `git commit -m "Versão 1.0.1"` e `git push`.

### A primeira instalação

Na primeira vez, baixe o instalador `EletroGestor-Setup-1.0.0.exe` na página **Releases** do seu repositório e instale normalmente. Daí em diante, as atualizações chegam sozinhas.

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
| Erro 401 ao publicar | Token errado ou sem a permissão **repo**. |
| Atualização não aparece | Confira se a versão no `package.json` é **maior** que a instalada. |
