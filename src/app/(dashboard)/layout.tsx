import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { AvisosProximos } from "@/components/AvisosProximos";
import { adicionarDiasISO, hojeISOBrasil } from "@/lib/utils";

const DIAS_ANTECEDENCIA = 7;

async function buscarAniversariantesProximos(hoje: string, limite: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("voluntarios")
    .select("id, nome, data_nascimento")
    .eq("ativo", true)
    .not("data_nascimento", "is", null);

  const anoAtual = Number(hoje.slice(0, 4));

  return (data ?? [])
    .map((v) => {
      const [, mes, dia] = v.data_nascimento!.split("-");
      let ocorrencia = `${anoAtual}-${mes}-${dia}`;
      if (ocorrencia < hoje) {
        ocorrencia = `${anoAtual + 1}-${mes}-${dia}`;
      }
      return { id: v.id, nome: v.nome, data: ocorrencia };
    })
    .filter((v) => v.data <= limite);
}

async function buscarApresentacoesProximas(hoje: string, limite: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("agendamentos")
    .select(
      `id, data, tema,
      voluntario_abertura:voluntarios!agendamentos_voluntario_abertura_id_fkey(nome),
      voluntario_apresentacao:voluntarios!agendamentos_voluntario_apresentacao_id_fkey(nome)`
    )
    .eq("status", "agendado")
    .gte("data", hoje)
    .lte("data", limite)
    .order("data", { ascending: true });

  return ((data ?? []) as unknown as Array<{
    id: string;
    data: string;
    tema: string;
    voluntario_abertura: { nome: string } | null;
    voluntario_apresentacao: { nome: string } | null;
  }>).map((a) => ({
    id: a.id,
    data: a.data,
    tema: a.tema,
    abertura: a.voluntario_abertura?.nome ?? null,
    apresentacao: a.voluntario_apresentacao?.nome ?? null,
  }));
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const perfil = await getPerfil();
  const hoje = hojeISOBrasil();
  const limite = adicionarDiasISO(hoje, DIAS_ANTECEDENCIA);

  const [aniversariantes, apresentacoes] = await Promise.all([
    perfil.ehOrganizador ? buscarAniversariantesProximos(hoje, limite) : Promise.resolve([]),
    buscarApresentacoesProximas(hoje, limite),
  ]);

  return (
    <>
      <NavBar email={perfil.email} ehOrganizador={perfil.ehOrganizador} />
      <AvisosProximos aniversariantes={aniversariantes} apresentacoes={apresentacoes} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
