# Prompt de recriação do sistema — Cantinho da Meimei (Escala)

> **Para que serve este arquivo:** se o repositório, o projeto Supabase ou o
> projeto Vercel forem perdidos (conta excluída, corrupção, etc.), copie todo
> o conteúdo abaixo e cole como prompt inicial para um agente de codificação
> (Claude Code ou similar), apontando para um repositório novo e vazio. Ele
> descreve o sistema com detalhe suficiente para reconstruí-lo do zero, sem
> depender de nenhum outro documento — mas leia também `docs/schema.sql` (o
> agente deve aplicá-lo ao banco novo) e `docs/SETUP_AMBIENTES.md` (passos de
> infraestrutura que não são código).

---

## Prompt (copie a partir daqui)

Quero que você construa um sistema web chamado **"Cantinho da Meimei —
Escala de Apresentações"**, para uma casa espírita (centro espírita) no
Brasil organizar a escala de voluntários que abrem e apresentam as reuniões,
além de materiais de apoio e registro de eventos.

### Stack técnica (obrigatória, não sugira alternativas)

- **Next.js 16** (App Router, Server Components e Server Actions). Nesta
  versão o middleware não se chama `middleware.ts` na raiz — é
  `src/proxy.ts`, exportando uma função `proxy(request)` (não `middleware`).
  Confira a documentação em `node_modules/next/dist/docs/` antes de escrever
  código de middleware/proxy, roteamento ou qualquer API que possa ter
  mudado — não confie no que você "lembra" de versões antigas do Next.
