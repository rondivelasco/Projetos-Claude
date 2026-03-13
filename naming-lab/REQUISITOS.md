# Naming Lab — Documento de Requisitos

**Versão:** 1.0
**Data:** 2026-03-13
**Projeto:** Naming Lab — Workspace Estratégico de Naming

---

## 1. Visão Geral do Produto

O **Naming Lab** é uma aplicação web para diagnóstico e pesquisa estratégica de naming. Permite que consultores de branding, product managers e fundadores conduzam processos estruturados de criação, análise e decisão de nomes — integrando geração por IA (OpenAI), análise multidimensional automatizada e registro histórico completo de cada projeto.

---

## 2. Regras de Negócio

### 2.1 Projetos

**RN-01** — Um projeto é a unidade central do sistema. Todo trabalho de naming ocorre dentro de um projeto.

**RN-02** — Um projeto deve ter obrigatoriamente: `nome` (texto livre) e `tipo` (um dos 7 tipos definidos). Todos os outros campos são opcionais, mas quanto mais contexto fornecido, melhor a qualidade da geração por IA.

**RN-03** — Os tipos válidos de projeto são:
- `brand` — Naming de marca
- `product` — Naming de produto
- `saas` — Aplicativo / SaaS
- `character` — Personagem
- `place` — Lugar / Espaço físico
- `title` — Título editorial
- `product-line` — Linha de produtos

**RN-04** — Um projeto pode ser marcado como favorito. Favoritos são exibidos com destaque no dashboard.

**RN-05** — A exclusão de um projeto remove em cascata todos os seus diagnósticos, rodadas, candidatos e decisão associados.

**RN-06** — O idioma padrão de um projeto é `pt-BR`. Outros suportados: `en`, `es`, `multilingual`.

---

### 2.2 Diagnóstico de Naming

**RN-07** — O diagnóstico analisa o contexto do projeto e classifica os problemas de naming em até 5 estados não exclusivos (múltiplos estados podem coexistir no mesmo projeto):

| Estado | Nome | Descrição |
|--------|------|-----------|
| N1 | Não parece certo | O nome existe mas gera desconforto intuitivo |
| N2 | Não pertencem juntos | Nome e produto/marca parecem desconectados |
| N3 | Esquecível | O nome não fixa na memória |
| N4 | Envia sinais errados | O nome comunica atributos indesejados |
| N5 | Não funciona na prática | O nome falha em uso real (pronúncia, escrita, etc.) |

**RN-08** — Cada diagnóstico registra: estados detectados, sintomas, causas prováveis, impacto estratégico e direção recomendada.

**RN-09** — Um projeto pode ter múltiplos diagnósticos ao longo do tempo. O mais recente é sempre exibido como padrão. O histórico completo é preservado.

**RN-10** — O diagnóstico é gerado por engine local (regras determinísticas baseadas no contexto do projeto), não por IA externa.

---

### 2.3 Geração de Candidatos

**RN-11** — A geração pode ocorrer por dois modos:

**Modo IA (padrão):** Utiliza OpenAI para gerar 30 candidatos organizados em 10 categorias estratégicas (3 nomes por categoria):

| # | Categoria | Critério |
|---|-----------|----------|
| 1 | descritivo | Descreve diretamente o produto/serviço |
| 2 | evocativo | Evoca emoção ou conceito ligado à marca |
| 3 | composto | Portmanteau ou fusão criativa de palavras |
| 4 | institucional | Tom corporativo, formal e confiável |
| 5 | premium | Transmite exclusividade ou sofisticação |
| 6 | tecnológico | Sonoridade moderna e tech-forward |
| 7 | humano | Próximo, acessível, com carga emocional positiva |
| 8 | curto | Máximo 5 letras, impactante e memorável |
| 9 | inventado | Brandable: palavra inventada com identidade sonora |
| 10 | abstrato | Sem significado literal, só sonoridade estratégica |

