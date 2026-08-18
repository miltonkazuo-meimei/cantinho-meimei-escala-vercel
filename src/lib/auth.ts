import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Voluntario } from "@/lib/types";

export type Perfil = {
  userId: string;
  email: string;
  voluntario: Voluntario | null;
  ehOrganizador: boolean;
};

export const getPerfil = cache(async (): Promise<Perfil> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    redirect("/login");
  }

  const { data: voluntario } = await supabase
    .from("voluntarios")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email,
    voluntario,
    ehOrganizador: Boolean(voluntario?.eh_organizador && voluntario?.ativo),
  };
});
