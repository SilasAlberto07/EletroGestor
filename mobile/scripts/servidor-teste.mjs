// Abre a versão do celular no navegador do computador, para testar sem gerar o APK.
// Use: npm run testar   → depois abra http://localhost:5173 (aperte F12 e escolha a visão de celular)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WWW = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'www');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.wasm': 'application/wasm', '.json': 'application/json' };
const PORTA = Number(process.env.PORTA) || 5173;

http
  .createServer((req, res) => {
    const caminho = decodeURIComponent(req.url.split('?')[0]);
    let arquivo = path.join(WWW, caminho === '/' ? 'index.html' : caminho);
    if (!arquivo.startsWith(WWW) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
    fs.createReadStream(arquivo).pipe(res);
  })
  .listen(PORTA, () => console.log(`Versão do celular em http://localhost:${PORTA}  (Ctrl+C para parar)`));
