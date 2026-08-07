# TB Aviation — Gestão de Tarefas, Vencimentos e Manutenção

Aplicativo web para a TB Aviation (assessoria aeronáutica) unificar, por aeronave, o que hoje está espalhado em quadros
separados: **tarefas**, **controle de vencimentos** e **controle de manutenção**. Interface no estilo quadro/cartão
(inspirada em Trello), com quadro Kanban de arrastar-e-soltar, mas com um modelo de dados próprio para o negócio.

## Stack

- **Next.js 16** (App Router, Server Actions, Turbopack) + **TypeScript**
- **Tailwind CSS v4**
- **Prisma 7** + **PostgreSQL** (via driver adapter `@prisma/adapter-pg`)
- Autenticação própria com **JWT em cookie httpOnly** (`jose`) + senhas com `bcryptjs`
- **dnd-kit** para o quadro Kanban de tarefas
- `lucide-react` para ícones

## Como rodar localmente

Requer um Postgres acessível (local, Docker, ou um banco na nuvem — veja a seção de deploy abaixo).

```bash
npm install                 # gera o Prisma Client via postinstall
cp .env.example .env        # defina DATABASE_URL e um SESSION_SECRET
npx prisma migrate dev      # cria as tabelas no Postgres configurado
npx prisma db seed          # popula com equipe, aeronaves e dados de exemplo
npm run dev
```

Acesse `http://localhost:3000`.

### Login de exemplo (criados pelo seed)

No campo de usuário você pode digitar o e-mail completo ou só a parte antes do `@` (ex: `ltavares` em vez de
`ltavares@tbaviation.com.br`).

| Perfil | Usuário | Senha |
|---|---|---|
| Admin | `ltavares` | `1234` |
| Equipe interna (acesso completo) | `rafa`, `thomas`, `rafael`, `matheus`, `caio`, `gabi`, `henriquets.2628@gmail.com` | `tbaviation123` |
| Cliente / proprietário (leitura, restrito a uma aeronave) | `cliente@exemplo.com` | `cliente123` |

Troque essas senhas (ou desative os usuários de exemplo, especialmente o admin com senha `1234`) antes de usar em produção.

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

## Deploy (Vercel)

1. Provisione um Postgres — pela aba **Storage** do projeto na Vercel (integração Neon/Postgres) ou qualquer outro
   provedor (Neon, Supabase, RDS etc.).
2. Configure a variável de ambiente `DATABASE_URL` no projeto Vercel com a connection string desse banco, e
   `SESSION_SECRET` com uma string aleatória longa.
3. Faça o deploy. O build já roda `prisma migrate deploy` automaticamente (script `build` do `package.json`), então
   as tabelas são criadas/atualizadas sozinhas a cada deploy — não precisa rodar nada manualmente.
4. Para popular com os dados de exemplo (equipe, aeronaves, tarefas), rode uma vez, apontando para o Postgres da
   Vercel:
   ```bash
   DATABASE_URL="<connection string>" npx prisma db seed
   ```
   O seed usa `upsert` para usuários e aeronaves (seguro rodar de novo), mas cria tarefas/vencimentos/manutenções
   sempre novos — não rode mais de uma vez em produção, ou os dados de exemplo vão duplicar.

## Notas para produção

- **Anexos**: arquivos enviados em tarefas são salvos em `public/uploads`. Em hospedagem serverless isso não
  persiste entre deploys/instâncias; para produção, troque por um serviço de armazenamento de objetos (S3, Vercel
  Blob etc.).
- **`SESSION_SECRET`**: gere uma string aleatória longa e mantenha em segredo — é usada para assinar os cookies de
  sessão (JWT).
- Troque ou desative os usuários de exemplo (principalmente o admin com senha `1234`) antes de expor a aplicação
  publicamente.
