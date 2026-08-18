"use server";

import { getPerfil } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";

type CriarVoluntarioInput = {
  nome: string;
  telefone: string;
  email: string;
  senha: string;
  eh_organizador: boolean;
  ativo: boolean;
};

export async function criarVoluntarioComSenha(dados: CriarVoluntarioInput) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    return { error: "Apenas organizadores podem cadastrar voluntários." };
  }

  const supabase = createServiceClient();

  const { data: usuarioCriado, error: erroAuth } = await supabase.auth.admin.createUser({
    email: dados.email,
    password: dados.senha,
    email_confirm: true,
  });

  if (erroAuth) {
    if (erroAuth.message.includes("already been registered")) {
      return { error: "Já existe uma conta com este e-mail." };
    }
    return { error: "Não foi possível criar o acesso do voluntário. Tente novamente." };
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