**Modo Local:** Engine de regras baseada em raízes, sufixos e templates fonéticos. Gera 8 candidatos filtrados por perfil (tech, premium, humano, clínico, ousado, sofisticado, simples, memorável).

**RN-12** — O Modo IA tenta modelos em cascata na seguinte ordem: `gpt-4.1-mini` → `gpt-4o` → `gpt-3.5-turbo`. Se todos falharem, o sistema faz fallback automático para o Modo Local e registra o motivo da falha.

**RN-13** — Cada geração cria uma **Rodada** numerada sequencialmente dentro do projeto. A rodada registra o label (modelo usado ou "Local"), os filtros aplicados e todos os candidatos gerados.

**RN-14** — O prompt enviado à IA inclui o contexto completo do projeto (contexto livre, personalidade, categoria, mercado, restrições, referências) e a lista de nomes já gerados anteriormente para evitar repetições.

**RN-15** — Nomes genéricos são proibidos pela instrução ao modelo: Smart, Easy, Pro, Plus, Best, Top, Super, Mega.

**RN-16** — Candidatos gerados por IA têm metadados armazenados em `notes` (JSON): `source`, `llmCategory` e `llmReasoning` (justificativa do modelo para aquele nome).

---

### 2.4 Análise Automática de Candidatos

**RN-17** — Todo candidato pode ser analisado pelo engine de naming, que produz 4 camadas independentes:

**Camada Sonora (`SoundLayer`):**
- Perfil fonético: profundidade (a, o, u, m, n), leveza (i, e, l, s), impacto (k, c, t, p, x), fluidez (l, r, w), tech (x, z + padrões ix/ex)
- Tom dominante: `premium | tech | human | clinical | bold | mixed`
- Ritmo: `monosyllabic | balanced | flowing | complex`
- Contagem de sílabas
- Detecção de repetição sonora
- Clareza fonética (0–10)

**Camada de Significado (`MeaningLayer`):**
- Tipo semântico: `descriptive | metaphorical | abstract | portmanteau`
- Clareza semântica (0–10)
- Densidade simbólica (0–10)
- Sugestão de posicionamento

**Camada Cultural (`CulturalLayer`):**
- Detecção de padrões negativos em PT-BR
- Detecção de palavras genéricas ou clichês tech
- Nível de ambiguidade: `low | medium | high`
- Risco cultural: `low | medium | high`
- Associações culturais detectadas

**Camada Funcional (`FunctionalLayer`):**
- Pronúncia (0–10)
- Facilidade de escrita — writability (0–10)
- Memorabilidade (0–10)
- Teste do telefone — phoneTest (boolean): se o nome pode ser entendido claramente ao ser dito em voz alta
- Risco de erro de digitação — typoRisk (0–10, onde 10 = alto risco)
- Legibilidade (0–10)

**RN-18** — Após as 4 camadas, o engine calcula um **Score** composto com 7 dimensões (escala 0–10):

| Dimensão | Peso | Base de cálculo |
|----------|------|-----------------|
| Fit Sonoro | 15% | clarityScore × 0.4 + perfil fonético |
| Clareza Semântica | 15% | clarity × 0.7 + symbolicDensity × 0.3 |
| Fit Cultural | 15% | Base 8 com penalidades por risco (médio: −1.5, alto: −3) |
| Funcionalidade | 20% | Média ponderada das métricas funcionais |
| Memorabilidade | 20% | memorability × 0.6 + clareza sonora + bônus por tamanho curto |
| Diferenciação | 10% | Base por tipo semântico (abstract=9, portmanteau=7, metaphorical=6, descriptive=4) |
| Potencial de Marca | 5% | Média das 6 dimensões anteriores |

**Nota Total:** média ponderada das 7 dimensões, arredondada para 1 casa decimal, limitada a [0, 10].

**RN-19** — O Score inclui justificativa textual automática classificando o nome em 4 faixas: forte (≥8), bom (≥6), funcional (≥4), problemático (<4).

