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

  // Permite passar domínio via linha de comando: npm run deploy -- meu-dominio.surge.sh
  const cliDomain = process.argv.slice(2).find(arg => !arg.startsWith('-'));
  let domain = cliDomain || surgeConfig.domain;

  if (!domain) {
    // Sugere nome padrão
    const defaultDomain = 'ui-previews.surge.sh';
    console.log(`\nNenhum domínio configurado em surge.json.`);
    const input = await prompt(`Qual domínio deseja usar no Surge? [Padrão: ${defaultDomain}]: `);
    domain = input || defaultDomain;

    // Garante sufixo .surge.sh caso o usuário tenha digitado apenas o nome
    if (!domain.includes('.')) {
      domain = `${domain}.surge.sh`;
    }

    surgeConfig.domain = domain;
    fs.writeFileSync(configPath, JSON.stringify(surgeConfig, null, 2), 'utf8');
    console.log(`💾 Domínio salvo em surge.json: ${domain}\n`);

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
