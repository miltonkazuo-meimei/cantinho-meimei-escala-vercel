import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { MaterialForm } from "@/components/MaterialForm";

export default async function NovoMaterialPage() {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/materiais");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Novo material</h1>
        <p className="text-sm text-text-main/60">
          Envie um arquivo ou informe um link externo.
        </p>
      </div>
      <MaterialForm />
    </div>
  );
}
