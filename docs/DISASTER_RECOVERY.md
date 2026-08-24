# Backup e recuperação de desastres

## Ponto mais importante: o projeto Supabase está no plano Free

Conferido diretamente no projeto (`miltonkazuo-meimei's Org`, plano
**Free**): **não existe backup automático nenhum**. Backup diário e Point-in-
-Time Recovery só existem a partir do plano Pro. Isso significa que, hoje,
se o projeto Supabase for excluído ou os dados corrompidos, **não há nada
para restaurar** a menos que você mesmo tenha feito uma cópia antes — o
Supabase não vai ter uma cópia guardada em lugar nenhum.

Projetos Free também são **pausados automaticamente após ~7 dias sem
nenhuma requisição**. Um projeto pausado ainda pode ser reativado pelo
painel (os dados continuam lá), mas depois de pausado por muito tempo
pode ser excluído definitivamente pela própria Supabase. Como o sistema é
usado por voluntários que podem ficar dias sem acessar, isso é um risco
real, não só teórico. Duas saídas: (a) considerar migrar para o plano Pro
(~US$25/mês) quando o orçamento permitir — ganha backup diário automático
+ PITR e evita a pausa por inatividade; (b) enquanto estiver no Free,
manter uma rotina de backup manual (abaixo) e garantir que **alguém** entre
no sistema pelo menos 1x por semana.

Todo o resto deste documento assume que você vai continuar no Free e
precisa se virar com backups manuais.

## O que precisa ser copiado, e onde cada coisa mora

| O quê | Onde vive | Já está a salvo em algum outro lugar? |
|---|---|---|
| Código do app | GitHub | Sim, se o repositório existir e estiver com push em dia |
| Estrutura do banco (tabelas, RLS, etc.) | Supabase (Postgres) | Sim, `docs/schema.sql` neste repositório é a estrutura exata |
| **Dados** (voluntários, agendamentos, materiais, eventos) | Supabase (Postgres) | **Não** — só existe no banco, precisa de backup manual |
| **Contas de login** (e-mail + senha) | Supabase Auth (`auth.users`) | **Não** — idem |
| **Arquivos enviados** (materiais em PDF/etc., fotos de eventos) | Supabase Storage | **Não** — idem |
| Variáveis de ambiente (chaves) | Só no painel da Vercel (e recuperáveis pelo painel do Supabase enquanto o projeto existir) | Parcial — se os dois sumirem juntos, perde-se |
| Registros de DNS do Resend (SPF/DKIM) | Painel do seu provedor de domínio (ex. Locaweb) | Sim, mas leva tempo para revalidar se precisar recriar no Resend |

As três linhas em negrito são o que realmente precisa de um backup manual
recorrente — é dado real que não existe em nenhum outro lugar.

## Rotina de backup manual recomendada

Frequência sugerida: **mensal**, ou depois de qualquer leva grande de
cadastros novos (ex. depois de cadastrar vários voluntários de uma vez).
Leva menos de 5 minutos.

### 1. Dump completo do banco (estrutura + dados + contas de login)

Em **Project Settings → Database → Connection string** (no painel do
Supabase), copie a *connection string* no formato "URI" (já vem com o
usuário `postgres`). Com `pg_dump` instalado (vem com qualquer instalação
do PostgreSQL, incluindo a versão portátil), rode:

```bash
pg_dump "<connection-string-do-projeto>" \
  --schema=public --schema=auth \
  --no-owner --no-privileges \
  -f "backup-cantinho-meimei-$(date +%Y-%m-%d).sql"
```

Isso gera um único arquivo `.sql` com **estrutura e dados** de `public`
(voluntários, agendamentos, materiais, eventos, livros, avisos) e de
`auth` (contas de login, incluindo a senha já criptografada — suficiente
para restaurar o acesso de todo mundo sem precisar redefinir senha de
ninguém).

Guarde esse arquivo **fora do GitHub** (ele contém dados pessoais reais:
e-mail, telefone, data de nascimento de voluntários — não é apropriado
manter isso num repositório, mesmo privado). Um bom lugar: uma pasta
comum do Google Drive/OneDrive da organização, ou um cofre de senhas que
aceite anexos, com acesso restrito a quem já cuida do sistema hoje.

### 2. Backup dos arquivos do Storage

O dump acima **não** inclui os arquivos em si dos buckets
`materiais-apoio` e `eventos-fotos` (só os caminhos ficam registrados nas
tabelas). Baixe o conteúdo dos dois buckets periodicamente:

- Pelo painel: **Storage** → abra cada bucket → selecione tudo → baixar.
- Ou via `supabase` CLI: `supabase storage cp --recursive
  ss:///materiais-apoio ./backup-materiais-apoio` (idem para
  `eventos-fotos`), depois de `supabase login` e `supabase link`.

Esse volume tende a crescer devagar (materiais de apoio não mudam toda
semana), então essa parte pode ser feita com menos frequência que o dump
do banco — por exemplo, a cada 2–3 meses, ou sempre que souber que algo
grande foi adicionado.

### 3. Confirmar que as variáveis de ambiente estão anotadas

Guarde uma cópia, em local seguro (cofre de senhas, não em texto puro no
computador), dos três valores que hoje só existem no painel da Vercel:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`. Enquanto o projeto Supabase existir, dá para
recuperá-los por lá a qualquer momento — o cuidado aqui é só para o
cenário de perda simultânea dos dois painéis.

## Como restaurar a partir de um backup manual

1. Recrie o projeto Supabase (veja `docs/SETUP_AMBIENTES.md`), mas **não**
   rode `docs/schema.sql` se for restaurar um dump completo — o dump já
   traz a estrutura junto.
2. Restaure o dump:
   ```bash
   psql "<connection-string-do-projeto-novo>" -f backup-cantinho-meimei-AAAA-MM-DD.sql
   ```
3. Restaure os arquivos de Storage baixados (upload de volta para os
   buckets com o mesmo caminho/nome que tinham).
4. Siga o restante de `docs/SETUP_AMBIENTES.md` a partir do passo 4 em
   diante (Auth: Site URL, redirect URLs, SMTP) — essas configurações do
   painel de Auth **não** vêm no `pg_dump`, precisam ser refeitas na mão.
5. Rode o checklist de fumaça no final de `docs/SETUP_AMBIENTES.md`.

## Outros cuidados que valem a pena

- **Teste a restauração pelo menos uma vez**, num projeto Supabase
  descartável, para confirmar que o backup realmente funciona antes de
  precisar dele de verdade. Backup nunca testado é só uma esperança.
- **Mantenha só uma pessoa (ou uma dupla) como dona da rotina de backup**,
  com uma data marcada no calendário — sem isso, "mensal" vira "nunca".
- Se o volume de voluntários/uso crescer, reavalie o plano Pro do
  Supabase — o custo do backup automático + PITR tende a compensar o
  tempo gasto nesses backups manuais.
- Ao adicionar uma tabela ou coluna nova no futuro, **atualize
  `docs/schema.sql`** no mesmo commit — é fácil esquecer, e um schema.sql
  desatualizado engana justamente no momento em que mais se precisa dele.
