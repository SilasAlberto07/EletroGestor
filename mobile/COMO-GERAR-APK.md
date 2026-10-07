# EletroGestor para Android

A versão Android usa **as mesmas telas e as mesmas regras** do programa do computador
(pastas `src/renderer` e `src/main`). Esta pasta `mobile` só tem o que muda no celular:

| Arquivo | O que faz |
|---|---|
| `src/api.js` | Cria o `window.api` do celular (no computador quem faz isso é o `preload.js`) |
| `src/connection.js` | Banco de dados no celular (mesmo SQLite e mesmas migrations) |
| `src/pdf.js` | Gera o PDF com o mesmo modelo do computador e abre a tela de compartilhar |
| `src/celular.css` | Ajustes de tela para celular (menu que abre por cima, orçamento em cartões) |
| `src/ui.js` | Barra do topo, botão de menu e botão "voltar" do Android |
| `recursos-android/` | Ícone e tela de abertura do app |
| `assinatura/` | **Chave de assinatura do APK. Não apague e guarde uma cópia!** |

Quando você muda alguma tela ou regra no computador, a mudança vai junto para o celular
na próxima vez que gerar o APK. Não precisa mexer em nada aqui.

---

## Jeito 1 — Automático pelo GitHub (recomendado)

Configure uma vez e depois é só usar o `npm run lancar` de sempre: o GitHub gera o
instalador do Windows **e** o APK, e coloca os dois na mesma Release.

**Configuração (só uma vez):**

1. Abra o repositório no GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Clique em **New repository secret** e crie:
   - Nome: `ANDROID_KEYSTORE_BASE64`
     Valor: todo o texto do arquivo `mobile/assinatura/eletrogestor.jks.base64.txt`
   - Nome: `ANDROID_KEYSTORE_SENHA`
     Valor: a senha da linha `storePassword=` do arquivo `mobile/assinatura/assinatura.properties`
3. Pronto. No próximo `npm run lancar`, o APK aparece na Release (aba **Releases** do GitHub)
   com o nome `EletroGestor-x.y.z.apk`.

O app no celular também procura versões novas nas Releases e mostra o botão
**"Baixar atualização"** (em Configurações e no menu).

---

## Jeito 2 — Gerar no seu computador

**Precisa instalar uma vez:**
- [Android Studio](https://developer.android.com/studio) (já vem com o Java e o Android SDK).
  Abra o Android Studio uma vez e deixe ele terminar de baixar o SDK.
- Node.js 22 ou mais novo (o mesmo que você já usa no projeto).

**Para gerar o APK**, na pasta do EletroGestor:

```
npm run apk
```

Na primeira vez demora alguns minutos (baixa as bibliotecas do Android).
O APK fica em `mobile/apk/EletroGestor-x.y.z.apk`.

Se der erro dizendo que não achou o Java ou o SDK, abra o Android Studio uma vez,
ou defina as variáveis `JAVA_HOME` (pasta `jbr` do Android Studio) e `ANDROID_HOME`
(normalmente `C:\Users\SEU_USUARIO\AppData\Local\Android\Sdk`).

---

## Instalar no celular

1. Passe o arquivo `.apk` para o celular (WhatsApp, Google Drive, cabo USB...) ou baixe pela
   página de Releases do GitHub direto no celular.
2. Toque no arquivo. Na primeira vez o Android pede para **permitir instalar apps desta fonte** — permita.
3. Para atualizar, é só instalar o APK novo por cima. Os dados continuam.

> ⚠ **Não desinstale o app para atualizar**: desinstalar apaga os dados do celular.
> Faça backup antes (Configurações → Fazer backup).

---

## Testar no navegador (sem gerar APK)

```
npm run celular:testar
```

Abra http://localhost:5173 no Chrome, aperte **F12** e clique no ícone de celular
para ver como fica na tela pequena. (No navegador os dados ficam só naquele navegador.)

---

## Diferenças do celular

- **Os dados do celular são separados dos do computador.** Para levar os dados do PC para o
  celular: no computador faça **Fazer backup**, mande o arquivo `.db` para o celular e no app use
  **Configurações → Restaurar backup**. Funciona no outro sentido também.
- **PDF e backup** abrem a tela de compartilhar do Android (WhatsApp, e-mail, Drive, "Salvar em Arquivos").
- O celular começa **sem os dados de exemplo**.

## A chave de assinatura (pasta `assinatura`)

O Android só aceita atualizar um app se o APK novo tiver a **mesma assinatura** do anterior.
Se você perder a pasta `mobile/assinatura`, os próximos APKs não instalam por cima: seria preciso
desinstalar (e perder os dados do celular). Por isso:

- Guarde uma cópia da pasta `mobile/assinatura` em lugar seguro.
- Ela **não vai para o GitHub** (está no `.gitignore`), porque quem tiver a chave pode
  assinar apps em seu nome.

---

## Sincronização com o Google Drive (celular ⇄ computador)

Em **Configurações → Sincronização com o Google Drive → Entrar com Google**, nos dois aparelhos,
com a **mesma conta Google**. A partir daí:

- Ao abrir o app (ou voltar para ele), se o outro aparelho mudou algo, os dados são baixados.
- Ao salvar qualquer coisa, os dados são enviados para o Drive (uns 3 segundos depois).
- Sem internet funciona normal; envia quando a conexão voltar.
- Se os dois aparelhos mudarem dados sem sincronizar no meio (ex.: os dois sem internet), o app
  **não apaga nada sozinho**: pergunta qual versão manter.

O arquivo fica no Drive com o nome `EletroGestor - dados (não apague).db`. O app só tem acesso a
esse arquivo (permissão `drive.file`), nada mais do Drive.

Os códigos do Google Cloud ficam em `src/main/sync/google-config.js`. A chave secreta do cliente
"App para computador" fica só no secret `GOOGLE_CLIENT_SECRET` do GitHub (nunca no código, porque o
repositório é público); para testar no computador, defina a variável de ambiente `GOOGLE_CLIENT_SECRET`. O login do Android só funciona
no APK assinado com a chave da pasta `mobile/assinatura` (a impressão SHA-1 dela está cadastrada no
Google Cloud, no cliente "EletroGestor Android").