- **React 19**, **TypeScript**.
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme inline` em
  `globals.css`, não `tailwind.config.js` com cores em JS).
- **Supabase**: Postgres + Auth + Storage. Cliente via `@supabase/ssr`
  (`createBrowserClient` no client, `createServerClient` no server/proxy,
  mais um `createServiceClient` com a service role key para operações
  administrativas em Server Actions/rotas de API).
- **react-hook-form** + **zod** (`@hookform/resolvers/zod`) para todos os
  formulários. Prefira `useWatch` a `watch()` (mais amigável ao React
  Compiler).
- **lucide-react** para ícones.
- **@fullcalendar/react** + `daygrid` + `interaction` para o calendário
  mensal, locale `pt-br`.
- **date-fns** disponível, mas a maior parte da formatação de data é feita
  manualmente com helpers simples (ver abaixo) porque o padrão do projeto é
  sempre `DD/MM/AAAA` na tela e `YYYY-MM-DD` (ISO) em inputs `type="date"` e
  no banco.

### Idioma e convenções gerais

- **Toda a interface é em português do Brasil.** Nomes de variáveis,
  funções, campos de formulário e mensagens de erro também são em
  português (`nome`, `telefone`, `eh_organizador`, `criarVoluntario`,
  "Não foi possível salvar. Tente novamente.").
- Datas sempre em `DD/MM/AAAA` na exibição. Um helper local
  `formatarDataPtBr(data: string)` (recebe `YYYY-MM-DD`, faz
  `data.split("-")` e monta `${dia}/${mes}/${ano}`) é reimplementado em
  cada componente que precisa dele — não há um único módulo compartilhado
  para isso no código atual.
- `src/lib/utils.ts` tem os helpers realmente compartilhados:
  `gerarId()` (usa `crypto.randomUUID()` com fallback manual, porque
  `crypto.randomUUID` só existe em contexto seguro — HTTPS — e o app
  também é acessado via IP local em HTTP durante testes),
  `sanitizarNomeArquivo()` (remove acentos/espaços de nomes de arquivo
  antes de subir para o Storage, usando `\p{Diacritic}` — **não** tente
  escrever sequências de escape Unicode de combining marks manualmente,
  editores/ferramentas corrompem esse byte sequence com frequência; use a
  propriedade Unicode `\p{Diacritic}` com a flag `u`), e `hojeISO()`
  (retorna a data de hoje como `YYYY-MM-DD`, para valores default de
  campos de data).
- Sem comentários explicando o óbvio. Sem abstrações prematuras. Sem
  validações para casos que não podem acontecer.

### Paleta de cores (definir em `globals.css` com CSS vars + `@theme inline`)

```
--color-primary:      #2784F5
--color-background:   #F5F8FA
--color-card:         #FFFFFF
--color-text-main:    #2E2A33
--color-btn-primary:  #BEC0CC
--color-success:      #04BA5C
--color-danger:       #FC0803
```

Use essas classes Tailwind (`bg-primary`, `text-text-main`, `bg-danger/10`
etc.) em todo o app — nunca cores soltas tipo `blue-500`.

### Papéis de usuário

Existe um único tipo de conta de autenticação (Supabase Auth), mas dois
papéis funcionais, controlados pela tabela `voluntarios`:

- **Voluntário comum**: só pode visualizar (calendário, voluntários,
  materiais, eventos).
- **Organizador** (`voluntarios.eh_organizador = true` e `ativo = true`):
  pode criar/editar/excluir em todas as áreas.

A ligação entre `auth.users` e `public.voluntarios` é feita **pelo e-mail**
(não por uma foreign key para `auth.users.id`). Um voluntário pode existir
sem conta de autenticação (só um registro de agenda), e uma conta pode ser
criada depois para ele. `getPerfil()` (em `src/lib/auth.ts`, `React.cache`)
busca o usuário autenticado via `supabase.auth.getUser()`, depois busca o
voluntário correspondente por e-mail, e expõe `{ userId, email, voluntario,
ehOrganizador }`. Toda página do dashboard chama `getPerfil()`.

A autorização real de escrita é garantida no **banco**, via RLS, com uma
função `is_organizador()` (`SECURITY DEFINER`, checa
`auth.jwt()->>'email'` contra `voluntarios.eh_organizador` e `ativo`) — a
checagem no frontend é só para UX (esconder botões), nunca a única
barreira.

### Estrutura de rotas (App Router)

```
src/app/
  (auth)/
    login/page.tsx
    esqueci-senha/page.tsx
    redefinir-senha/page.tsx        <- reaproveitada por 2 fluxos, ver abaixo
  (dashboard)/
    layout.tsx                      <- NavBar + banner de aniversário + getPerfil()
    calendario/page.tsx
    voluntarios/page.tsx
    voluntarios/novo/page.tsx
    voluntarios/[id]/editar/page.tsx
    agendamentos/novo/page.tsx
    agendamentos/[id]/editar/page.tsx
    materiais/page.tsx              <- grid de modalidades OU lista filtrada (?modalidade=)
    materiais/novo/page.tsx
    livros/page.tsx                 <- mantida só como dado legado, sem link no menu
    livros/novo/page.tsx
    livros/[id]/editar/page.tsx
    eventos/page.tsx
    eventos/novo/page.tsx
    eventos/[id]/editar/page.tsx
  api/agendamentos/
    route.ts
    proximos/route.ts               <- GET, usado por processo externo de lembretes
    [id]/route.ts
    [id]/cancelar/route.ts
    [id]/falta/route.ts
  layout.tsx, page.tsx (redireciona para /calendario ou /login)
src/proxy.ts                        <- proteção de rotas (ver seção Next 16 acima)
src/lib/
  supabase/{client,server,service,middleware,database.types}.ts
  actions/voluntarios.ts            <- Server Actions que usam a service role key
  auth.ts, api-auth.ts, utils.ts, materiais.ts, types.ts
