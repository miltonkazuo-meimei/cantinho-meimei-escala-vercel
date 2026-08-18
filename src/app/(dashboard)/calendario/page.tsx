import { getPerfil } from "@/lib/auth";
import { CalendarioMensal } from "@/components/CalendarioMensal";

export default async function CalendarioPage() {
  const perfil = await getPerfil();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-text-main">Calendário</h1>
        <p className="text-sm text-text-main/60">
          Escala de aberturas e apresentações do Cantinho da Meimei.
        </p>
      </div>
      <CalendarioMensal ehOrganizador={perfil.ehOrganizador} />
    </div>
  );
}
