-- ============================================================================
-- Cantinho da Meimei — Escala de Apresentações
-- Script de recriação completa do banco de dados (Supabase / Postgres)
--
-- Uso: cole este arquivo inteiro no SQL Editor de um projeto Supabase NOVO
-- (ou rode via `supabase db execute` / MCP `apply_migration`) logo após criar
-- o projeto. Ele recria toda a estrutura (tabelas, índices, funções,
-- triggers, RLS e buckets de storage) do zero.
--
-- Gerado em 2026-08-24 a partir do estado real do projeto de produção
-- (ref hkrgkcqsqjqbakdsolyf), reunindo o histórico de migrations aplicadas:
--   20260817233453_storage_policies_materiais_e_eventos
--   20260820015303_unique_email_voluntarios
--   20260821203726_materiais_apoio_modalidades
--   20260824125102_materiais_apoio_data_voluntarios_nascimento
--
-- NÃO recria dados (voluntários, agendamentos, materiais etc.) — apenas a
-- estrutura. Para os dados, veja docs/DISASTER_RECOVERY.md.
-- ============================================================================

-- Extensões usadas (já vêm habilitadas por padrão em todo projeto Supabase
-- novo; os comandos abaixo são apenas para garantir, caso falte alguma).
create extension if not exists "pgcrypto" with schema extensions;
create extension if not exists "uuid-ossp" with schema extensions;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- Livros usados nas apresentações (cadastro legado — a interface de
-- cadastro de livros foi removida do menu, mas a tabela continua em uso
-- como referência opcional em agendamentos e materiais_apoio).
create table public.livros (
  id         uuid primary key default gen_random_uuid(),
  autor      text not null,
  nome       text not null,
  capitulos  text,
  criado_em  timestamptz default now()
);

-- Voluntários (pessoas da escala). Cada voluntário pode também ter uma
-- conta de autenticação (auth.users) com o mesmo e-mail — a ligação entre
-- as duas tabelas é feita pelo e-mail, não por uma foreign key, porque
-- voluntário pode existir sem conta de acesso (ex: cadastro sem convite).
create table public.voluntarios (
  id               uuid primary key default gen_random_uuid(),
  nome             text not null,
  telefone         text not null,
  email            text not null,
  eh_organizador   boolean default false,
  ativo            boolean default true,
  data_nascimento  date,
  criado_em        timestamptz default now()
);

-- E-mail é único (case-insensitive) para permitir localizar o voluntário
-- pela conta de auth e para não haver dois cadastros para o mesmo e-mail.
create unique index voluntarios_email_lower_idx on public.voluntarios (lower(email));

-- Agendamentos: um por dia (a data é única — um novo agendamento no mesmo
-- dia sobrepõe o anterior, ver regra de negócio no app, não no banco).
create table public.agendamentos (
  id                          uuid primary key default gen_random_uuid(),
  data                        date not null unique,
  voluntario_abertura_id      uuid references public.voluntarios(id) on delete set null,
  voluntario_apresentacao_id  uuid references public.voluntarios(id) on delete set null,
  livro_id                    uuid references public.livros(id) on delete set null,
  tema                        text not null,
  status                      text default 'agendado'
                              check (status in ('agendado', 'cancelado', 'falta_abertura', 'falta_apresentacao')),
  observacoes                 text,
  criado_em                   timestamptz default now(),
  atualizado_em               timestamptz default now()
);

-- Eventos (fotos/relatos de atividades realizadas).
create table public.eventos (
  id         uuid primary key default gen_random_uuid(),
  data       date not null,
  descricao  text not null,
  fotos      text[],
  criado_em  timestamptz default now()
);

-- Materiais de apoio (arquivos ou links), organizados por modalidade.
create table public.materiais_apoio (
  id           uuid primary key default gen_random_uuid(),
  titulo       text not null,
  tipo         text not null
               check (tipo in ('livros', 'videos', 'apresentacoes', 'normas', 'audios', 'outros')),
  url_arquivo  text,
  url_link     text,
  livro_id     uuid references public.livros(id) on delete set null,
  data         date not null default current_date,
  criado_em    timestamptz default now()
);

