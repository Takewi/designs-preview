# Design Previews Hub & Surge.sh Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma solução automatizada para escanear protótipos/designs HTML na pasta `designs/` (ou adicionados no projeto), gerar um portal de entrada (`index.html`) moderno e responsivo com modo tela cheia e simulação de dispositivos, e permitir deploy simplificado com 1 comando no Surge.sh.

**Architecture:** 
1. Script gerador em Node.js nativo (sem dependências pesadas externas) que varre `designs/*.html`, extrai metadados (`<title>`, descrição, tags detectadas, data de modificação, tamanho) e gera uma pasta pronta para deploy `dist/`.
2. Portal de Entrada (`dist/index.html`) estilo showcase/galeria com busca instantânea, contadores e modal/viewer interativo em tela cheia (usando Fullscreen API nativa + iframe responsivo com presets para Desktop, Laptop, Tablet e Mobile, além de deep-linking via Hash URL).
3. Script e atalhos de deploy para o Surge (`npm run deploy`), com persistência de domínio configurável (`surge.json`) e servidor de teste local (`npm run dev`).

**Tech Stack:** Node.js (v24 nativo, ESM), Vanilla HTML5/CSS3/JavaScript moderno, Surge CLI (`npx surge`).

**Spec:** Arquivos em `designs/`, comandos de deploy via Surge e visualizador fullscreen.

## Global Constraints
- Zero runtime overhead ou dependências pesadas de terceiros para o script de build (usar Node.js nativo `fs`, `path`, `http`).
- Preservar integridade total dos arquivos em `designs/` (leitura e cópia apenas).
- O visualizador deve permitir acesso aos protótipos tanto de forma isolada (direto na aba) quanto em modo imersivo (com Fullscreen API nativo).
- Suportar execução offline e compatibilidade total com o modelo de hospedagem estática do Surge.sh.

## Review Focus
- Protótipos com estilos ou scripts complexos (Tailwind CDN, Chart.js) devem renderizar perfeitamente no iframe sem interferência de CSS do portal.
- Arquivos com espaços ou caracteres especiais nos nomes devem gerar URLs válidas e links funcionais.
- A barra de ferramentas do viewer deve poder ser recolhida ou oculta para não cobrir partes do design em tela cheia.
- Se nenhum domínio estiver configurado ou o Surge pedir login, mensagens e instruções devem ser claras.
- Responsividade do próprio portal em dispositivos móveis e desktops.

---

### Task 1: Estrutura Base e Configurações (`package.json`, `surge.json`)

**Files:**
- Create: `package.json`
- Create: `surge.json`
- Create: `.gitignore`

**Interfaces:**
- Consumes: Configuração do Surge e scripts npm.
- Produces: Scripts `npm run build`, `npm run dev`, `npm run deploy`.

- [ ] **Passo 1: Criar `package.json` com scripts de automação**
- [ ] **Passo 2: Criar `surge.json` com domínio padrão e pasta dist**
- [ ] **Passo 3: Criar `.gitignore` para ignorar `dist/` e `node_modules/`**
- [ ] **Passo 4: Validar sintaxe dos arquivos JSON**

---

### Task 2: Script de Varredura e Compilação (`scripts/build.mjs`)

**Files:**
- Create: `scripts/build.mjs`

**Interfaces:**
- Consumes: Arquivos em `designs/*.html` e template em `template/portal-template.html`.
- Produces: `dist/index.html`, `dist/200.html`, `dist/previews.json`, e cópias em `dist/designs/`.

- [ ] **Passo 1: Implementar função de scanner recursivo de arquivos `.html` em `designs/`**
- [ ] **Passo 2: Implementar extrator de `<title>`, meta tags, tamanho de arquivo e data**
- [ ] **Passo 3: Implementar gerador de manifesto `previews.json` e injeção de dados no template**
- [ ] **Passo 4: Implementar cópia de assets e geração de `dist/200.html` (para Surge SPA routing)**
- [ ] **Passo 5: Testar execução do script com `node scripts/build.mjs`**

---

### Task 3: Template do Portal Showcase e Viewer Fullscreen (`template/portal-template.html`)

**Files:**
- Create: `template/portal-template.html`

**Interfaces:**
- Consumes: Dados injetados de `previews.json` gerados pelo build.
- Produces: Portal de entrada visual com catálogo de designs e viewer em tela cheia.

- [ ] **Passo 1: Construir cabeçalho moderno com busca em tempo real, contador e tema**
- [ ] **Passo 2: Construir grid de cards responsivo para os designs encontrados**
- [ ] **Passo 3: Construir modal/viewer fullscreen com iframe e seletor de resolução (Desktop, Laptop, Tablet, Mobile)**
- [ ] **Passo 4: Implementar botão de Tela Cheia Nativo (Fullscreen API) e atalhos de teclado (`Esc`, `F`)**
- [ ] **Passo 5: Implementar deep-linking via Hash URL (`/#/view/<nome-do-arquivo>`) para links compartilháveis**

---

### Task 4: Servidor Local de Desenvolvimento e Deploy (`scripts/dev-server.mjs`, `scripts/deploy.mjs`)

**Files:**
- Create: `scripts/dev-server.mjs`
- Create: `scripts/deploy.mjs`

**Interfaces:**
- Consumes: `dist/` gerado e configuração de `surge.json`.
- Produces: Servidor local com live-watcher e comando interativo de deploy via Surge.

- [ ] **Passo 1: Implementar servidor HTTP local nativo em `scripts/dev-server.mjs`**
- [ ] **Passo 2: Adicionar watcher em `designs/` para re-compilar automaticamente quando um novo HTML for salvo**
- [ ] **Passo 3: Implementar script `scripts/deploy.mjs` que valida autenticação do Surge e publica `dist/`**
- [ ] **Passo 4: Testar fluxo completo localmente**
