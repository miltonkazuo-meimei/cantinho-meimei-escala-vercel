"use client";

import { FileText, PlayCircle, Presentation, HardDrive, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MaterialApoio, TipoMaterial } from "@/lib/types";

const TIPO_CONFIG: Record<TipoMaterial, { label: string; icon: typeof FileText; className: string }> = {
  pdf: { label: "PDF", icon: FileText, className: "bg-danger/10 text-danger" },
  youtube: { label: "YouTube", icon: PlayCircle, className: "bg-danger/10 text-danger" },
  powerpoint: { label: "PowerPoint", icon: Presentation, className: "bg-primary/10 text-primary" },
  gdrive: { label: "Google Drive", icon: HardDrive, className: "bg-success/10 text-success" },
};

type MaterialComLivro = MaterialApoio & { livro: { nome: string } | null };

export function MateriaisLista({ materiais }: { materiais: MaterialComLivro[] }) {
  async function acessar(material: MaterialComLivro) {
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

  return (
    <div className="divide-y divide-black/5 rounded-xl bg-card shadow-sm">
      {materiais.map((material) => {
        const config = TIPO_CONFIG[material.tipo as TipoMaterial] ?? TIPO_CONFIG.pdf;
        const Icon = config.icon;
        return (
          <div key={material.id} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
                <Icon size={14} />
                {config.label}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-text-main">{material.titulo}</p>
                {material.livro && (
                  <p className="truncate text-xs text-text-main/50">{material.livro.nome}</p>
                )}
              </div>
            </div>
            {(material.url_link || material.url_arquivo) && (
              <button
                onClick={() => acessar(material)}
                className="flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
                aria-label="Acessar material"
              >
                <ExternalLink size={16} />
                Acessar
              </button>
            )}
          </div>
        );
      })}
      {materiais.length === 0 && (
        <p className="px-4 py-6 text-center text-text-main/50">
          Nenhum material de apoio cadastrado.
        </p>
      )}
    </div>
  );
}