**RN-20** — Candidatos gerados no Modo IA têm análise executada automaticamente na criação. Candidatos adicionados manualmente precisam de ação explícita do usuário ("Avaliar").

---

### 2.5 Gestão de Candidatos

**RN-21** — Um candidato pode ser adicionado manualmente (sem rodada associada) ou gerado automaticamente por um dos dois modos.

**RN-22** — Um candidato pode ter três estados não exclusivos: ativo (padrão), shortlist (`isShortlisted = true`), descartado (`isDiscarded = true`).

**RN-23** — Candidatos descartados permanecem visíveis com opacidade reduzida — não são excluídos permanentemente para preservar histórico.

**RN-24** — A listagem de candidatos é ordenada decrescentemente pela nota total. Candidatos sem avaliação são exibidos ao final.

**RN-25** — A exclusão de um candidato é permanente e irreversível (requer confirmação explícita do usuário).

---

### 2.6 Comparação de Candidatos

**RN-26** — O usuário pode selecionar entre 2 e 4 candidatos avaliados para comparação lado a lado em todas as 7 dimensões do Score.

**RN-27** — Em cada linha da comparação, o maior valor entre os candidatos é destacado em verde. Candidatos sem avaliação não aparecem na seleção de comparação.

---

### 2.7 Decisão Final

**RN-28** — Cada projeto tem no máximo uma decisão registrada. Ela pode ser atualizada a qualquer momento.

**RN-29** — A decisão registra: nome escolhido (texto livre ou selecionado do shortlist), justificativa estratégica, lista de nomes do shortlist no momento da decisão, e referência opcional ao candidato de origem.

**RN-30** — O nome escolhido pode ser qualquer texto — não precisa existir na lista de candidatos do sistema.

---

## 3. Requisitos Funcionais

### 3.1 Dashboard

**RF-01** — Listar todos os projetos ordenados por data de atualização (mais recente primeiro).

**RF-02** — Exibir para cada projeto: nome, tipo, idioma, data de criação, contagem de candidatos e diagnósticos.

**RF-03** — Permitir busca de projetos por nome (filtro em tempo real, client-side).

**RF-04** — Exibir projetos favoritos com destaque visual.

**RF-05** — Navegar para criação de novo projeto.

**RF-06** — Navegar para o workspace de um projeto existente ao clicar no card.

---

### 3.2 Criação de Projeto

**RF-07** — Formulário com todos os campos: nome*, tipo*, contexto, público-alvo, mercado, idioma, categoria, personalidade (texto livre + tags predefinidas), referências, restrições.

**RF-08** — Seleção de tipo por grid visual de botões (não dropdown).

**RF-09** — Seleção de atributos de personalidade por tags clicáveis (multisseleção) combinada com campo de texto livre.

**RF-10** — Após criação bem-sucedida, redirecionar automaticamente para o workspace do projeto criado.

---

### 3.3 Workspace do Projeto

**RF-11** — Interface em abas com 8 seções numeradas acessíveis a qualquer momento:
1. Contexto — visualização e edição dos metadados do projeto
2. Diagnóstico — execução e exibição de diagnósticos
3. Gerador — geração de candidatos via IA ou motor local
4. Candidatos — gestão completa dos candidatos
5. Camadas — análise detalhada por candidato selecionado
6. Comparação — tabela comparativa multi-candidato
7. Decisão — registro da escolha final
8. Histórico — registro de todas as rodadas de geração

**RF-12** — Header fixo com: botão de retorno ao dashboard, logo mark, nome do projeto, contadores (total de candidatos e shortlist), botão de favorito.

**RF-13** — Tabs exibem número ordinal (01–08) e nome da seção.

---

### 3.4 Aba Contexto

**RF-14** — Exibir todos os campos do projeto em modo visualização (grid de cards).

**RF-15** — Botão "Editar" alterna para modo de edição inline (sem navegação de página).

**RF-16** — Salvar alterações via PUT `/api/projects/{id}`. Cancelar restaura o estado original.

---

### 3.5 Aba Diagnóstico

