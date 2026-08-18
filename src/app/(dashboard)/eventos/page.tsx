import Link from "next/link";
import { Plus } from "lucide-react";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { EventosGrid } from "@/components/EventosGrid";

export default async function EventosPage() {
  const perfil = await getPerfil();
  const supabase = await createClient();
  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .order("data", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Eventos</h1>
          <p className="text-sm text-text-main/60">Registros de eventos realizados.</p>
        </div>
        {perfil.ehOrganizador && (
          <Link
            href="/eventos/novo"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo Evento
          </Link>
        )}
      </div>

      <EventosGrid eventos={eventos ?? []} ehOrganizador={perfil.ehOrganizador} />
    </div>
  );
}
