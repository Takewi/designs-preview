import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const designsDir = path.join(rootDir, 'designs');
const distDir = path.join(rootDir, 'dist');
const templatePath = path.join(rootDir, 'template', 'portal-template.html');
const surgeConfigPath = path.join(rootDir, 'surge.json');

// Carrega variáveis de ambiente do .env
export function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let value = (match[2] || '').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[match[1]] = value;
      }
    }
  }
}

// Formata tamanho em bytes para KB/MB legível
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Formata data ISO para pt-BR
function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// Varre diretório recursivamente buscando arquivos .html
function scanHtmlFiles(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanHtmlFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({ fullPath, relPath, filename: entry.name });
    }
  }
  return results;
}

// Extrai metadados do HTML
export function extractMetadata(htmlContent, filename) {
  // Extrai <title>
  const titleMatch = htmlContent.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  let title = titleMatch ? titleMatch[1].trim() : '';
  if (!title) {
    // Fallback: transforma "infoklima-bmw-prototype.html" em "Infoklima Bmw Prototype"
    title = filename
      .replace(/\.html$/i, '')
      .split(/[-_]+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Extrai <meta name="description" content="...">
  const descMatch = htmlContent.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Detecta tags e frameworks usados
  const tags = [];
  const lower = htmlContent.toLowerCase();
  if (lower.includes('bmw')) tags.push('BMW');
  if (lower.includes('iot')) tags.push('IoT');
  if (lower.includes('tailwind')) tags.push('Tailwind');
  if (lower.includes('chart.js')) tags.push('Charts');
  if (lower.includes('xlsx') || lower.includes('sheetjs')) tags.push('SheetJS');
  if (lower.includes('class="dark"') || lower.includes("class='dark'")) tags.push('Dark');
  if (tags.length === 0) tags.push('UI/UX');

  return { title, description, tags };
}

// Copia diretório recursivamente
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

export function buildCatalog() {
  console.log('⚡ Iniciando escaneamento e compilação de designs...');

  if (!fs.existsSync(designsDir)) {
    fs.mkdirSync(designsDir, { recursive: true });
    console.log(`📁 Pasta ${designsDir} criada.`);
  }

  const htmlFiles = scanHtmlFiles(designsDir);
  console.log(`🔍 Encontrados ${htmlFiles.length} arquivo(s) HTML em designs/`);

  const now = new Date();
  const buildTimeFormatted = formatDate(now);

  const previews = [];

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const stats = fs.statSync(file.fullPath);
    const meta = extractMetadata(content, file.filename);

    const slug = file.relPath.replace(/\.html$/i, '').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();

    previews.push({
      id: slug,
      slug,
      title: meta.title,
      description: meta.description,
      filename: file.filename,
      relativePath: `designs/${file.relPath}`,
      url: `designs/${file.relPath}`,
      sizeBytes: stats.size,
      sizeFormatted: formatBytes(stats.size),
      modifiedAt: stats.mtime.toISOString(),
      modifiedFormatted: formatDate(stats.mtime),
      buildTimeFormatted,
      tags: meta.tags
    });
  }

  // Ordena por data de modificação recente
  previews.sort((a, b) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime());

  // Garante que dist existe
  fs.mkdirSync(distDir, { recursive: true });

  // Copia a pasta designs/ inteira para dist/designs/
  const distDesignsDir = path.join(distDir, 'designs');
  copyDirSync(designsDir, distDesignsDir);

  // Lê o template
  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template não encontrado em ${templatePath}`);
  }
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  // Carrega e processa autenticação via .env
  loadEnv();
  const rawPassword = (process.env.PREVIEW_PASSWORD || '').trim();
  const authHash = rawPassword
    ? crypto.createHash('sha256').update(rawPassword).digest('hex')
    : '';

  if (rawPassword) {
    console.log('🔒 Proteção por senha ativada (definida no .env)');
  } else {
    console.log('🔓 Modo aberto: sem senha configurada');
  }

  // Injeta dados no HTML
  let finalHtml = templateContent.replace(
    '/*PREVIEWS_DATA_PLACEHOLDER*/[]',
    JSON.stringify(previews, null, 2)
  );
  finalHtml = finalHtml.replace(
    '/*AUTH_HASH_PLACEHOLDER*/',
    authHash
  );

  // Escreve dist/index.html
  const indexPath = path.join(distDir, 'index.html');
  fs.writeFileSync(indexPath, finalHtml, 'utf8');

  // Escreve dist/200.html (para roteamento SPA limpo no Surge)
  const fallbackPath = path.join(distDir, '200.html');
  fs.writeFileSync(fallbackPath, finalHtml, 'utf8');

  // Escreve dist/previews.json
  const jsonPath = path.join(distDir, 'previews.json');
  fs.writeFileSync(jsonPath, JSON.stringify(previews, null, 2), 'utf8');

  // Configura CNAME se SURGE_DOMAIN (.env) ou surge.json tiver domain
  let domain = (process.env.SURGE_DOMAIN || '').trim();
  if (!domain && fs.existsSync(surgeConfigPath)) {
    try {
      const surgeConfig = JSON.parse(fs.readFileSync(surgeConfigPath, 'utf8'));
      if (surgeConfig.domain) {
        domain = surgeConfig.domain.trim();
      }
    } catch {
      // Ignora erro
    }
  }

  const cnamePath = path.join(distDir, 'CNAME');
  if (domain) {
    fs.writeFileSync(cnamePath, domain, 'utf8');
  } else if (fs.existsSync(cnamePath)) {
    fs.unlinkSync(cnamePath);
  }

  console.log(`\n✅ Build concluído com sucesso em: ${distDir}`);
  console.log(`📄 index.html gerado com ${previews.length} protótipo(s) indexado(s):`);
  for (const p of previews) {
    console.log(`   • [${p.slug}] "${p.title}" (${p.sizeFormatted}) -> ${p.url}`);
  }

  return { previews, distDir };
}

// Executa direto se chamado via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildCatalog();
}
