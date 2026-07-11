# Trilhas Inova 3 — Sistema de Gestão para Candidatos

> Sistema web não-oficial de organização pessoal para candidatos e bolsistas do **Programa Trilhas Inova 3** (SECTI/FAPEMA - Maranhão). Não substitui o site oficial [inova.ma.gov.br](https://inova.ma.gov.br).

## ✨ Funcionalidades

- **Multi-perfil por conta** (até 15 perfis, com PIN opcional por perfil)
- **Central de Documentos** — upload dos 7 documentos do edital, geração de PDF unificado
- **Escolha de Trilha** — 8 trilhas + trilha complementar (dados reais do edital)
- **Frequência Semanal** — grade de 12 semanas com alerta de risco de cancelamento de bolsa
- **Módulos e Desafios** — checklist de conclusão com conteúdo real da matriz curricular
- **Dashboard individual** — contagem regressiva dos prazos oficiais do edital
- **Painel do Titular** — visão aggregada dos perfis do grupo

## 🚀 Como rodar localmente

### Pré-requisitos
- **Node.js 22 ou superior** (o projeto usa o módulo `node:sqlite` embutido, sem dependências nativas)
- npm 9+

### 1. Backend (API)

```bash
cd server
npm install
npm run dev
```

O servidor inicia em `http://localhost:3001`. O banco de dados SQLite e os seeds são criados automaticamente na primeira execução.

### 2. Frontend (React)

```bash
cd client
npm install
npm run dev
```

O cliente inicia em `http://localhost:5173`. As chamadas de API são automaticamente proxiadas para o backend.

### Rodar em janelas separadas

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

---

## 🔧 Configuração

### Duração do programa (`PROGRAMA_DURACAO_SEMANAS`)

O edital oficial define **26 semanas**. O MVP usa **12 semanas** por padrão. Para ajustar:

```bash
# server/.env
PROGRAMA_DURACAO_SEMANAS=26
```

### Reset do banco de dados

```bash
cd server
npm run seed
```

Este comando **apaga e recria** todo o banco, reaplicando os seeds.

---

## 📁 Estrutura de Pastas

```
trilhas-inova3/
├── server/                # Backend Node.js + Express
│   ├── src/
│   │   ├── db/            # Schema SQL, seeds, módulo do banco
│   │   ├── middleware/    # Auth JWT, upload multer
│   │   ├── routes/        # auth, perfis, documentos, trilhas, frequencia, modulos, desafios, dashboard
│   │   └── utils/         # pdfMerge.js (pdf-lib)
│   ├── uploads/           # Arquivos enviados (por conta_id/perfil_id/codigo)
│   ├── .env               # Configuração local
│   └── package.json
├── client/                # Frontend React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── api/           # Chamadas axios para o backend
│   │   ├── components/    # AppLayout, CountdownWidget
│   │   ├── contexts/      # AuthContext, PerfilContext
│   │   └── pages/         # Login, Cadastro, SeletorPerfis, Dashboard, Documentos, Trilha, Frequencia, ModulosDesafios, DashboardTitular
│   └── package.json
└── README.md
```

---

## 🔒 Segurança e Isolamento de Dados

- Todo acesso a dados de um perfil valida que `perfil.conta_id === conta autenticada no token`
- Arquivos são servidos via rota autenticada (`/api/perfis/:id/documentos/:codigo/download`) — nunca expostos diretamente
- Senhas e PINs hasheados com `bcryptjs` (nunca em texto puro)
- Rate limiting nas rotas de login (10 tentativas / 15 min)

### Teste de isolamento (403 cross-perfil)

```bash
# 1. Login como Conta A, obter token
TOKEN_A="..."
PERFIL_B_ID=42  # ID de um perfil de outra conta

# 2. Tentar acessar documentos do perfil B com o token de A → deve retornar 403
curl -H "Authorization: Bearer $TOKEN_A" \
  http://localhost:3001/api/perfis/$PERFIL_B_ID/documentos

# Resposta esperada:
# {"error":{"code":"FORBIDDEN","message":"Acesso negado a este perfil."}}
```

---

## 📅 Prazos Oficiais do Edital

| Evento | Data |
|---|---|
| Prazo para inscrições | 16/07/2026 às 14h |
| Desafio de Seleção | 24/07/2026, 8h–18h |
| Lista Final de Aprovados | a partir de 30/07/2026 |
| Início da contratação | a partir de 05/08/2026 |
| Onboarding na plataforma | a partir de 11/08/2026 |
| Encerramento do programa | dezembro/2026 |

---

## 📚 Trilhas do Edital

| Trilha | Vagas | Carga |
|---|---|---|
| Programação Front-end | 210 | 300h |
| Programação Back-end | 210 | 300h |
| Ciência de Dados | 210 | 300h |
| Design e Experiência UX/UI | 180 | 300h |
| Desenvolvimento Mobile | 120 | 300h |
| Social Media Marketing | 120 | 300h |
| Programação de Jogos | 90 | 300h |
| Automações com IA | 60 | 300h |
| Empreendedorismo e Inovação (complementar) | 1200 | 100h |

---

## 🛠️ Stack Técnica

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22+ |
| API | Express.js |
| Banco | SQLite via `node:sqlite` (built-in, sem compilação) |
| Auth | JWT (bcryptjs) |
| Upload | Multer 2.x |
| PDF | pdf-lib |
| Frontend | React 18 + Vite 5 |
| Estilo | Tailwind CSS 3 (paleta Onda Digital) |
| Estado | TanStack Query v5 |
| Rotas | React Router v6 |
