# TB Aviation — Gestão de Tarefas, Vencimentos e Manutenção

Aplicativo web para a TB Aviation (assessoria aeronáutica) unificar, por aeronave, o que hoje está espalhado em quadros
separados: **tarefas**, **controle de vencimentos** e **controle de manutenção**. Interface no estilo quadro/cartão
(inspirada em Trello), com quadro Kanban de arrastar-e-soltar, mas com um modelo de dados próprio para o negócio.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **SQLite** (via driver adapter `@prisma/adapter-better-sqlite3`) — banco em arquivo, sem dependências externas
- Autenticação própria com **JWT em cookie httpOnly** (`jose`) + senhas com `bcryptjs`
- **dnd-kit** para o quadro Kanban de tarefas
- `lucide-react` para ícones

Não há serviços externos obrigatórios: o projeto roda localmente com `npm install && npm run dev`.

## Como rodar localmente

```bash
npm install
cp .env.example .env        # ajuste SESSION_SECRET em produção
npx prisma migrate dev      # cria o banco SQLite e as tabelas
npx prisma db seed          # popula com equipe, aeronaves e dados de exemplo
npm run dev
```

Acesse `http://localhost:3000`.

### Login de exemplo (criados pelo seed)

| Perfil | E-mail | Senha |
|---|---|---|
| Equipe interna (acesso completo) | `rafa@tbaviation.com.br`, `thomas@tbaviation.com.br`, `rafael@tbaviation.com.br`, `matheus@tbaviation.com.br`, `henriquets.2628@gmail.com`, `caio@tbaviation.com.br`, `gabi@tbaviation.com.br`, `luishenrique@tbaviation.com.br` | `tbaviation123` |
| Cliente / proprietário (leitura, restrito a uma aeronave) | `cliente@exemplo.com` | `cliente123` |

Troque essas senhas (ou desative os usuários de exemplo) antes de usar em produção.

## Modelo de dados

A **Aeronave** (matrícula + modelo) é a entidade central. Cada aeronave tem três módulos:

- **Tarefas** — quadro Kanban (*A fazer / Em andamento / Finalizado*) com responsável, prazos, checklist de
  subtarefas, comentários e anexos. Existe também uma visão global "por responsável" em `/tasks`.
- **Vencimentos** — itens com data de validade (CVA, seguros, laudos PBN/RVSM, INFOSAR/ELT, FISTEL, bote
  salva-vidas, kit de primeiros socorros, conjunto de sobrevivência etc.), categorizados como *porte obrigatório* ou
  *equipamento*, com status calculado (em dia / vencendo em breve ≤30 dias / vencido). Cada item já guarda
  `notifyDaysBefore` e existe uma tabela `NotificationLog` — a estrutura está pronta para o envio de e-mails de aviso
  automático numa fase futura, ainda não implementado.
- **Manutenção** — eventos programados (com período) ou não programados (discrepâncias/panes), com escopo,
  checklist de serviços com progresso e histórico de manutenções concluídas.

Todas as alterações relevantes (criação, mudança de status, comentários, anexos) geram um registro em `AuditLog`,
exibido no histórico de cada tarefa — auditoria básica pedida no escopo.

## Perfis e permissões

- **Equipe interna** (`INTERNAL`): acesso completo a todas as aeronaves e módulos, além da tela **Equipe & Acessos**
  para cadastrar usuários e conceder acesso de clientes.
- **Cliente/proprietário** (`CLIENT`): enxerga apenas as aeronaves liberadas para ele (tabela `AircraftAccess`), por
  padrão somente leitura; é possível conceder edição por aeronave individualmente.

## Estrutura do projeto

```
prisma/schema.prisma        modelo de dados
prisma/seed.ts               dados de exemplo (equipe, aeronaves, tarefas, vencimentos, manutenções)
src/lib/                     auth, permissões, prisma client, auditoria, formatação de status
src/app/actions/             Server Actions (mutações: aeronaves, tarefas, vencimentos, manutenção, usuários, busca)
src/app/(app)/                páginas autenticadas (painel, aeronaves, tarefas, equipe)
src/app/login/                tela de login
src/components/               componentes de UI (quadro Kanban, modais, tabelas, busca global)
public/logo-horizontal.png, logo-stacked.png, tb-icon.png   logo oficial da TB Aviation usada na interface
```

## Notas para produção

- **Banco de dados**: o projeto usa SQLite em arquivo por simplicidade. Para hospedagem serverless (ex.: Vercel),
  troque para Postgres (ver `.agents/skills/prisma-upgrade-v7` no repo para o guia de driver adapters do Prisma 7) —
  disco local não é persistente nesses ambientes.
- **Anexos**: arquivos enviados em tarefas são salvos em `public/uploads`. Em hospedagem serverless isso não
  persiste entre deploys/instâncias; para produção, troque por um serviço de armazenamento de objetos (S3, Vercel
  Blob etc.).
- **`SESSION_SECRET`**: gere uma string aleatória longa e mantenha em segredo — é usada para assinar os cookies de
  sessão (JWT).
