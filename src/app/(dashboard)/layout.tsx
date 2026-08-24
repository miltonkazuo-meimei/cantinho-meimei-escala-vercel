import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { AvisoAniversarios } from "@/components/AvisoAniversarios";

async function buscarAniversariantesDeAmanha(): Promise<string[]> {
  const supabase = await createClient();
  const { data: voluntarios } = await supabase
    .from("voluntarios")
    .select("nome, data_nascimento")
    .eq("ativo", true)
    .not("data_nascimento", "is", null);

  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  const mesAmanha = amanha.getMonth() + 1;
  const diaAmanha = amanha.getDate();

  return (voluntarios ?? [])
    .filter((v) => {
      if (!v.data_nascimento) return false;
      const [, mes, dia] = v.data_nascimento.split("-").map(Number);
      return mes === mesAmanha && dia === diaAmanha;
    })
    .map((v) => v.nome);
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();
  const aniversariantes = perfil.ehOrganizador ? await buscarAniversariantesDeAmanha() : [];

  return (
    <>
      <NavBar email={perfil.email} ehOrganizador={perfil.ehOrganizador} />
      <AvisoAniversarios nomes={aniversariantes} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
