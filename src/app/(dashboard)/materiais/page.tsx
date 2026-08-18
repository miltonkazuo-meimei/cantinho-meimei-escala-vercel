import Link from "next/link";
import { Plus } from "lucide-react";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MateriaisLista } from "@/components/MateriaisLista";

export default async function MateriaisPage() {
  const perfil = await getPerfil();
  const supabase = await createClient();
  const { data: materiais } = await supabase
    .from("materiais_apoio")
    .select("*, livro:livros(nome)")
    .order("criado_em", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Materiais de Apoio</h1>
          <p className="text-sm text-text-main/60">
            Arquivos e links utilizados nas apresentações.
          </p>
        </div>
        {perfil.ehOrganizador && (
          <Link
            href="/materiais/novo"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo Material
          </Link>
        )}
      </div>

      <MateriaisLista materiais={materiais ?? []} />
    </div>
  );
}
