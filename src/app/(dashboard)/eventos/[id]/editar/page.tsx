import { notFound, redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventoForm } from "@/components/EventoForm";

export default async function EditarEventoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/eventos");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!evento) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Editar evento</h1>
        <p className="text-sm text-text-main/60">Atualize os dados do evento.</p>
      </div>
      <EventoForm
        modo="editar"
        eventoId={evento.id}
        valoresIniciais={{
          data: evento.data,
          descricao: evento.descricao,
        }}
        fotosIniciais={evento.fotos ?? []}
      />
    </div>
  );
}
