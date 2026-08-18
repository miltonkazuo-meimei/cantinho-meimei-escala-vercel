import { notFound, redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AgendamentoForm } from "@/components/AgendamentoForm";

export default async function EditarAgendamentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/calendario");
  }

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: agendamento }, { data: voluntarios }, { data: livros }] =
    await Promise.all([
      supabase.from("agendamentos").select("*").eq("id", id).maybeSingle(),
      supabase.from("voluntarios").select("*").eq("ativo", true).order("nome"),
      supabase.from("livros").select("*").order("nome"),
    ]);

  if (!agendamento) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Editar agendamento</h1>
        <p className="text-sm text-text-main/60">
          Atualize os dados da apresentação.
        </p>
      </div>
      <AgendamentoForm
        modo="editar"
        agendamentoId={agendamento.id}
        valoresIniciais={{
          data: agendamento.data,
          voluntario_abertura_id: agendamento.voluntario_abertura_id ?? "",
          voluntario_apresentacao_id: agendamento.voluntario_apresentacao_id ?? "",
          livro_id: agendamento.livro_id ?? "",
          tema: agendamento.tema,
          observacoes: agendamento.observacoes ?? "",
        }}
        voluntarios={voluntarios ?? []}
        livros={livros ?? []}
      />
    </div>
  );
}
