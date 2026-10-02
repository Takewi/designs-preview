import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCatalog } from './build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const designsDir = path.join(rootDir, 'designs');
const templateDir = path.join(rootDir, 'template');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Executa build inicial
buildCatalog();

// Cria servidor HTTP nativo
const server = http.createServer((req, res) => {
  // Trata URL e remove query strings ou hashes
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(reqUrl.pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  const filePath = path.join(distDir, pathname);

  // Proteção contra path traversal
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Acesso Negado');
    return;
  }

  // Verifica se arquivo existe
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Fallback para index.html (SPA routing)
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Não Encontrado');
    }
  }
});

const DEFAULT_PORT = 3000;

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n🌐 Servidor de testes rodando em:`);
    console.log(`   ➜ Local:   http://localhost:${port}/`);
    console.log(`   ➜ designs: http://localhost:${port}/designs/`);
    console.log(`\n👀 Observando alterações em 'designs/' e 'template/'...`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  Porta ${port} ocupada, tentando ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Erro no servidor:', err);
    }
  });
}

// Watcher com debounce para reconstrução automática
let buildTimeout = null;
function handleFileChange(event, filename) {
  if (!filename) return;
  if (buildTimeout) clearTimeout(buildTimeout);
  buildTimeout = setTimeout(() => {
    console.log(`\n🔄 Alteração detectada em [${filename}]. Reconstruindo catálogo...`);
    try {
      buildCatalog();
      console.log('✨ Catálogo atualizado com sucesso!');
    } catch (err) {
      console.error('❌ Erro ao reconstruir:', err);
    }
  }, 250);
}

// Inicia observadores de pasta se existirem
if (fs.existsSync(designsDir)) {
  fs.watch(designsDir, { recursive: true }, handleFileChange);
}
if (fs.existsSync(templateDir)) {
  fs.watch(templateDir, { recursive: true }, handleFileChange);
}

startServer(DEFAULT_PORT);