**RF-17** — Exibir o diagnóstico mais recente do projeto (estados, sintomas, causas, impacto, direção).

**RF-18** — Botão "Rodar diagnóstico" executa nova análise via POST `/api/projects/{id}/diagnose`.

**RF-19** — Estado vazio exibido quando não há diagnósticos ainda.

**RF-20** — Indicar quantos diagnósticos existem no histórico quando há mais de um.

---

### 3.6 Aba Gerador

**RF-21** — Toggle visual entre Modo IA e Modo Local.

**RF-22** — No Modo Local: exibir filtros de perfil de nome (8 opções).

**RF-23** — No Modo IA: exibir preview do contexto que será enviado ao modelo (contexto, personalidade, categoria, mercado, nomes a evitar).

**RF-24** — Botão de geração com estados de loading diferenciados por modo.

**RF-25** — Após geração com sucesso: exibir label da rodada + badge do modelo usado (em verde) ou badge "fallback local" (em âmbar).

**RF-26** — Se fallback ocorrer, exibir banner âmbar com o motivo da falha.

**RF-27** — Exibir grid de candidatos gerados com: nome, nota total, badge de categoria LLM, 3 scores principais (sonora, semântica, memorabilidade), raciocínio do modelo em destaque tipográfico.

---

### 3.7 Aba Candidatos

**RF-28** — Campo de adição manual com Enter como atalho de teclado.

**RF-29** — Lista ordenada por nota (maior primeiro), candidatos sem nota ao final.

**RF-30** — Para cada candidato: nome, badges de status (shortlist), nota total com cor semântica, mini-grid de 4 scores (Som, Sem, Cult, Func).

**RF-31** — Botão "Avaliar" disponível apenas para candidatos sem score.

**RF-32** — Botão de shortlist com estado visual diferenciado (estrela preenchida vs. vazia).

**RF-33** — Botão de exclusão com confirmação via dialog nativo.

---

### 3.8 Aba Camadas

**RF-34** — Dropdown para selecionar candidato. Default: primeiro da lista.

**RF-35** — Exibir 4 cards de camadas: Sonora, Significado, Cultural, Funcional.

**RF-36** — Camadas não geradas são omitidas. Se nenhuma camada existir, exibir estado vazio com instrução.

---

### 3.9 Aba Comparação

**RF-37** — Lista de candidatos avaliados como botões de seleção múltipla (máx. 4).

**RF-38** — Tabela comparativa aparece apenas quando 2 ou mais candidatos estão selecionados.

**RF-39** — Maior valor por linha destacado com cor primária.

---

### 3.10 Aba Decisão

**RF-40** — Exibir shortlist atual como botões clicáveis que preenchem automaticamente o campo "nome escolhido".

**RF-41** — Campos de nome escolhido e justificativa com validação: botão desabilitado se nome estiver vazio.

**RF-42** — Após salvar, exibir card de confirmação com nome, justificativa e timestamp da última atualização.

---

### 3.11 Aba Histórico

**RF-43** — Listar todas as rodadas em ordem cronológica reversa.

**RF-44** — Para cada rodada: label (modelo ou "Local"), data, contagem de nomes, chips com nome + nota de cada candidato.

**RF-45** — Estado vazio exibido quando não há rodadas.

---

### 3.12 API REST