src/components/                     <- um componente client por formulário/lista
```

### Autenticação — fluxos e a pegadinha do PKCE

1. **Login** (`/login`): formulário simples com e-mail/senha
   (`supabase.auth.signInWithPassword`). Redesenhado a partir de um mockup
   Stitch: logo centralizado, ícones dentro dos inputs (lucide-react),
   link "Esqueci minha senha".

2. **Esqueci a senha** (`/esqueci-senha`): chama
   `supabase.auth.resetPasswordForEmail(email, { redirectTo:
   `${origem}/redefinir-senha` })`.

3. **Cadastro de voluntário com convite** (`/voluntarios/novo`, opção
   padrão "Enviar convite por e-mail"): Server Action chama
   `supabase.auth.admin.inviteUserByEmail(email, { redirectTo:
   `${origem}/redefinir-senha` })` — reaproveita a mesma página de
   redefinir senha para o e-mail de boas-vindas (template "Invite user"
   do Supabase), em vez de criar uma tela de "criar conta" separada.

4. **Cadastro de voluntário com senha manual** (opção "Definir senha
   agora"): existe porque o e-mail de convite às vezes falha por
   filtro/SPAM do destinatário — o organizador sabe a senha e a repassa
   por outro meio (WhatsApp). A Server Action `criarVoluntario` chama
   `supabase.auth.admin.createUser({ email, password, email_confirm:
   true })`. Se o e-mail já tiver conta (`already been registered`), em
   vez de bloquear, ela lista os usuários (`admin.listUsers`) para achar
   o existente e chama `admin.updateUserById(id, { password })` —
   sobrepõe a senha em vez de falhar. O mesmo padrão existe para
   **redefinir senha ao editar um voluntário já existente**
   (`redefinirSenhaVoluntario`, checkbox "Redefinir senha do voluntário"
   na tela de editar): se não existir conta ainda (voluntário cadastrado
   antes de existir esse sistema), a função **cria** a conta em vez de
   retornar erro de "conta não encontrada".

5. **`/redefinir-senha`** — a página mais delicada do sistema. Tanto o
   link de "esqueci senha" quanto o convite de boas-vindas chegam como um
   link do Supabase que, ao ser clicado, redireciona para esta página
   **com os tokens de sessão no `#hash` da URL** (formato antigo do
   Supabase Auth: `#access_token=...&refresh_token=...&type=recovery`),
   não como `?code=...`.

   **Armadilha — dois formatos de link diferentes, dependendo de quem
   gera o link:**

   - Links criados via **Admin API** (`admin.inviteUserByEmail`, usado no
     convite de boas-vindas) chegam no formato antigo: depois do
     `/verify` do Supabase, o navegador é redirecionado com os tokens no
     **`#hash`** da URL (`#access_token=...&refresh_token=...&type=
     invite`). Nenhum código de servidor processa isso automaticamente —
     é resolvido em `/redefinir-senha`, num `useEffect` que faz o parse
     manual de `window.location.hash` com `URLSearchParams` e chama
     `supabase.auth.setSession({ access_token, refresh_token })`.
   - Links criados por `supabase.auth.resetPasswordForEmail()` chamado
     **do navegador** (usado em "esqueci a senha") passam pelo fluxo
     PKCE, porque o cliente criado com `createBrowserClient` (`@supabase/
     ssr`) tem `flowType` fixado em `"pkce"`. Esse link chega como
     **`?code=...`** (query string, não hash) depois do `/verify`. Isso
     **não** é processado automaticamente por nenhum componente client-
     side: o `code_verifier` da troca PKCE só existe como cookie
     definido no navegador que chamou `resetPasswordForEmail`, então a
     troca do código pela sessão (`exchangeCodeForSession`) **precisa
     acontecer no servidor**, numa Route Handler dedicada —
     `src/app/auth/confirm/route.ts` — que lê `?code=` (ou `?token_hash=
     &type=`, para o caso de o template de e-mail ser customizado), troca
     pela sessão, e só então redireciona para `/redefinir-senha` (que
     nesse ponto já tem sessão válida via cookie, sem precisar de parse
     de hash). Por isso `resetPasswordForEmail` aponta `redirectTo` para
     `${origem}/auth/confirm`, **não** diretamente para
     `/redefinir-senha` (só o convite de boas-vindas aponta direto para
     lá, porque usa o formato antigo). Sem essa rota — e sem ela estar
     também na lista de "Redirect URLs" permitidas nas configurações de
     Auth do Supabase — o Supabase cai de volta silenciosamente para a
     Site URL "crua", o próprio middleware do app redireciona isso para
     `/login` (preservando o `?code=` na querystring, mas perdendo o
     destino), e o usuário só vê a tela de login de novo, sem nenhum erro
     explícito.

6. Middleware/proxy (`src/proxy.ts` + `src/lib/supabase/middleware.ts`)
   redireciona não-autenticados para `/login` (exceto rotas públicas
   `/login`, `/esqueci-senha`, `/redefinir-senha`, `/auth/confirm`), e
   redireciona usuários já autenticados que acessem `/login` de volta
   para `/calendario`.

### Modelo de dados

Veja `docs/schema.sql` para o DDL completo e exato (tabelas, constraints,
índices, funções, triggers, RLS, buckets). Resumo funcional:

