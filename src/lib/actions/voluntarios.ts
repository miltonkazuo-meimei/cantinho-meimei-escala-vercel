"use server";

import { headers } from "next/headers";
import { getPerfil } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

type CriarVoluntarioInput = {
  nome: string;
  telefone: string;
  email: string;
  data_nascimento?: string;
  eh_organizador: boolean;
  ativo: boolean;
  senha?: string;
};

async function obterOrigem() {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocolo = host.startsWith("localhost")
    ? "http"
    : (headersList.get("x-forwarded-proto") ?? "https");
  return `${protocolo}://${host}`;
}

export async function criarVoluntario(dados: CriarVoluntarioInput) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    return { error: "Apenas organizadores podem cadastrar voluntários." };
  }

  const supabase = createServiceClient();

  let usuarioId: string;
  let criouContaNova: boolean;

  if (dados.senha) {
    // Organizador define a senha diretamente — usada como alternativa
    // quando o e-mail de convite não é confiável (ex: filtros do
    // destinatário). O organizador é responsável por repassar a senha
    // ao voluntário por outro meio.
    const { data: usuarioCriado, error: erroCriar } = await supabase.auth.admin.createUser({
      email: dados.email,
      password: dados.senha,
      email_confirm: true,
    });

    if (!erroCriar) {
      usuarioId = usuarioCriado.user.id;
      criouContaNova = true;
    } else if (erroCriar.message.includes("already been registered")) {
      // Já existe uma conta com este e-mail (ex: convite anterior que
      // ficou sem o registro de voluntário correspondente) — em vez de
      // bloquear, define a nova senha na conta existente.
      const { data: lista, error: erroListar } = await supabase.auth.admin.listUsers({
        perPage: 1000,
      });
      const usuarioExistente = erroListar
        ? undefined
        : lista.users.find((u) => u.email?.toLowerCase() === dados.email.toLowerCase());

      if (!usuarioExistente) {
        return { error: "Não foi possível definir a senha. Tente novamente." };
      }

      const { error: erroSenha } = await supabase.auth.admin.updateUserById(
        usuarioExistente.id,
        { password: dados.senha }
      );

      if (erroSenha) {
        return { error: "Não foi possível definir a senha. Tente novamente." };
      }

      usuarioId = usuarioExistente.id;
      criouContaNova = false;
    } else {
      return { error: "Não foi possível criar o acesso do voluntário. Tente novamente." };
    }
  } else {
    // Cria a conta sem senha e dispara o e-mail de boas-vindas (template
    // "Invite user" do Supabase); o voluntário define a própria senha ao
    // clicar no link, reaproveitando a mesma página de "esqueci a senha".
    const { data: usuarioCriado, error: erroConvite } = await supabase.auth.admin.inviteUserByEmail(
      dados.email,
      { redirectTo: `${await obterOrigem()}/redefinir-senha` }
    );

    if (erroConvite) {
      if (erroConvite.message.includes("already been registered")) {
        return { error: "Já existe uma conta com este e-mail." };
      }
      return { error: "Não foi possível enviar o convite ao voluntário. Tente novamente." };
    }

    usuarioId = usuarioCriado.user.id;
    criouContaNova = true;
  }

  const dadosVoluntario = {
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email,
    data_nascimento: dados.data_nascimento || null,
    eh_organizador: dados.eh_organizador,
    ativo: dados.ativo,
  };

  let erroVoluntario;

  if (dados.senha) {
    // No modo de senha manual, se já existir um voluntário cadastrado com
    // este e-mail (ex: o próprio organizador redefinindo a senha de
    // alguém já ativo), atualiza o registro em vez de bloquear — é assim
    // que o organizador "sobrepõe" a senha existente.
    const { data: voluntarioExistente } = await supabase
      .from("voluntarios")
      .select("id")
      .eq("email", dados.email)
      .maybeSingle();

    ({ error: erroVoluntario } = voluntarioExistente
      ? await supabase
          .from("voluntarios")
          .update(dadosVoluntario)
          .eq("id", voluntarioExistente.id)
      : await supabase.from("voluntarios").insert(dadosVoluntario));
  } else {
    ({ error: erroVoluntario } = await supabase.from("voluntarios").insert(dadosVoluntario));
  }

  if (erroVoluntario) {
    if (criouContaNova) {
      // Desfaz o usuário de autenticação recém-criado para não deixar
      // acesso órfão. Se a conta já existia antes desta chamada, ela é
      // preservada mesmo com a senha atualizada.
      await supabase.auth.admin.deleteUser(usuarioId);
    }

    if (erroVoluntario.code === "23505") {
      return { error: "Já existe um voluntário com este e-mail." };
    }
    return { error: "Não foi possível salvar o voluntário. Tente novamente." };
  }

  return { error: null };
}

export async function redefinirSenhaVoluntario(email: string, novaSenha: string) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    return { error: "Apenas organizadores podem redefinir senhas." };
  }

  const supabase = createServiceClient();

  const { data: lista, error: erroListar } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  const usuario = erroListar
    ? undefined
    : lista.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!usuario) {
    return { error: "Não foi possível localizar a conta deste voluntário." };
  }

  const { error } = await supabase.auth.admin.updateUserById(usuario.id, {
    password: novaSenha,
  });

  if (error) {
    return { error: "Não foi possível redefinir a senha. Tente novamente." };
  }

  return { error: null };
}
