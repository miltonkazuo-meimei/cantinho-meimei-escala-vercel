"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Pencil, Trash2, PartyPopper } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Evento } from "@/lib/types";

function formatarDataPtBr(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

type EventosGridProps = {
  eventos: Evento[];
  ehOrganizador: boolean;
};

export function EventosGrid({ eventos, ehOrganizador }: EventosGridProps) {
  const supabase = useMemo(() => createClient(), []);
  const [lista, setLista] = useState(eventos);
  const [alvo, setAlvo] = useState<Evento | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmarExclusao() {
    if (!alvo) return;
    setCarregando(true);
    setErro(null);

    if (alvo.fotos && alvo.fotos.length > 0) {
      const { error: erroStorage } = await supabase.storage
        .from("eventos-fotos")
        .remove(alvo.fotos);

      if (erroStorage) {
        setCarregando(false);
        setErro("Não foi possível excluir as fotos do evento. Tente novamente.");
        return;
      }
    }

    const { error } = await supabase.from("eventos").delete().eq("id", alvo.id);

    setCarregando(false);

    if (error) {
      setErro("Não foi possível excluir o evento. Tente novamente.");
      return;
    }

    setLista((atual) => atual.filter((e) => e.id !== alvo.id));
    setAlvo(null);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((evento) => {
          const primeiraFoto = evento.fotos?.[0]
            ? supabase.storage.from("eventos-fotos").getPublicUrl(evento.fotos[0]).data.publicUrl
            : null;

          return (
            <div key={evento.id} className="overflow-hidden rounded-xl bg-card shadow-sm">
              <div className="relative aspect-video w-full bg-black/5">
                {primeiraFoto ? (
                  <Image
                    src={primeiraFoto}
                    alt={evento.descricao}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-main/30">
                    <PartyPopper size={32} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-primary">
                    {formatarDataPtBr(evento.data)}
                  </p>
                  {ehOrganizador && (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/eventos/${evento.id}/editar`}
                        className="text-text-main/50 hover:text-primary"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => setAlvo(evento)}
                        className="text-text-main/50 hover:text-danger"
                        aria-label="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-text-main/80">{evento.descricao}</p>
              </div>
            </div>
          );
        })}
        {lista.length === 0 && (
          <p className="col-span-full py-6 text-center text-text-main/50">
            Nenhum evento cadastrado.
          </p>
        )}
      </div>

      <ConfirmModal
        aberto={Boolean(alvo)}
        titulo="Excluir evento"
        descricao="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        confirmarLabel="Excluir"
        destrutivo
        carregando={carregando}
        erro={erro}
        onConfirmar={confirmarExclusao}
        onCancelar={() => {
          setAlvo(null);
          setErro(null);
        }}
      />
    </>
  );
}
