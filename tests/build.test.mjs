import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractMetadata, buildCatalog } from '../scripts/build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

test('extractMetadata extrai title e tags de HTML completo', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html class="dark">
    <head>
      <title>Painel Telemetria IoT</title>
      <meta name="description" content="Dashboard industrial moderno">
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body><h1>Test Dashboard</h1></body>
    </html>
  `;

  const meta = extractMetadata(sampleHtml, 'iot-test.html');
  assert.equal(meta.title, 'Painel Telemetria IoT');
  assert.equal(meta.description, 'Dashboard industrial moderno');
  assert.ok(meta.tags.includes('IoT'));
  assert.ok(meta.tags.includes('Tailwind'));
  assert.ok(meta.tags.includes('Charts'));
  assert.ok(meta.tags.includes('Dark'));
});

test('extractMetadata gera fallback de título a partir do filename quando não há title', () => {
  const sampleHtml = `<html><body>Sem title</body></html>`;
  const meta = extractMetadata(sampleHtml, 'painel-solar-sensores.html');
  assert.equal(meta.title, 'Painel Solar Sensores');
  assert.ok(meta.tags.includes('UI/UX'));
});

test('buildCatalog gera os arquivos esperados em dist/', () => {
  // Cria fixture de teste temporária
  const testDesignPath = path.join(rootDir, 'designs', '__test-fixture.html');
  fs.writeFileSync(testDesignPath, '<html><head><title>Fixture Test</title></head><body>Fixture</body></html>', 'utf8');

  try {
    const result = buildCatalog();

    assert.ok(Array.isArray(result.previews));
    assert.ok(result.previews.some(p => p.slug === '__test-fixture'));

    // Verifica dist/index.html
    const indexPath = path.join(distDir, 'index.html');
    assert.ok(fs.existsSync(indexPath), 'dist/index.html deve existir');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexContent.includes('Design Previews'), 'index.html deve conter título do portal');

    // Verifica dist/200.html
    assert.ok(fs.existsSync(path.join(distDir, '200.html')), 'dist/200.html deve existir para Surge SPA');

    // Verifica dist/previews.json
    const previewsJsonPath = path.join(distDir, 'previews.json');
    assert.ok(fs.existsSync(previewsJsonPath), 'dist/previews.json deve existir');
    const parsedJson = JSON.parse(fs.readFileSync(previewsJsonPath, 'utf8'));
    assert.equal(parsedJson.length, result.previews.length);

    // Verifica cópia em dist/designs/
    assert.ok(fs.existsSync(path.join(distDir, 'designs', '__test-fixture.html')));

    // Verifica CNAME
    assert.ok(fs.existsSync(path.join(distDir, 'CNAME')));

    // Verifica injeção de autenticação e tela de login
    assert.ok(/window\.__AUTH_HASH__\s*=\s*".*?"/.test(indexContent));
    assert.ok(indexContent.includes('id="login-screen"'), 'index.html deve conter a tela de login');
  } finally {
    if (fs.existsSync(testDesignPath)) {
      fs.unlinkSync(testDesignPath);
    }
  }
});