- **`voluntarios`**: nome, telefone, email (único, case-insensitive),
  `eh_organizador`, `ativo`, `data_nascimento` (opcional), `criado_em`.
- **`agendamentos`**: um por `data` (único) — abertura, apresentação,
  livro (opcional), tema, `status` (`agendado` / `cancelado` /
  `falta_abertura` / `falta_apresentacao`), observações. Trigger mantém
  `atualizado_em`.
- **`livros`**: nome, autor, capítulos. A tela de cadastro de livros foi
  removida do menu de navegação (não se cadastram mais livros pela UI),
  mas a tabela e os registros existentes continuam sendo referenciados
  por `agendamentos` e por `materiais_apoio` — não a delete nem remova o
  código de acesso a ela.
- **`materiais_apoio`**: título, `tipo` (modalidade: `livros`, `videos`,
  `apresentacoes`, `normas`, `audios`, `outros`), `url_arquivo` OU
  `url_link` (um dos dois), `data` (default hoje, editável pelo
  organizador), `criado_em`.
- **`eventos`**: data, descrição, array de caminhos de fotos no Storage.
- **`avisos_enviados`**: log de lembretes automáticos já enviados (usado
  por um processo externo que consome `/api/agendamentos/proximos`, não
  incluído neste repositório — só a rota de leitura existe aqui).

### Storage (Supabase Storage)

- **`materiais-apoio`** (privado, limite 50 MB): arquivos de materiais de
  apoio. Acesso de leitura via **signed URL** gerada sob demanda
  (`createSignedUrl(path, 60)`), nunca URL pública direta.
- **`eventos-fotos`** (público): fotos de eventos, exibidas com URL
  pública direta.
- Ao excluir um material ou evento que tenha arquivo associado, **sempre**
  remova o objeto do Storage correspondente antes/junto de apagar a linha
  do banco, para não deixar arquivo órfão.

### Funcionalidades detalhadas por área

#### Calendário (`/calendario`)
- `FullCalendar` mês, locale pt-br, com um ponto colorido nos dias que têm
  agendamento.
- Clicar num dia **sem** agendamento (só organizador) leva para
  `/agendamentos/novo?data=YYYY-MM-DD`.
- Clicar num dia **com** agendamento abre um modal (`CardAgendamento`)
  mostrando abertura, apresentação, livro (se houver), tema, observações e
  status.
- Para organizador, o modal tem até 3 ações, dependendo do status:
  - Se **não cancelado**: `Cancelar` (só fecha o modal, sem alterar nada),
    `Excluir` (abre um segundo modal de confirmação pedindo motivo, marca
    `status = 'cancelado'` e grava o motivo em `observacoes` — é uma
    exclusão lógica, a linha nunca é apagada de verdade), `Editar`.
  - Se **já cancelado**: só `Cancelar` (fechar) e `Novo agendamento` (leva
    para `/agendamentos/novo?data=` da mesma data).
- Criar um novo agendamento para uma data que já tem uma linha (mesmo que
  cancelada) **apaga a linha antiga e insere uma nova** (delete-then-insert
  no submit do formulário) — a nova sempre sobrepõe, nunca há conflito de
  unicidade em `agendamentos.data`.

#### Voluntários (`/voluntarios`, `/voluntarios/novo`, `/voluntarios/[id]/editar`)
- Tabela com nome, telefone, e-mail, nascimento (`DD/MM/AAAA` ou "—"),
  organizador (ícone), ativo/inativo (badge), e para organizador: editar e
  ativar/inativar (nunca excluir voluntário — só inativar).
- Cadastro novo: nome, telefone, e-mail, data de nascimento (opcional,
  ícone de bolo), depois a escolha de convite vs. senha manual (ver seção
  de autenticação acima), toggles Organizador/Ativo.
- Editar: mesmos campos, **sem** a escolha de convite/senha do cadastro
  novo — em vez disso, um checkbox "Redefinir senha do voluntário" que,
  quando marcado, revela um campo de nova senha e aciona
  `redefinirSenhaVoluntario` no submit (cria a conta se não existir,
  atualiza a senha se já existir).

#### Materiais de Apoio (`/materiais`, `/materiais/novo`)
- Sem `?modalidade=`: grade de 6 cartões (Livros, Vídeos, Apresentações,
  Normas, Áudios, Outros), cada um com ícone, nome e botão "Ver Todos".
