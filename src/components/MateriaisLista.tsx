"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Plus, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import { MODALIDADE_CONFIG } from "@/lib/materiais";
import type { MaterialApoio, TipoMaterial } from "@/lib/types";

function formatarDataPtBr(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

type MateriaisListaProps = {
  materiais: MaterialApoio[];
  titulo: string;
  ehOrganizador: boolean;
};

export function MateriaisLista({ materiais, titulo, ehOrganizador }: MateriaisListaProps) {
  const [busca, setBusca] = useState("");
  const [lista, setLista] = useState(materiais);
  const [alvo, setAlvo] = useState<MaterialApoio | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);

  const filtrados = lista.filter((m) =>
    m.titulo.toLowerCase().includes(busca.trim().toLowerCase())
  );

  async function acessar(material: MaterialApoio) {
    if (material.url_link) {
      window.open(material.url_link, "_blank", "noopener,noreferrer");
      return;
    }
    if (material.url_arquivo) {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("materiais-apoio")
        .createSignedUrl(material.url_arquivo, 60);

      if (!error && data) {
        window.open(data.signedUrl, "_blank", "noopener,noreferrer");
      }
    }
  }

  async function confirmarExclusao() {
    if (!alvo) return;
    setExcluindo(true);
    setErroExcluir(null);

    const supabase = createClient();

    if (alvo.url_arquivo) {
      await supabase.storage.from("materiais-apoio").remove([alvo.url_arquivo]);
    }

    const { error } = await supabase.from("materiais_apoio").delete().eq("id", alvo.id);

    setExcluindo(false);

    if (error) {
      setErroExcluir("Não foi possível excluir o material. Tente novamente.");
      return;
    }

    setLista((atual) => atual.filter((m) => m.id !== alvo.id));
    setAlvo(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/materiais"
            className="mb-1 flex items-center gap-1 text-sm text-text-main/60 hover:text-text-main"
          >
            <ArrowLeft size={14} />
            Voltar
          </Link>
          <h1 className="text-2xl font-semibold text-text-main">{titulo}</h1>
        </div>

        <div className="relative md:max-w-xs md:flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-main/40"
          />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por título..."
            className="w-full rounded-md border border-black/15 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {ehOrganizador && (
          <Link
            href="/materiais/novo"
            className="flex shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo Material
          </Link>
        )}
      </div>

      <div className="divide-y divide-black/5 rounded-xl bg-card shadow-sm">
        {filtrados.map((material) => {
          const config =
            MODALIDADE_CONFIG[material.tipo as TipoMaterial] ?? MODALIDADE_CONFIG.outros;
          const Icon = config.icon;
          return (
            <div key={material.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
                >
                  <Icon size={14} />
                  {config.label}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-text-main">{material.titulo}</p>
                  <p className="text-xs text-text-main/50">{formatarDataPtBr(material.data)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {(material.url_link || material.url_arquivo) && (
                  <button
                    onClick={() => acessar(material)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                    aria-label="Acessar material"
                  >
                    <ExternalLink size={16} />
                    Acessar
                  </button>
                )}
                {ehOrganizador && (
                  <button
                    onClick={() => setAlvo(material)}
                    className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10"
                    aria-label="Excluir material"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtrados.length === 0 && (
          <p className="px-4 py-6 text-center text-text-main/50">
            {lista.length === 0
              ? "Nenhum material de apoio cadastrado."
              : "Nenhum material encontrado para esta pesquisa."}
          </p>
        )}
      </div>

      <ConfirmModal
        aberto={Boolean(alvo)}
        titulo="Excluir material"
        descricao={`Tem certeza que deseja excluir "${alvo?.titulo}"? Esta ação não pode ser desfeita.`}
        confirmarLabel="Excluir"
        destrutivo
        carregando={excluindo}
        erro={erroExcluir}
        onConfirmar={confirmarExclusao}
        onCancelar={() => {
          setAlvo(null);
          setErroExcluir(null);
        }}
      />
    </div>
  );
}
