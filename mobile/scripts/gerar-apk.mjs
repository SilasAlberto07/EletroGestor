// Compila o APK com o Gradle e copia para mobile/apk/EletroGestor-<versão>.apk
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MOBILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANDROID = path.join(MOBILE, 'android');
const RAIZ = path.resolve(MOBILE, '..');
const versao = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')).version;

const assinado = fs.existsSync(path.join(MOBILE, 'assinatura', 'assinatura.properties')) || !!process.env.ELETRO_KEYSTORE;
if (!assinado) {
  console.warn(
    '\n⚠ Sem a pasta mobile/assinatura: vou gerar um APK de TESTE (debug).\n' +
      '  Ele instala normalmente, mas para atualizar depois sem perder os dados use sempre a mesma assinatura.\n'
  );
}

// O Gradle precisa do Java 21. No Windows, usa o Java que vem com o Android Studio se não houver outro.
const env = { ...process.env };
if (!env.JAVA_HOME && process.platform === 'win32') {
  const jbr = 'C:\\Program Files\\Android\\Android Studio\\jbr';
  if (fs.existsSync(jbr)) env.JAVA_HOME = jbr;
}

const tarefa = assinado ? 'assembleRelease' : 'assembleDebug';
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
console.log(`Compilando (${tarefa})... na primeira vez demora alguns minutos.`);
const r = spawnSync(gradlew, [tarefa, '--no-daemon'], { cwd: ANDROID, stdio: 'inherit', shell: process.platform === 'win32', env });
if (r.status !== 0) {
  console.error('\n✘ Erro ao compilar. Veja a mensagem acima (veja também mobile/COMO-GERAR-APK.md).');
  process.exit(r.status || 1);
}

const tipo = assinado ? 'release' : 'debug';
const pasta = path.join(ANDROID, 'app', 'build', 'outputs', 'apk', tipo);
const gerado = fs.readdirSync(pasta).find((f) => f.endsWith('.apk'));
const destino = path.join(MOBILE, 'apk', `EletroGestor-${versao}${assinado ? '' : '-teste'}.apk`);
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.copyFileSync(path.join(pasta, gerado), destino);
console.log(`\n✔ APK pronto: ${destino}`);
