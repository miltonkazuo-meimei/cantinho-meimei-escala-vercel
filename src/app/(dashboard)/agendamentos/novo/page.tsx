import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AgendamentoForm } from "@/components/AgendamentoForm";

export default async function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/calendario");
  }

  const { data: dataParam } = await searchParams;

  const supabase = await createClient();
  const [{ data: voluntarios }, { data: livros }] = await Promise.all([
    supabase
      .from("voluntarios")
      .select("*")
      .eq("ativo", true)
      .order("nome"),
    supabase.from("livros").select("*").order("nome"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Novo agendamento</h1>
        <p className="text-sm text-text-main/60">
          Preencha os dados da apresentação para a data escolhida.
        </p>
      </div>
      <AgendamentoForm
        modo="novo"
        valoresIniciais={dataParam ? { data: dataParam } : undefined}
        voluntarios={voluntarios ?? []}
        livros={livros ?? []}
      />
    </div>
  );
}
