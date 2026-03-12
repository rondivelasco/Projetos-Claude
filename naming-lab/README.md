# Naming Lab

Workspace estratégico de naming — diagnóstico, geração, análise e decisão em ambiente persistente.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** + **Tailwind CSS**
- **Prisma ORM** + **SQLite** (pronto para PostgreSQL)
- Naming Engine **algorítmico** (sem dependência de AI externa)

---

## Rodar localmente

### 1. Instalar dependências

```bash
cd naming-lab
npm install
```

### 2. Inicializar o banco de dados

```bash
npm run db:generate    # gera o Prisma Client
npm run db:push        # cria o SQLite com o schema
```

### 3. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

---

## Estrutura do workspace

Cada projeto abre em `/projects/[id]` com 8 abas:

| Aba | Função |
|---|---|
| **Contexto** | Dados do projeto — editáveis a qualquer momento |
| **Diagnóstico** | Análise automática N1–N5 com sintomas, causas e direção |
| **Gerador** | Gera candidatos com perfil sonoro configurável |
| **Candidatos** | Lista com scores, shortlist e adição manual |
| **Camadas** | Análise profunda por camada: Sonora, Semântica, Cultural, Funcional |
| **Comparação** | Tabela lado a lado de até 4 candidatos |
| **Decisão** | Registro do nome escolhido + justificativa estratégica |
| **Histórico** | Linha do tempo de rodadas de naming |

---

## Framework de naming implementado

### Estados N1–N5
- N1 — Não parece certo
- N2 — Não pertencem juntos
- N3 — Esquecível
- N4 — Envia sinais errados
- N5 — Não funciona na prática

### 4 Camadas de análise
1. **Sonora** — perfil de fonemas, ritmo, clareza, repetição
2. **Semântica** — tipo (descritivo/metafórico/abstrato/portmanteau), clareza, densidade simbólica
3. **Cultural** — associações, ambiguidade, risco cultural
4. **Funcional** — pronúncia, escrita, memorabilidade, teste do telefone, risco de typo

### Score engine
7 dimensões, nota 0–10 + justificativa textual + pontos fortes/fracos/riscos

---

## Migrar para PostgreSQL

No `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/naminglab"
```

No `prisma/schema.prisma`, trocar `provider = "sqlite"` por `provider = "postgresql"`.

Depois rodar `npm run db:push` ou `npx prisma migrate dev`.
