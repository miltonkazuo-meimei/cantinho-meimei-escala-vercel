"use server";

import { headers } from "next/headers";
import { getPerfil } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

type CriarVoluntarioInput = {
  nome: string;
  telefone: string;
  email: string;
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

  const { data: usuarioCriado, error: erroAuth } = dados.senha
    ? // Organizador define a senha diretamente — usada como alternativa
      // quando o e-mail de convite não é confiável (ex: filtros do
      // destinatário). O organizador é responsável por repassar a senha
      // ao voluntário por outro meio.
      await supabase.auth.admin.createUser({
        email: dados.email,
        password: dados.senha,
        email_confirm: true,
      })
    : // Cria a conta sem senha e dispara o e-mail de boas-vindas (template
      // "Invite user" do Supabase); o voluntário define a própria senha ao
      // clicar no link, reaproveitando a mesma página de "esqueci a senha".
      await supabase.auth.admin.inviteUserByEmail(dados.email, {
        redirectTo: `${await obterOrigem()}/redefinir-senha`,
      });

  if (erroAuth) {
    if (erroAuth.message.includes("already been registered")) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    return {
      error: dados.senha
        ? "Não foi possível criar o acesso do voluntário. Tente novamente."
        : "Não foi possível enviar o convite ao voluntário. Tente novamente.",
    };
  }

  const { error: erroVoluntario } = await supabase.from("voluntarios").insert({
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email,
    eh_organizador: dados.eh_organizador,
    ativo: dados.ativo,
  });

  if (erroVoluntario) {
    // Desfaz o usuário de autenticação já criado para não deixar acesso órfão.
    await supabase.auth.admin.deleteUser(usuarioCriado.user.id);

    if (erroVoluntario.code === "23505") {
      return { error: "Já existe um voluntário com este e-mail." };
    }
    return { error: "Não foi possível salvar o voluntário. Tente novamente." };
  }

  return { error: null };
}
