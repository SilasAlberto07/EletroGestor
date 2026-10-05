// Monta a pasta "www" do app Android a partir das MESMAS telas do computador.
//  1. copia src/renderer (telas, estilos, imagens)
//  2. junta as migrations do banco num arquivo só
//  3. empacota a "ponte" do celular (mobile/src/api.js + regras de src/main) em js/celular.js
//  4. ajusta o index.html para o celular
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MOBILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAIZ = path.resolve(MOBILE, '..');
const WWW = path.join(MOBILE, 'www');
const SRC_MAIN = path.join(RAIZ, 'src', 'main');

const versao = JSON.parse(fs.readFileSync(path.join(RAIZ, 'package.json'), 'utf8')).version;

// 1. Telas
fs.rmSync(WWW, { recursive: true, force: true });
fs.cpSync(path.join(RAIZ, 'src', 'renderer'), WWW, { recursive: true });

// 2. Migrations (os dados de exemplo NÃO vão para o celular)
const pastaMigrations = path.join(SRC_MAIN, 'database', 'migrations');
const migrations = fs
  .readdirSync(pastaMigrations)
  .filter((f) => f.endsWith('.sql'))
  .sort()
  .map((nome) => ({ nome, sql: fs.readFileSync(path.join(pastaMigrations, nome), 'utf8') }));
fs.writeFileSync(
  path.join(MOBILE, 'src', 'migrations.gerado.js'),
  `// Arquivo gerado automaticamente por scripts/montar-web.mjs. Não edite.\nexport const MIGRATIONS = ${JSON.stringify(migrations, null, 2)};\n`
);

// 3. Ponte do celular. Os arquivos de src/main pedem "electron", "fs", a conexão
//    do banco etc.; aqui eles recebem as versões do celular.
const shims = path.join(MOBILE, 'src', 'shims');
const trocas = {
  plugin: {
    name: 'trocas-celular',
    setup(b) {
      b.onResolve({ filter: /^(electron|fs|path|os)$/ }, (a) => ({ path: path.join(shims, `${a.path}.js`) }));
      b.onResolve({ filter: /database\/connection(\.js)?$/ }, () => ({ path: path.join(MOBILE, 'src', 'connection.js') }));
      b.onResolve({ filter: /^\.\.\/ipc$/ }, () => ({ path: path.join(MOBILE, 'src', 'ipc.js') }));
    },
  },
};

await build({
  entryPoints: [path.join(MOBILE, 'src', 'api.js')],
  outfile: path.join(WWW, 'js', 'celular.js'),
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['chrome89'],
  minify: true,
  sourcemap: false,
  loader: { '.html': 'text' },
  define: { __VERSAO__: JSON.stringify(versao), __dirname: '"/"' },
  plugins: [trocas.plugin],
  nodePaths: [path.join(MOBILE, 'node_modules')],
  external: ['node:*'], // o sql.js só usa isso quando roda no Node, nunca no celular
  logLevel: 'warning',
});

fs.copyFileSync(path.join(MOBILE, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'), path.join(WWW, 'sql-wasm.wasm'));
fs.copyFileSync(path.join(MOBILE, 'src', 'celular.css'), path.join(WWW, 'css', 'celular.css'));

// 4. index.html do celular
const indice = path.join(WWW, 'index.html');
let html = fs.readFileSync(indice, 'utf8');
html = html
  // A proteção de conteúdo do computador bloquearia o banco (WebAssembly) e a ponte do Android
  .replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/s, '')
  .replace(
    '<meta charset="UTF-8">',
    '<meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n  <meta name="theme-color" content="#1f2d3d">'
  )
  .replace('<link rel="stylesheet" href="css/componentes.css">', '<link rel="stylesheet" href="css/componentes.css">\n  <link rel="stylesheet" href="css/celular.css">')
  // O celular.js cria o window.api antes das telas começarem
  .replace('<script type="module" src="js/app.js"></script>', '<script src="js/celular.js"></script>\n  <script type="module" src="js/app.js"></script>');

for (const esperado of ['css/celular.css', 'js/celular.js', 'viewport']) {
  if (!html.includes(esperado)) throw new Error(`index.html mudou e não foi possível incluir ${esperado}. Ajuste scripts/montar-web.mjs.`);
}
fs.writeFileSync(indice, html);

console.log(`✔ www montado (versão ${versao})`);
