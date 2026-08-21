import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MateriaisLista } from "@/components/MateriaisLista";
import { MODALIDADE_CONFIG } from "@/lib/materiais";
import type { TipoMaterial } from "@/lib/types";

const MODALIDADES = Object.keys(MODALIDADE_CONFIG) as TipoMaterial[];

export default async function MateriaisPage({
  searchParams,
}: {
  searchParams: Promise<{ modalidade?: string }>;
}) {
  const perfil = await getPerfil();
  const { modalidade: modalidadeParam } = await searchParams;
  const modalidade = MODALIDADES.includes(modalidadeParam as TipoMaterial)
    ? (modalidadeParam as TipoMaterial)
    : null;

  const supabase = await createClient();

  const novoMaterialBotao = perfil.ehOrganizador && (
    <Link
      href="/materiais/novo"
      className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
    >
      <Plus size={16} />
      Novo Material
    </Link>
  );

  if (modalidade) {
    const { data: materiais } = await supabase
      .from("materiais_apoio")
      .select("*")
      .eq("tipo", modalidade)
      .order("criado_em", { ascending: false });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/materiais"
              className="mb-1 flex items-center gap-1 text-sm text-text-main/60 hover:text-text-main"
            >
              <ArrowLeft size={14} />
              Voltar
            </Link>
            <h1 className="text-2xl font-semibold text-text-main">
              {MODALIDADE_CONFIG[modalidade].label}
            </h1>
          </div>
          {novoMaterialBotao}
        </div>

        <MateriaisLista materiais={materiais ?? []} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Materiais Apoio</h1>
          <p className="text-sm text-text-main/60">
            Arquivos e links utilizados nas apresentações, organizados por modalidade.
          </p>
        </div>
        {novoMaterialBotao}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODALIDADES.map((tipo) => {
          const config = MODALIDADE_CONFIG[tipo];
          const Icon = config.icon;
          return (
            <div
              key={tipo}
              className="flex flex-col items-center gap-3 rounded-xl bg-card p-6 text-center shadow-sm"
            >
              <span className={`flex h-14 w-14 items-center justify-center rounded-full ${config.className}`}>
                <Icon size={28} />
              </span>
              <h3 className="font-semibold text-text-main">{config.label}</h3>
              <Link
                href={`/materiais?modalidade=${tipo}`}
                className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
              >
                Ver Todos
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
