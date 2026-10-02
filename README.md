# Design Previews Hub & Deploy Surge.sh

Sistema agnóstico e automatizado para disponibilizar e visualizar quaisquer protótipos de design HTML com suporte a modo tela cheia, seleção de viewport (Desktop, Laptop, Tablet, Mobile) e deploy em um comando via **Surge.sh**.

---

## 🚀 Como Usar no Dia a Dia

### 1. Adicionar um novo design
Basta soltar qualquer arquivo `.html` dentro da pasta `designs/`:
```bash
designs/
├── infoklima-prototype.html
├── infoklima-bmw-prototype.html
└── seu-novo-prototipo.html
```

O sistema extrai automaticamente o `<title>`, descrição, tags e tamanho do arquivo.

---

### 2. Testar Localmente
Para visualizar o catálogo e testar seus designs localmente:
```bash
npm run dev
```
- Acesse em seu navegador: [http://localhost:3000](http://localhost:3000)
- O servidor possui **Live Watcher**: qualquer arquivo adicionado ou alterado em `designs/` atualiza o catálogo automaticamente.

---

### 3. Configurar Variáveis de Ambiente (.env)
Copie o `.env.example` para `.env` (que é ignorado pelo Git):
```bash
cp .env.example .env
```

Configure suas preferências no `.env`:
```env
# Senha de proteção compartilhada (opcional - deixe em branco para acesso livre)
PREVIEW_PASSWORD=sua-senha-aqui

# Domínio personalizado do Surge para deploy
SURGE_DOMAIN=meu-projeto-previews.surge.sh
```
- **Proteção por senha:** A senha é convertida em hash **SHA-256** no build e bloqueia a tela até o login.
- **Domínio isolado:** Como o domínio fica no `.env`, cada clone do repositório pode ter seu próprio subdomínio independente sem conflitos.

---

### 4. Publicar no Surge.sh
Para publicar ou atualizar o site público com todos os designs:
```bash
npm run deploy
```

> **Primeira execução:** Se você ainda não estiver logado no Surge, ele pedirá seu email e senha interativamente no terminal.
> O domínio será lido diretamente do seu `.env` (`SURGE_DOMAIN`).

Para publicar em um domínio específico sem alterar o `.env`:
```bash
npm run deploy -- outro-subdominio.surge.sh
```

---

## 🖥️ Funcionalidades do Hub & Viewer

- **Busca em Tempo Real:** Filtre instantaneamente por nome do protótipo, arquivo ou tag (ex: `BMW`, `IoT`, `Tailwind`).
- **Modo Tela Cheia (Fullscreen API):** Pressione o botão **Tela Cheia** ou a tecla `F` no visualizador para que o design ocupe 100% do seu monitor sem barras do navegador.
- **Emulador de Dispositivos:** Alterne entre os modos **100% Full**, **Laptop (1440px)**, **Tablet (768px)** e **Mobile (390px)** para testar a responsividade do protótipo.
- **Acesso Direto / Isolado:** Cada card possui o botão **"Direto"** para abrir o arquivo HTML original em uma aba dedicada sem nenhuma interferência.
- **Deep-linking (Links Compartilháveis):** Cada protótipo gera um link direto compartilhável via hash (ex: `https://seu-dominio.surge.sh/#/view/infoklima-bmw-prototype`), permitindo enviar links para clientes ou time que já abrem diretamente na tela do design.
- **Barra de Ferramentas Retrátil:** A barra superior do viewer pode ser recolhida para não cobrir nenhum elemento da interface em teste.

---

## 🛠️ Comandos Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia servidor HTTP local na porta 3000 com auto-rebuild |
| `npm run build` | Varre `designs/`, extrai metadados e compila a pasta `dist/` |
| `npm run deploy` | Compila os designs e publica no Surge.sh |
| `npm test` | Executa a suíte de testes unitários automatizados |
