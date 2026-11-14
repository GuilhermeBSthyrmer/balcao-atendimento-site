// Servidor estático usado pelos testes (Playwright sobe este arquivo antes de rodar).
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const RAIZ = path.resolve(process.cwd());
const PORTA = Number(process.env.PORT || 4180);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};

http.createServer(async (req, res) => {
  try {
    const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let arquivo = path.join(RAIZ, caminho);
    if (!arquivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
    let s = await stat(arquivo).catch(() => null);
    if (s && s.isDirectory()) { arquivo = path.join(arquivo, 'index.html'); s = await stat(arquivo).catch(() => null); }
    if (!s) { res.writeHead(404).end('404'); return; }
    res.writeHead(200, { 'content-type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(await readFile(arquivo));
  } catch (e) {
    res.writeHead(500).end(String(e));
  }
}).listen(PORTA, () => console.log(`servindo ${RAIZ} em http://localhost:${PORTA}`));