**RF-46** — Endpoints disponíveis:

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/projects` | Listar projetos |
| POST | `/api/projects` | Criar projeto |
| GET | `/api/projects/{id}` | Obter projeto |
| PUT | `/api/projects/{id}` | Atualizar projeto |
| DELETE | `/api/projects/{id}` | Excluir projeto |
| POST | `/api/projects/{id}/diagnose` | Rodar diagnóstico |
| GET | `/api/projects/{id}/diagnose` | Histórico de diagnósticos |
| GET | `/api/projects/{id}/candidates` | Listar candidatos |
| POST | `/api/projects/{id}/candidates` | Adicionar candidato manual |
| POST | `/api/projects/{id}/generate` | Gerar candidatos (modo local) |
| GET | `/api/projects/{id}/decision` | Obter decisão |
| PUT | `/api/projects/{id}/decision` | Registrar/atualizar decisão |
| GET | `/api/projects/{id}/rounds` | Histórico de rodadas |
| POST | `/api/generate-names` | Gerar candidatos (modo IA) |
| PATCH | `/api/candidates/{id}` | Atualizar status do candidato |
| DELETE | `/api/candidates/{id}` | Excluir candidato |
| POST | `/api/candidates/{id}/evaluate` | Rodar análise do candidato |

---

## 4. Requisitos Não Funcionais

### 4.1 Tecnologia e Arquitetura

**RNF-01** — Stack obrigatória: Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM.

**RNF-02** — Banco de dados: SQLite em desenvolvimento (arquivo local `dev.db`). Arquitetura compatível com migração para PostgreSQL sem alterações no código de aplicação (apenas `datasource.provider` no schema Prisma).

**RNF-03** — Integração com OpenAI via SDK oficial (`openai` v4+). A chave de API é lida exclusivamente de variável de ambiente (`OPENAI_API_KEY`) — nunca hardcoded.

**RNF-04** — Toda a aplicação roda como um único processo Next.js (frontend + API Routes no mesmo servidor). Não há backend separado.

**RNF-05** — O cliente Prisma é instanciado como singleton para evitar múltiplas conexões em ambiente de desenvolvimento com hot-reload.

---

### 4.2 Resiliência e Disponibilidade

**RNF-06** — A geração de nomes nunca deve retornar erro 500 por falha da API OpenAI. O sistema deve degradar graciosamente para o motor local e informar o usuário.

**RNF-07** — O fallback automático (IA → Local) deve ser transparente na UX: o usuário vê o resultado com indicação clara de qual modo foi usado e o motivo do fallback.

**RNF-08** — A cascata de modelos (`gpt-4.1-mini → gpt-4o → gpt-3.5-turbo`) garante disponibilidade mesmo quando modelos específicos não estejam acessíveis na conta OpenAI.

**RNF-09** — Todos os erros de API devem ser capturados e retornados com mensagens descritivas em português para o usuário final.

---

### 4.3 Performance

**RNF-10** — O header do workspace deve ser `sticky` (fixo no topo durante scroll) para garantir navegação entre abas sem rolagem.

**RNF-11** — Dados do projeto e candidatos são carregados em paralelo (`Promise.all`) na inicialização do workspace para reduzir tempo de carregamento.

**RNF-12** — A filtragem de projetos no dashboard é client-side (sem nova requisição ao servidor) para resposta imediata.

**RNF-13** — A chamada à API OpenAI usa `max_tokens: 4000` e `temperature: 0.92` como parâmetros fixos. Não há timeout explícito configurado além do padrão do SDK.

---

### 4.4 Segurança

**RNF-14** — A chave da API OpenAI nunca é exposta ao cliente. Toda chamada ao OpenAI ocorre exclusivamente no servidor (API Route Next.js).

**RNF-15** — Variáveis de ambiente sensíveis (`OPENAI_API_KEY`, `DATABASE_URL`) são gerenciadas exclusivamente via arquivo `.env` não versionado.

**RNF-16** — O arquivo `.env` não deve ser commitado ao repositório Git (deve constar no `.gitignore`).

**RNF-17** — Não há autenticação de usuários na versão atual — o sistema é single-user/local.

---

### 4.5 Design System e Interface

**RNF-18** — Paleta de cores obrigatória:

| Token | Hex | Uso |
|-------|-----|-----|
| Linen | `#F4F0E8` | Background principal |
| Forest Green | `#2A5231` | Cor primária, botões, tab ativa |
| Oak | `#BEA882` | Acento, favorito, detalhe tipográfico |
| Charcoal | `#383834` | Texto principal |
| White | `#FFFFFF` | Superfície de cards e header |

