// Servidor estático usado pelos testes (Playwright sobe este arquivo antes de rodar).
// Lê o arquivo direto, sem checar antes com stat: checar e depois ler abre uma
// janela de corrida entre as duas chamadas (CodeQL js/file-system-race).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const RAIZ = path.resolve(process.cwd());
const PORTA = Number(process.env.PORT || 4180);
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.ico': 'image/x-icon',
};

async function ler(arquivo) {
  try {
    return { corpo: await readFile(arquivo), arquivo };
  } catch (e) {
    if (e.code !== 'EISDIR') throw e;
    const indice = path.join(arquivo, 'index.html');
    return { corpo: await readFile(indice), arquivo: indice };
  }
}

http.createServer(async (req, res) => {
  const caminho = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const pedido = path.join(RAIZ, caminho);
  if (pedido !== RAIZ && !pedido.startsWith(RAIZ + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const { corpo, arquivo } = await ler(pedido);
    res.writeHead(200, { 'content-type': TIPOS[path.extname(arquivo)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(corpo);
  } catch (e) {
    const naoExiste = e.code === 'ENOENT' || e.code === 'ENOTDIR';
    res.writeHead(naoExiste ? 404 : 500).end(naoExiste ? '404' : 'erro');
  }
}).listen(PORTA, () => console.log(`servindo ${RAIZ} em http://localhost:${PORTA}`));
