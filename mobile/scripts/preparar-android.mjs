// Prepara o projeto Android (pasta mobile/android) a partir do www montado:
//  - cria o projeto na primeira vez (npx cap add android)
//  - copia o www e os plugins (npx cap sync)
//  - coloca o ícone e a tela de abertura do EletroGestor
//  - usa a mesma versão do package.json do computador
//  - configura a assinatura do APK (pasta mobile/assinatura)
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MOBILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID = path.join(MOBILE, 'android');
const RAIZ = path.resolve(MOBILE, '..');
const rodar = (cmd) => execSync(cmd, { cwd: MOBILE, stdio: 'inherit' });

if (!fs.existsSync(ANDROID)) {
  console.log('Criando o projeto Android...');
  rodar('npx cap add android');
}
rodar('npx cap sync android');

// Ícone e tela de abertura
fs.cpSync(path.join(MOBILE, 'recursos-android', 'res'), path.join(ANDROID, 'app', 'src', 'main', 'res'), { recursive: true });

// Tela principal do Android: o login do Google (plugin SocialLogin) precisa receber
// a resposta da janela de permissão do Drive. Ver README do @capgo/capacitor-social-login.
const mainActivity = path.join(ANDROID, 'app', 'src', 'main', 'java', 'br', 'com', 'eletrogestor', 'app', 'MainActivity.java');
fs.writeFileSync(
  mainActivity,
  `package br.com.eletrogestor.app;

import android.content.Intent;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

// Gerado por mobile/scripts/preparar-android.mjs (não edite aqui)
public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle handle = getBridge().getPlugin("SocialLogin");
            if (handle == null) return;
            Plugin plugin = handle.getInstance();
            if (plugin instanceof SocialLoginPlugin) {
                ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
            }
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}
`
);

// Versão: 1.2.3 -> versionName "1.2.3" e versionCode 10203 (precisa sempre aumentar)
const versao = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')).version;
const [maior, menor, correcao] = versao.split('.').map((n) => parseInt(n, 10) || 0);
const versionCode = maior * 10000 + menor * 100 + correcao;

const gradle = path.join(ANDROID, 'app', 'build.gradle');
let g = fs.readFileSync(gradle, 'utf8');
g = g.replace(/versionCode \d+/, `versionCode ${versionCode}`).replace(/versionName "[^"]*"/, `versionName "${versao}"`);

// Assinatura: lê mobile/assinatura/assinatura.properties (no PC) ou variáveis de ambiente (no GitHub)
if (!g.includes('ELETROGESTOR-ASSINATURA')) {
  g = g.replace(
    "apply plugin: 'com.android.application'",
    `apply plugin: 'com.android.application'

// ELETROGESTOR-ASSINATURA (adicionado por mobile/scripts/preparar-android.mjs)
def assinaturaProps = new Properties()
def assinaturaArquivo = rootProject.file('../assinatura/assinatura.properties')
if (assinaturaArquivo.exists()) { assinaturaArquivo.withInputStream { assinaturaProps.load(it) } }
def assinatura = { String chave, String variavel -> System.getenv(variavel) ?: assinaturaProps.getProperty(chave) }
def arquivoChave = assinatura('storeFile', 'ELETRO_KEYSTORE')
def temAssinatura = arquivoChave != null
if (temAssinatura && !new File(arquivoChave).isAbsolute()) { arquivoChave = rootProject.file('../assinatura/' + arquivoChave).path }`
  );
  g = g.replace(
    /(\n\s*)buildTypes \{/,
    `$1signingConfigs {
        release {
            if (temAssinatura) {
                storeFile file(arquivoChave)
                storePassword assinatura('storePassword', 'ELETRO_SENHA')
                keyAlias assinatura('keyAlias', 'ELETRO_ALIAS') ?: 'eletrogestor'
                keyPassword assinatura('keyPassword', 'ELETRO_SENHA')
            }
        }
    }$1buildTypes {`
  );
  g = g.replace(/(release \{\s*\n\s*minifyEnabled false)/, `$1\n            if (temAssinatura) { signingConfig signingConfigs.release }`);
  if (!g.includes('signingConfig signingConfigs.release')) throw new Error('Não foi possível configurar a assinatura no build.gradle');
}
fs.writeFileSync(gradle, g);

// No Windows: se o Android Studio estiver instalado no lugar padrão, aponta o SDK automaticamente
const localProps = path.join(ANDROID, 'local.properties');
if (!fs.existsSync(localProps) && !process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
  const sdk = process.platform === 'win32' ? path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk') : path.join(os.homedir(), 'Android', 'Sdk');
  if (fs.existsSync(sdk)) fs.writeFileSync(localProps, `sdk.dir=${sdk.replace(/\\/g, '\\\\')}\n`);
}

console.log(`✔ Projeto Android pronto (versão ${versao}, código ${versionCode})`);
