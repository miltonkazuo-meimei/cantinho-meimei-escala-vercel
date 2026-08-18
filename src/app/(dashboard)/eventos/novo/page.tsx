import { redirect } from "next/navigation";
import { getPerfil } from "@/lib/auth";
import { EventoForm } from "@/components/EventoForm";

export default async function NovoEventoPage() {
  const perfil = await getPerfil();
  if (!perfil.ehOrganizador) {
    redirect("/eventos");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Novo evento</h1>
        <p className="text-sm text-text-main/60">Registre um novo evento realizado.</p>
      </div>
      <EventoForm />
    </div>
  );
}
