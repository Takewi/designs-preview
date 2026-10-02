import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';
import { buildCatalog } from './build.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const configPath = path.join(rootDir, 'surge.json');

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🚀 Iniciando processo de deploy no Surge.sh...\n');

  // 1. Executa o build para atualizar o dist/
  const { previews } = buildCatalog();

  if (previews.length === 0) {
    console.log('\n⚠️  Atenção: Nenhum arquivo .html foi encontrado na pasta designs/.');
    console.log('Você pode soltar seus arquivos HTML em designs/ e rodar o deploy novamente.\n');
  }

  // 2. Determina o domínio do Surge
  let surgeConfig = { domain: '', project: './dist' };
  if (fs.existsSync(configPath)) {
    try {
      surgeConfig = { ...surgeConfig, ...JSON.parse(fs.readFileSync(configPath, 'utf8')) };
    } catch {
      // Ignora erro
    }
  }

  // Prioridade de domínio:
  // 1. Linha de comando (ex: npm run deploy -- meu-site.surge.sh)
  // 2. Variável SURGE_DOMAIN no .env
  // 3. surge.json (fallback legado)
  const cliDomain = process.argv.slice(2).find(arg => !arg.startsWith('-'));
  let domain = cliDomain || (process.env.SURGE_DOMAIN || '').trim() || surgeConfig.domain;

  if (!domain) {
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const defaultDomain = `previews-${randomSuffix}.surge.sh`;
    console.log(`\nNenhum domínio configurado no .env ou via comando.`);
    const input = await prompt(`Qual subdomínio deseja usar no Surge? [Padrão: ${defaultDomain}]: `);
    domain = input || defaultDomain;

    // Garante sufixo .surge.sh caso o usuário tenha digitado apenas o nome
    if (!domain.includes('.')) {
      domain = `${domain}.surge.sh`;
    }

    // Salva no .env local (que é ignorado pelo git)
    const envPath = path.join(rootDir, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('SURGE_DOMAIN=')) {
      envContent = envContent.replace(/SURGE_DOMAIN=.*$/m, `SURGE_DOMAIN=${domain}`);
    } else {
      envContent += `\n# Domínio do Surge para deploy\nSURGE_DOMAIN=${domain}\n`;
    }
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`💾 Domínio salvo no seu .env local: ${domain}\n`);

    // Atualiza CNAME no dist
    fs.writeFileSync(path.join(distDir, 'CNAME'), domain, 'utf8');
  }

  console.log(`\n📦 Publicando pasta [./dist] no domínio: https://${domain}\n`);

  // 3. Executa npx surge
  const surgeProcess = spawn('npx', ['--yes', 'surge', './dist', '--domain', domain], {
    cwd: rootDir,
    stdio: 'inherit',
    env: process.env
  });

  surgeProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n🎉 Deploy concluído com sucesso!');
      console.log(`🌐 Link do Showcase Hub: https://${domain}`);
      if (previews.length > 0) {
        console.log(`🔗 Exemplo de acesso direto: https://${domain}/#/view/${previews[0].slug}`);
      }
      console.log('\n💡 Dica: Para atualizar o site sempre que adicionar novos HTMLs, basta rodar:');
      console.log('   npm run deploy\n');
    } else {
      console.error(`\n❌ O processo do Surge encerrou com código ${code}.`);
      console.log('Se for um erro de login, rode: npx surge login');
    }
  });

  surgeProcess.on('error', (err) => {
    console.error('❌ Falha ao disparar o comando do Surge:', err);
  });
}

main().catch(console.error);
