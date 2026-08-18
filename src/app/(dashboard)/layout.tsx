import { getPerfil } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();

  return (
    <>
      <NavBar email={perfil.email} ehOrganizador={perfil.ehOrganizador} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
