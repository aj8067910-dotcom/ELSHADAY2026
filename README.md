# ✨ GRUPO ELSHADAY

**Plataforma de discipulado, comunhão e engajamento gamificado.**

Uma mistura de Duolingo (streaks), Notion (conteúdo), Discord (comunidade), Habitica (missões), Strava (desafios) e Pokémon GO (eventos e conquistas) — a serviço da vida devocional, da oração, da comunhão e do serviço.

> O objetivo **não** é premiar quem "é mais espiritual", mas incentivar **constância, comunhão e serviço**. Sem competição tóxica — sempre crescimento pessoal.

---

## 🧭 Visão geral

| Camada | Stack |
| --- | --- |
| **Backend** | Node.js · TypeScript · NestJS · Prisma · PostgreSQL · Redis · JWT + Refresh · RBAC · Swagger · Rate limit |
| **Frontend** | Next.js (App Router) · React · TypeScript · TailwindCSS · Framer Motion · TanStack Query · React Hook Form · Zod |
| **Infra** | Docker · Docker Compose · GitHub Actions (CI) · PWA-ready |
| **Arquitetura** | Monorepo (npm workspaces) · Módulos de domínio (DDD-lite) · **Multi-tenant** (pronta para SaaS multi-igrejas) |

### Multi-tenant (SaaS)

Toda entidade de conteúdo pertence a uma `Church` (tenant). Cada igreja pode ter seu próprio slug, identidade visual (`primaryColor`, logo), líderes, equipes e conteúdo — compartilhando a mesma base tecnológica. O cadastro aceita `churchSlug` para direcionar o usuário ao tenant correto.

---

## 🚀 Rodando localmente

### Com Docker (recomendado)

```bash
docker compose up --build
```

- Web: http://localhost:3000
- API: http://localhost:3001/api
- Swagger: http://localhost:3001/docs

### Manual (dev)

```bash
# 1. Suba Postgres e Redis
docker compose up -d postgres redis

# 2. API
cd apps/api
cp .env.example .env
npm install
npx prisma migrate dev      # cria as tabelas
npm run prisma:seed         # popula badges, missões, usuários demo
npm run start:dev           # http://localhost:3001

# 3. Web (em outro terminal)
cd apps/web
npm install
npm run dev                 # http://localhost:3000
```

### ☁️ Deploy no Render

O repositório inclui um blueprint [`render.yaml`](render.yaml) que provisiona tudo (PostgreSQL + API + Web):

1. No dashboard do Render: **New → Blueprint** e selecione este repositório.
2. **Importante:** em *Branch*, selecione a branch que contém o código (a `main` só terá o código após o merge).
3. O Render cria os 3 recursos; a API migra o banco e roda as seeds automaticamente no primeiro start.
4. Se o serviço da API for criado com um nome diferente de `elshaday-api`, ajuste a variável `API_URL` do serviço web para a URL pública correta da API.

> ⚠️ Erro comum: *"Exited with status 1 while building your code"* logo no primeiro deploy geralmente significa que o Render está buildando uma branch **sem o código** (ex.: `main` apenas com README) ou sem o `render.yaml`. Confira a branch nas configurações do serviço.

### Logins de demonstração (seeds)

| Papel | E-mail | Senha |
| --- | --- | --- |
| Admin | `admin@elshaday.app` | `elshaday123` |
| Pastor | `pastor@elshaday.app` | `elshaday123` |
| Líder | `lider@elshaday.app` | `elshaday123` |
| Membro | `membro@elshaday.app` | `elshaday123` |

---

## 🎮 Sistema de gamificação

### XP por ação

| Ação | XP |
| --- | --- |
| Devocional | +20 |
| Oração / pedido | +15 |
| Culto (check-in) | +50 |
| Evento | +80 |
| Retiro | +150 |
| Evangelismo | +120 |
| Serviço | +70 |
| Círculo de oração | +40 |
| Testemunho | +25 |

### Níveis

Nível 1 **Discípulo** → 5 **Servo** → 10 **Obreiro** → 20 **Cooperador** → 30 **Líder** → 40 **Influenciador** → 50 **Embaixador**. Curva: `100 × nível^1.6`.

### Streak 🔥

Sequência diária de atividade espiritual (devocional, missão, círculo, check-in). Só é perdida após **48h** sem atividade. Marcos (5, 10, 30, 100, 365 dias) viram badges automáticas.

