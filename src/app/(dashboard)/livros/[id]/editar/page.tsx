import { notFound, redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LivroForm } from "@/components/LivroForm";

export default async function EditarLivroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/livros");
  }

  const { id } = await params;
  const supabase = await createClient();
  const { data: livro } = await supabase
    .from("livros")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!livro) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Editar livro</h1>
        <p className="text-sm text-text-main/60">Atualize os dados do livro.</p>
      </div>
      <LivroForm
        modo="editar"
        livroId={livro.id}
        valoresIniciais={{
          nome: livro.nome,
          autor: livro.autor,
          capitulos: livro.capitulos ?? "",
        }}
      />
    </div>
  );
}