**RNF-19** — Tipografia: Plus Jakarta Sans (via `next/font/google`), pesos 400–800. Variável CSS: `--font-jakarta`.

**RNF-20** — Todos os componentes de UI devem usar as classes utilitárias globais definidas em `globals.css`: `.surface`, `.label`, `.input`, `.btn-primary`, `.btn-ghost`, `.score-bar`, `.score-fill`, `.section-label`.

**RNF-21** — O design deve suportar modo escuro via classes Tailwind `dark:`. O dark mode usa paleta quente: fundo `#12110E`, superfície `#1C1A16`, detalhes `#272420`.

**RNF-22** — Scores numéricos devem usar `tabular-nums` (fonte monoespaçada) para alinhamento visual.

**RNF-23** — Feedback de cor nos scores segue a regra semântica: verde (≥7), âmbar (≥5), vermelho (<5). Aplicado consistentemente em toda a interface.

---

### 4.6 Dados e Persistência

**RNF-24** — IDs são gerados com `cuid()` (Prisma default) — não UUID v4.

**RNF-25** — Exclusões de entidades pai (Project, Candidate) propagam em cascata para todas as entidades filhas (`onDelete: Cascade` no schema Prisma).

**RNF-26** — Campos que armazenam arrays ou objetos JSON o fazem como `String` no banco (SQLite não tem tipo JSON nativo). O parse/stringify é responsabilidade da camada de aplicação.

**RNF-27** — Metadados LLM (`llmCategory`, `llmReasoning`, `source`) são armazenados no campo `notes` do Candidate como JSON serializado. O frontend usa função `parseJson()` para leitura segura com fallback.

**RNF-28** — Timestamps `createdAt` e `updatedAt` são gerenciados automaticamente pelo Prisma (`@default(now())` e `@updatedAt`).

---

### 4.7 Extensibilidade

**RNF-29** — O engine de análise (sound, meaning, cultural, functional, scorer) é modular: cada camada está em arquivo separado em `src/lib/naming-engine/`. Novas camadas podem ser adicionadas sem alterar as existentes.

**RNF-30** — A função `generateNamesWithLLM()` aceita a lista `MODEL_CASCADE` como constante editável. Novos modelos OpenAI podem ser adicionados na cascata sem alteração de lógica.

**RNF-31** — O schema Prisma usa `provider = "sqlite"` mas é compatível com PostgreSQL. A migração exige apenas alteração do `datasource.provider` e `DATABASE_URL`.

---

## 5. Dependências e Configuração

### 5.1 Variáveis de Ambiente Obrigatórias

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=sk-proj-...
```

### 5.2 Principais Dependências

| Pacote | Versão | Função |
|--------|--------|--------|
| `next` | 14.x | Framework React full-stack |
| `typescript` | 5.x | Tipagem estática |
| `tailwindcss` | 3.x | Utility-first CSS |
| `prisma` | 5.x | ORM + migrations |
| `@prisma/client` | 5.x | Cliente de banco de dados |
| `openai` | ^4.47.1 | SDK oficial OpenAI |

### 5.3 Scripts de Execução

```bash
# Instalar dependências
npm install

# Criar banco de dados e aplicar schema
npx prisma migrate dev --name init
npx prisma generate

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build && npm start
```

---

## 6. Limitações Conhecidas e Escopo Fora do Produto

- **Sem autenticação:** sistema single-user, sem controle de acesso por usuário ou organização.
- **Sem compartilhamento:** projetos não podem ser compartilhados entre usuários.
- **Sem exportação:** não há exportação de relatórios (PDF, CSV) na versão atual.
- **Sem verificação de disponibilidade:** o sistema não verifica se o nome está disponível como domínio, marca registrada ou handle em redes sociais.
- **Análise cultural limitada ao PT-BR:** a camada cultural detecta padrões problemáticos principalmente para o mercado brasileiro.
- **Motor local determinístico:** o gerador local não usa aleatoriedade semântica avançada — os nomes seguem templates fonéticos predefinidos.
