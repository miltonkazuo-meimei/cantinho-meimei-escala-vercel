import Link from "next/link";
import { Plus } from "lucide-react";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VoluntariosTable } from "@/components/VoluntariosTable";

export default async function VoluntariosPage() {
  const perfil = await getPerfil();
  const supabase = await createClient();
  const { data: voluntarios } = await supabase
    .from("voluntarios")
    .select("*")
    .order("nome");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Voluntários</h1>
          <p className="text-sm text-text-main/60">
            Pessoas que participam da escala de abertura e apresentação.
          </p>
        </div>
        {perfil.ehOrganizador && (
          <Link
            href="/voluntarios/novo"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo Voluntário
          </Link>
        )}
      </div>

      <VoluntariosTable
        voluntarios={voluntarios ?? []}
        ehOrganizador={perfil.ehOrganizador}
      />
    </div>
  );
}