-- Registro de avisos automáticos enviados (lembretes de WhatsApp/e-mail).
-- Usada por um processo externo (não incluído neste repositório) que lê
-- a rota /api/agendamentos/proximos e evita reenviar o mesmo aviso.
create table public.avisos_enviados (
  id              uuid primary key default gen_random_uuid(),
  agendamento_id  uuid not null references public.agendamentos(id) on delete cascade,
  tipo            text not null
                  check (tipo in ('lembrete_abertura', 'lembrete_apresentacao', 'lembrete_organizador', 'aviso_falta')),
  canal           text not null check (canal in ('whatsapp', 'email')),
  enviado_em      timestamptz default now(),
  sucesso         boolean default true
);

-- ============================================================================
-- FUNÇÕES E TRIGGERS
-- ============================================================================

-- Verifica se o usuário autenticado (pelo e-mail do JWT) é um voluntário
-- organizador ativo. SECURITY DEFINER para poder ler a tabela voluntarios
-- mesmo estando dentro de uma policy de RLS de outra tabela.
create or replace function public.is_organizador()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from voluntarios
    where email = auth.jwt()->>'email'
      and eh_organizador = true
      and ativo = true
  );
$$;

-- Mantém agendamentos.atualizado_em em dia a cada UPDATE.
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger trg_agendamentos_atualizado_em
before update on public.agendamentos
for each row execute function public.set_atualizado_em();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- Padrão em todas as tabelas de negócio: qualquer usuário autenticado pode
-- LER; apenas organizadores podem escrever (INSERT/UPDATE/DELETE).
-- avisos_enviados é a exceção: só o service role (usado pelo processo
-- externo de lembretes) pode ler/escrever.

alter table public.livros           enable row level security;
alter table public.voluntarios      enable row level security;
alter table public.agendamentos     enable row level security;
alter table public.eventos          enable row level security;
alter table public.materiais_apoio  enable row level security;
alter table public.avisos_enviados  enable row level security;

create policy "leitura_autenticados" on public.livros
  for select to authenticated using (true);
create policy "escrita_organizadores" on public.livros
  for all to authenticated using (is_organizador()) with check (is_organizador());

create policy "leitura_autenticados" on public.voluntarios
  for select to authenticated using (true);
create policy "escrita_organizadores" on public.voluntarios
  for all to authenticated using (is_organizador()) with check (is_organizador());

create policy "leitura_autenticados" on public.agendamentos
  for select to authenticated using (true);
create policy "escrita_organizadores" on public.agendamentos
  for all to authenticated using (is_organizador()) with check (is_organizador());

create policy "leitura_autenticados" on public.eventos
  for select to authenticated using (true);
create policy "escrita_organizadores" on public.eventos
  for all to authenticated using (is_organizador()) with check (is_organizador());

create policy "leitura_autenticados" on public.materiais_apoio
  for select to authenticated using (true);
create policy "escrita_organizadores" on public.materiais_apoio
  for all to authenticated using (is_organizador()) with check (is_organizador());

create policy "somente_service_role" on public.avisos_enviados
  for all using (auth.role() = 'service_role');

-- ============================================================================
-- STORAGE (buckets e políticas)
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('materiais-apoio', 'materiais-apoio', false, 52428800) -- 50 MB, privado
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('eventos-fotos', 'eventos-fotos', true) -- público, sem limite de tamanho
on conflict (id) do nothing;

-- materiais-apoio: qualquer autenticado lê (via signed URL, bucket privado);
-- só organizador escreve/apaga.
create policy "materiais_apoio_leitura_autenticados" on storage.objects
  for select to authenticated using (bucket_id = 'materiais-apoio');
create policy "materiais_apoio_escrita_organizadores" on storage.objects
  for all to authenticated
  using (bucket_id = 'materiais-apoio' and is_organizador())
  with check (bucket_id = 'materiais-apoio' and is_organizador());

-- eventos-fotos: leitura pública (bucket público, fotos aparecem sem
-- login); só organizador escreve/apaga.
create policy "eventos_fotos_leitura_publica" on storage.objects
  for select using (bucket_id = 'eventos-fotos');
create policy "eventos_fotos_escrita_organizadores" on storage.objects
  for all to authenticated
  using (bucket_id = 'eventos-fotos' and is_organizador())
  with check (bucket_id = 'eventos-fotos' and is_organizador());

-- ============================================================================
-- Fim do script.
-- Próximo passo: cadastrar o primeiro organizador manualmente (ver
-- docs/SETUP_AMBIENTES.md, seção "Primeiro organizador").
-- ============================================================================
