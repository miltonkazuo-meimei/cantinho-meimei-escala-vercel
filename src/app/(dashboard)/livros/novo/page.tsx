import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { LivroForm } from "@/components/LivroForm";

export default async function NovoLivroPage() {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/livros");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Novo livro</h1>
        <p className="text-sm text-text-main/60">Cadastre um novo livro.</p>
      </div>
      <LivroForm modo="novo" />
    </div>
  );
}
