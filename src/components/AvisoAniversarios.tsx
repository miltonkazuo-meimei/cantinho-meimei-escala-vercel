"use client";

import { useState } from "react";
import { Cake, X } from "lucide-react";

export function AvisoAniversarios({ nomes }: { nomes: string[] }) {
  const [dispensado, setDispensado] = useState(false);

  if (nomes.length === 0 || dispensado) return null;

  const texto =
    nomes.length === 1
      ? `Amanhã é aniversário de ${nomes[0]}.`
      : `Amanhã é aniversário de ${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}.`;

  return (
    <div className="border-b border-black/10 bg-primary/5">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm text-text-main">
        <Cake size={18} className="shrink-0 text-primary" />
        <p className="flex-1">{texto}</p>
        <button
          onClick={() => setDispensado(true)}
          className="shrink-0 text-text-main/50 hover:text-text-main"
          aria-label="Dispensar aviso"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
