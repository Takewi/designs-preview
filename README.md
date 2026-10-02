# Design Previews Hub

Um projeto simples e direto para disponibilizar e visualizar previews de design HTML com suporte a modo tela cheia, simulação de dispositivos e deploy rápido no **Surge.sh**.

> ℹ️ **Sobre a tela de login:** A autenticação na página inicial está ali mais para compor a interface e "preencher espaço" do que por segurança real, já que qualquer pessoa com o link direto do arquivo HTML (ex: `/designs/nome-do-arquivo.html`) consegue acessar o preview diretamente sem passar pelo login.

---

## 🚀 Como Usar

### 1. Adicionar seus designs
Basta soltar qualquer arquivo `.html` dentro da pasta `designs/`:
```bash
designs/
├── dashboard-cliente.html
├── tela-mobile.html
└── landing-page.html
```

O script lê automaticamente o `<title>`, tags detectadas e tamanho do arquivo para montar o catálogo.

---

### 2. Rodar Localmente
Para visualizar os previews e testar no navegador:
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000). O servidor atualiza o catálogo automaticamente ao adicionar ou alterar arquivos em `designs/`.

---

### 3. Configurar (.env)
Copie o `.env.example` para `.env`:
```bash
cp .env.example .env
```

Defina sua senha e seu subdomínio do Surge:
```env
# Senha para a tela de login (opcional - deixe vazio se não quiser login)
PREVIEW_PASSWORD=sua-senha

# Subdomínio do Surge exclusivo deste projeto
SURGE_DOMAIN=meu-projeto-previews.surge.sh
```

---

### 4. Publicar no Surge.sh
Para compilar e colocar o site no ar:
```bash
npm run deploy
```

Ou publique diretamente em outro subdomínio sem alterar o `.env`:
```bash
npm run deploy -- outro-dominio.surge.sh
```

---

## 🖥️ O que tem na interface

- **Catálogo com busca:** Filtro instantâneo por nome do protótipo, arquivo ou tecnologia.
- **Visualizador responsivo:** Presets de resolução para **Desktop (100%)**, **Laptop (1440px)**, **Tablet (768px)** e **Mobile (390px)**.
- **Tela Cheia:** Botão dedicado e atalho `F` para expandir o design ocupando 100% do monitor (Fullscreen API).
- **Acesso direto:** Botão para abrir o arquivo HTML isolado em nova aba.
- **Links diretos:** Roteamento por hash (ex: `/#/view/meu-design`) para compartilhar um preview específico.

---

## 🛠️ Comandos

| Comando | O que faz |
| :--- | :--- |
| `npm run dev` | Inicia servidor local na porta 3000 com live-reload |
| `npm run build` | Varre `designs/` e compila os arquivos na pasta `dist/` |
| `npm run deploy` | Executa o build e publica no Surge.sh |
| `npm test` | Roda a suíte de testes unitários automatizados |
