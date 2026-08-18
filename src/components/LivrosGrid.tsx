"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Livro } from "@/lib/types";

type LivroComUso = Livro & { temAgendamentos: boolean };

type LivrosGridProps = {
  livros: LivroComUso[];
  ehOrganizador: boolean;
};

export function LivrosGrid({ livros, ehOrganizador }: LivrosGridProps) {
  const [lista, setLista] = useState(livros);
  const [alvo, setAlvo] = useState<LivroComUso | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmarExclusao() {
    if (!alvo) return;
    setCarregando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase.from("livros").delete().eq("id", alvo.id);

    setCarregando(false);

    if (error) {
      setErro("Não foi possível excluir o livro. Tente novamente.");
      return;
    }

    setLista((atual) => atual.filter((l) => l.id !== alvo.id));
    setAlvo(null);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lista.map((livro) => (
          <div key={livro.id} className="flex flex-col rounded-xl bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-primary" />
                <h3 className="font-semibold text-text-main">{livro.nome}</h3>
              </div>
              {ehOrganizador && (
                <div className="flex items-center gap-2">
                  <Link
                    href={`/livros/${livro.id}/editar`}
                    className="text-text-main/50 hover:text-primary"
                    aria-label="Editar"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button
                    onClick={() => setAlvo(livro)}
                    disabled={livro.temAgendamentos}
                    title={
                      livro.temAgendamentos
                        ? "Não é possível excluir: há agendamentos vinculados"
                        : "Excluir"
                    }
                    className="text-text-main/50 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm text-text-main/60">{livro.autor}</p>
            {livro.capitulos && (
              <p className="mt-3 line-clamp-3 text-sm text-text-main/70">
                {livro.capitulos.slice(0, 100)}
                {livro.capitulos.length > 100 ? "..." : ""}
              </p>
            )}
          </div>
        ))}
        {lista.length === 0 && (
          <p className="col-span-full py-6 text-center text-text-main/50">
            Nenhum livro cadastrado.
          </p>
        )}
      </div>

      <ConfirmModal
        aberto={Boolean(alvo)}
        titulo="Excluir livro"
        descricao={`Tem certeza que deseja excluir "${alvo?.nome}"? Esta ação não pode ser desfeita.`}
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