- Com `?modalidade=X`: lista filtrada só daquela modalidade — cabeçalho
  com "Voltar", título, caixa de busca (ícone de lupa, filtra por título
  em tempo real, client-side), botão "Novo Material" (só organizador). Cada
  item mostra badge da modalidade, título, data (`DD/MM/AAAA`), botão
  "Acessar" (abre `url_link` em nova aba, ou gera signed URL se for
  `url_arquivo`) e, só para organizador, botão "Excluir" (pede confirmação,
  remove o arquivo do Storage se houver, depois apaga a linha do banco).
  No layout do item, a linha usa `flex-col` no mobile e `sm:flex-row` a
  partir do breakpoint `sm:` — **não** use `flex items-center
  justify-between` sem quebra de linha aqui: com dois botões de largura
  fixa (Acessar/Excluir) e um título em container `min-w-0`, o flex
  comprime o título até sobrar uma letra em telas estreitas (bug real já
  visto e corrigido neste projeto).
- Cadastro novo: título, modalidade (select com as 6 opções), data
  (`type="date"`, default = hoje via `hojeISO()`, editável), e então
  **um dos dois**: upload de arquivo (vai para o bucket `materiais-apoio`,
  nome sanitizado com `sanitizarNomeArquivo`) ou link externo (URL). Sem
  campo de "livro" nesta tela (foi removido).
- Menu de navegação chama essa área de "Materiais Apoio" (não "Materiais"),
  e não existe mais um item de menu "Livros" separado.

#### Eventos (`/eventos`, `/eventos/novo`, `/eventos/[id]/editar`)
- Grade de eventos com data, descrição e fotos (upload múltiplo para o
  bucket público `eventos-fotos`). CRUD completo, só organizador escreve.

#### Aviso de aniversário
- No layout do dashboard, só para organizador: busca voluntários ativos
  com `data_nascimento` preenchida, compara mês/dia com o dia **seguinte**
  ao de hoje (`new Date()` + `setDate(+1)`), e mostra uma faixa fina entre
  a NavBar e o conteúdo com "Amanhã é aniversário de FULANO[, FULANO e
  FULANO]." (pluralização correta da lista de nomes), com um botão de
  fechar (estado local, some até o próximo carregamento de página).

### Cuidados técnicos gerais para o agente que for reconstruir

- **Não rode scripts Node standalone chamando `@supabase/supabase-js`
  `createClient()`** para testes administrativos em Node 20 — a versão 20
  não tem `WebSocket` nativo, e o cliente realtime do supabase-js quebra
  com esse erro mesmo sem usar realtime. Prefira chamar a Admin API via
  `fetch()` puro quando precisar rodar algo fora do Next.js.
- Ao adicionar/alterar colunas, sempre regenerar
  `src/lib/supabase/database.types.ts` a partir do banco real (via MCP do
  Supabase, `generate_typescript_types`, ou `supabase gen types
  typescript`) — nunca editar esse arquivo à mão.
- Cuidado ao exportar constantes de um arquivo `"use client"` para uso em
  Server Components — pode falhar silenciosamente (sem erro, só renderiza
  vazio). Constantes/config compartilhadas entre client e server (ex:
  `MODALIDADE_CONFIG` em `src/lib/materiais.ts`) devem morar num módulo
  simples, sem a diretiva `"use client"`.
- `next.config.ts` precisa liberar o domínio do Supabase Storage em
  `images.remotePatterns` para o `next/image` funcionar com fotos vindas
  de lá.

---

## Depois de aplicar este prompt

1. Aplique `docs/schema.sql` num projeto Supabase novo.
2. Siga `docs/SETUP_AMBIENTES.md` para configurar Supabase, GitHub e Vercel
   do zero (variáveis de ambiente, SMTP, redirect URLs, etc.).
3. Cadastre manualmente o primeiro organizador (não há tela de "primeiro
   acesso" — veja a seção "Primeiro organizador" em `SETUP_AMBIENTES.md`).
4. Veja `docs/DISASTER_RECOVERY.md` para cuidados de backup contínuo, para
   que a *próxima* recuperação não dependa de reconstruir do zero.
