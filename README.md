# Assistente de Nomenclatura IEC 81346-2

Ferramenta web para sugerir designações corretas segundo a norma IEC 81346-2, integrada com Google Gemini.

---

## Arquitetura

```
Browser (React + Vite)
    │
    └──▶ /api/chat  (Vercel Serverless Function — Node.js)
                │
                └──▶ Google Gemini API (chave segura no servidor)
```

A chave API **nunca** é exposta ao browser.

---

## Pré-requisitos

- Node.js 18+
- Conta Google (para obter chave Gemini)
- Conta GitHub
- Conta Vercel (gratuita)

---

## 1. Obter chave Gemini (gratuita)

1. Acede a https://aistudio.google.com/apikey
2. Clica em **"Create API key"**
3. Copia a chave gerada (começa com `AIza...`)

---

## 2. Desenvolvimento local

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edita .env e preenche GEMINI_API_KEY com a tua chave

# Instalar Vercel CLI (para simular as serverless functions localmente)
npm install -g vercel

# Correr em modo de desenvolvimento (frontend + backend)
vercel dev
```

A aplicação fica disponível em http://localhost:3000

---

## 3. Deploy no Vercel

### Opção A — Via interface web (mais simples)

1. Faz push do projeto para um repositório GitHub
2. Acede a https://vercel.com e clica em **"Add New Project"**
3. Importa o teu repositório GitHub
4. Em **"Environment Variables"**, adiciona:
   - `GEMINI_API_KEY` = a tua chave
   - `ALLOWED_ORIGIN` = o URL do teu projeto (ex: `https://iec81346.vercel.app`)
5. Clica em **"Deploy"**

### Opção B — Via CLI

```bash
vercel login
vercel --prod
# O Vercel vai pedir as variáveis de ambiente durante o processo
```

---

## 4. Configurar CORS em produção

Depois de fazer deploy e obteres o URL final (ex: `https://iec81346.vercel.app`),
atualiza a variável `ALLOWED_ORIGIN` nas configurações do Vercel para esse URL específico.

---

## Limites do plano gratuito Gemini

| Métrica | Limite gratuito |
|---------|----------------|
| Pedidos por dia | 1.500 |
| Pedidos por minuto | 15 |
| Tokens por minuto | 1.000.000 |

Para uso comercial com mais volume, o custo é aproximadamente €0,075 por 1M tokens de input.

---

## Estrutura do projeto

```
iec81346-saas/
├── api/
│   └── chat.js          # Serverless function (backend seguro)
├── src/
│   ├── main.jsx         # Ponto de entrada React
│   └── App.jsx          # Aplicação principal
├── index.html
├── vite.config.js
├── vercel.json
├── package.json
├── .env.example
└── .gitignore
```
