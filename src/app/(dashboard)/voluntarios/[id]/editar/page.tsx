import { notFound, redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VoluntarioForm } from "@/components/VoluntarioForm";

export default async function EditarVoluntarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/voluntarios");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: voluntario } = await supabase
    .from("voluntarios")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!voluntario) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Editar voluntário</h1>
        <p className="text-sm text-text-main/60">Atualize os dados do voluntário.</p>
      </div>
      <VoluntarioForm
        modo="editar"
        voluntarioId={voluntario.id}
        valoresIniciais={{
          nome: voluntario.nome,
          telefone: voluntario.telefone,
          email: voluntario.email,
          data_nascimento: voluntario.data_nascimento ?? "",
          eh_organizador: voluntario.eh_organizador ?? false,
          ativo: voluntario.ativo ?? true,
        }}
      />
    </div>
  );
}
