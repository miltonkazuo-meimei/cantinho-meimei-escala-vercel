import Link from "next/link";
import { Plus } from "lucide-react";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LivrosGrid } from "@/components/LivrosGrid";

export default async function LivrosPage() {
  const perfil = await getPerfil();
  const supabase = await createClient();

  const [{ data: livros }, { data: vinculos }] = await Promise.all([
    supabase.from("livros").select("*").order("nome"),
    supabase.from("agendamentos").select("livro_id").not("livro_id", "is", null),
  ]);

  const livrosComAgendamento = new Set(
    (vinculos ?? []).map((v) => v.livro_id).filter(Boolean)
  );

  const livrosComUso = (livros ?? []).map((livro) => ({
    ...livro,
    temAgendamentos: livrosComAgendamento.has(livro.id),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Livros</h1>
          <p className="text-sm text-text-main/60">
            Obras utilizadas como base para as apresentações.
          </p>
        </div>
        {perfil.ehOrganizador && (
          <Link
            href="/livros/novo"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo Livro
          </Link>
        )}
      </div>

      <LivrosGrid livros={livrosComUso} ehOrganizador={perfil.ehOrganizador} />
    </div>
  );
}
