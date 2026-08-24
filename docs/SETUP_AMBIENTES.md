# Passo a passo: recriar os 3 ambientes do zero (GitHub, Supabase, Vercel)

Use este roteiro se precisar recriar o sistema em contas/projetos novos —
por exemplo depois de uma perda total. Siga na ordem: GitHub → Supabase →
Vercel. Cada passo diz o que fazer e por quê.

---

## 1. GitHub

1. Crie um repositório novo (privado) na conta/organização
   `miltonkazuo-meimei` (ou equivalente), ex:
   `cantinho-meimei-escala-vercel`.
2. Se você ainda tem o código localmente (mesmo sem o histórico de git),
   inicialize e envie:
   ```bash
   git init
   git add .
   git commit -m "recria repositório"
   git branch -M main
   git remote add origin https://github.com/<conta>/<repo>.git
   git push -u origin main
   ```
   Se o código também foi perdido, use `docs/PROMPT_RECRIACAO.md` com um
   agente de codificação para reconstruir o app antes deste passo.
3. Guarde o link do repositório — o Vercel vai se conectar a ele por aqui.

## 2. Supabase

1. Crie um projeto novo em [supabase.com](https://supabase.com/dashboard)
   (escolha uma região próxima do Brasil, ex. `sa-east-1`). Anote a
   **senha do banco** gerada — vá para um cofre de senhas, não só para a
   tela.
2. Assim que o projeto estiver pronto, abra **SQL Editor** e cole o
   conteúdo inteiro de `docs/schema.sql` deste repositório. Rode. Isso
   recria tabelas, índices, funções, triggers, RLS e os dois buckets de
   Storage (`materiais-apoio`, `eventos-fotos`) de uma vez.
3. Em **Project Settings → API**, copie:
   - `Project URL` → vai virar `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → vai virar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (**secreta**, nunca no frontend) →
     `SUPABASE_SERVICE_ROLE_KEY`
4. Configurar **Authentication → URL Configuration**:
   - **Site URL**: a URL final de produção (ex.
     `https://cantinho-meimei-escala-vercel.vercel.app` ou domínio
     próprio). **Este é o erro mais comum** — se ficar apontando para
     `localhost`, os links de e-mail (convite/redefinir senha) levam o
     usuário para `localhost` em vez do site real.
   - **Redirect URLs**: adicione a URL de produção + `/redefinir-senha`
     (ex. `https://seu-dominio/redefinir-senha`), e o mesmo para qualquer
     ambiente de preview do Vercel que for usar (`https://*.vercel.app/**`
     funciona como coringa, se preferir liberar todos os previews).
5. Configurar **SMTP customizado** (Authentication → Emails → SMTP
   Settings) — o Supabase tem um limite baixíssimo de e-mails no SMTP
   padrão, insuficiente para uso real. Este projeto usa
   [Resend](https://resend.com):
   - Crie uma conta/domínio no Resend, adicione o domínio de envio (ex.
     um subdomínio como `mail.seudominio.com.br`).
   - O Resend vai pedir para criar registros DNS (SPF, DKIM, e às vezes
     MX) no painel do seu provedor de domínio (ex. Locaweb). **Copie os
     valores exatamente como o Resend mostrar** — já aconteceu de um
     hostname de região ser digitado errado manualmente (ex.
     `sa-leste-1` em vez de `sa-east-1`), o que faz o registro nunca
     resolver e o domínio nunca validar. Depois de criar os registros,
     confirme com `nslookup <hostname> <nameserver-autoritativo-do-seu-
     provedor>` que eles realmente resolvem, antes de reclamar que o
     Resend "não valida".
   - No Supabase, cole host/porta/usuário/senha SMTP fornecidos pelo
     Resend em Authentication → Emails → SMTP Settings, e defina o
     remetente (`From`) com o domínio validado.
   - Sem isso, os e-mails de convite/redefinir-senha eventualmente vão
     parar de funcionar por limite de envio, mesmo que pareçam certos em
     teste manual.
6. **Primeiro organizador**: não existe tela de "primeiro cadastro" no
   app — o primeiro organizador precisa ser criado manualmente, uma única
   vez, direto no Supabase:
   - **Authentication → Users → Add user** → crie com e-mail e senha
     (marque "Auto Confirm User").
   - No **SQL Editor**, insira o registro correspondente em
     `voluntarios` com esse mesmo e-mail e `eh_organizador = true`,
     `ativo = true`:
     ```sql
     insert into public.voluntarios (nome, telefone, email, eh_organizador, ativo)
     values ('Nome do Organizador', '11999999999', 'email@dominio.com.br', true, true);
     ```
   - A partir daqui, esse organizador já consegue logar no app e cadastrar
     todos os outros voluntários pela própria interface.

## 3. Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → importe o
   repositório do GitHub criado no passo 1.
2. Framework preset: Next.js (detectado automaticamente).
3. Em **Environment Variables**, adicione (Production **e** Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   Não defina `NODE_TLS_REJECT_UNAUTHORIZED` em produção — essa variável só
   existe no `.env.local` de desenvolvimento local, para contornar
   interceptação de TLS de antivírus; nunca deve ir para produção.
4. Deploy. Depois do primeiro deploy, copie a URL gerada
   (`https://<projeto>.vercel.app`) e **volte ao passo 2.4** do Supabase
   para confirmar que Site URL/Redirect URLs batem com essa URL real.
5. (Opcional) Configurar domínio próprio em **Settings → Domains**, e
   repetir o ajuste de Site URL/Redirect URLs no Supabase apontando para o
   domínio final.

## 4. Checklist final de fumaça (smoke test)

Depois dos 3 ambientes no ar, confira nesta ordem:

1. Login com o primeiro organizador criado manualmente.
2. Cadastrar um voluntário de teste com "Enviar convite por e-mail" —
   confirme que o e-mail chega e que o link leva a uma tela funcional de
   definir senha (não "link inválido").
3. Cadastrar um voluntário de teste com "Definir senha agora" e logar com
   a senha definida.
4. Criar um agendamento no calendário, confirmar que aparece o ponto no
   dia e que o modal abre.
5. Subir um material de apoio com arquivo e outro com link; confirmar que
   "Acessar" funciona nos dois.
6. Subir uma foto de evento e confirmar que aparece publicamente.

Se todos os 6 passarem, os três ambientes estão corretamente conectados.