### Árvore de crescimento espiritual 🌱

Cada ação alimenta uma área: 📖 Palavra · 🙏 Oração · ❤️ Serviço · 🤝 Comunhão · 🌍 Evangelismo · 🎵 Adoração. O perfil mostra o **Radar de Constância** — que acompanha *hábitos*, nunca "mede fé".

### Badges, missões, desafios e temporadas

- **Missões diárias** (devocional, orar 15 min, ler 1 capítulo, convidar alguém...) — completar todas do dia = 🎁 celebração especial.
- **Desafios da semana** (ex.: *Semana da Gratidão*) com missões temáticas.
- **Temporadas trimestrais** (ex.: *Firmados na Rocha*) com badge exclusiva.
- **Ranking saudável** — filtros por equipe/mês/ano, sempre com linguagem de incentivo.

---

## 📦 Funcionalidades implementadas

- ✅ Autenticação (registro, login, JWT + refresh token com rotação, logout)
- ✅ RBAC hierárquico (Admin → Pastor → Líder → Vice → Membro → Visitante)
- ✅ Devocional diário (líder publica; membro conclui, anota, favorita) + streak + XP
- ✅ Pedidos de oração (público / só liderança / privado), "Orar agora" com contagem ("12 pessoas oraram por você"), oração respondida + testemunho, pedidos **ao vivo** durante o culto
- ✅ Círculos de oração com presença e XP
- ✅ Eventos (culto, retiro, congresso, evangelismo...) com confirmação de presença e **check-in por QR Code** (+XP +badge)
- ✅ Missões diárias e desafio da semana com confetes 🎉
- ✅ XP, níveis, badges, árvore de crescimento, radar de constância
- ✅ Ranking saudável (equipe / mês / ano)
- ✅ Equipes com XP coletivo
- ✅ Mural (feed) com publicações, reações e comentários
- ✅ Notificações in-app (badges, level-up, intercessões)
- ✅ Aniversariantes do dia na Home 🎂
- ✅ Dashboard admin (usuários ativos, devocionais, check-ins, streaks) + relatório CSV
- ✅ PWA manifest + tema dark premium (preto/grafite/dourado, glassmorphism, microinterações)

## 🗺️ Roadmap (fundações prontas no schema)

- 🔜 Chat (equipe, liderança, evento, oração)
- 🔜 Caixa de bênçãos (recompensas cosméticas: molduras, fundos, emojis)
- 🔜 Sistema de duplas espirituais com lembretes ("Ore hoje pelo João")
- 🔜 Diário com IA (encorajamento + passagens; apoio, nunca substitui aconselhamento pastoral)
- 🔜 Escalas de ministérios (schema pronto: `Schedule`/`ScheduleSlot`)
- 🔜 Biblioteca, podcast e vídeos (schema pronto: `LibraryItem`)
- 🔜 Mapa de missões, retiro (página especial), calendário visual
- 🔜 Login Google/Apple, push notifications, e-mail, upload S3
- 🔜 Exportação Excel/PDF dos relatórios

## 🏗️ Estrutura

```
apps/
├── api/                  # NestJS
│   ├── prisma/           # schema (multi-tenant), migrações, seeds
│   └── src/
│       ├── common/       # guards (JWT, RBAC), decorators
│       └── modules/      # auth, users, devotionals, prayer, events,
│                         # missions, gamification, teams, feed,
│                         # notifications, admin
└── web/                  # Next.js
    └── src/
        ├── app/(auth)/   # login, cadastro
        ├── app/(app)/    # home, devocional, missões, oração,
        │                 # eventos, mural, ranking, perfil
        ├── components/   # UI de vidro, XP animado, confetes, nav
        └── lib/          # cliente HTTP c/ refresh, tipos
```

## 🔒 Segurança & LGPD

- Senhas com bcrypt; tokens JWT curtos + refresh com hash armazenado e rotação
- Rate limiting global e mais rígido em login/registro
- Validação e sanitização de entrada (`class-validator` + `whitelist`)
- Visibilidade granular de pedidos de oração (dado sensível)
- Dados pessoais mínimos e exportáveis (relatórios CSV)

## 🧪 Testes

```bash
cd apps/api && npm test
```

---

Feito com 💛 para fortalecer comunhão, esperança, alegria, pertencimento, família e propósito.
