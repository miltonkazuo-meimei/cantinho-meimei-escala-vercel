import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { VoluntarioForm } from "@/components/VoluntarioForm";

export default async function NovoVoluntarioPage() {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/voluntarios");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Novo voluntário</h1>
        <p className="text-sm text-text-main/60">Cadastre um novo voluntário.</p>
      </div>
      <VoluntarioForm modo="novo" />
    </div>
  );
}
