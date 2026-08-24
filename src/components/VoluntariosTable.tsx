"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Pencil, Power } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { Voluntario } from "@/lib/types";

function formatarDataPtBr(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

type VoluntariosTableProps = {
  voluntarios: Voluntario[];
  ehOrganizador: boolean;
};

export function VoluntariosTable({ voluntarios, ehOrganizador }: VoluntariosTableProps) {
  const [lista, setLista] = useState(voluntarios);
  const [alvo, setAlvo] = useState<Voluntario | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function confirmarAlternarAtivo() {
    if (!alvo) return;
    setCarregando(true);
    setErro(null);

    const supabase = createClient();
    const { error } = await supabase
      .from("voluntarios")
      .update({ ativo: !alvo.ativo })
      .eq("id", alvo.id);

    setCarregando(false);

    if (error) {
      setErro("Não foi possível atualizar o voluntário. Tente novamente.");
      return;
    }

    setLista((atual) =>
      atual.map((v) => (v.id === alvo.id ? { ...v, ativo: !alvo.ativo } : v))
    );
    setAlvo(null);
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl bg-card shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 text-text-main/60">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Telefone</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Nascimento</th>
              <th className="px-4 py-3 font-medium">Organizador</th>
              <th className="px-4 py-3 font-medium">Ativo</th>
              {ehOrganizador && <th className="px-4 py-3 font-medium">Ações</th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((v) => (
              <tr key={v.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 text-text-main">{v.nome}</td>
                <td className="px-4 py-3 text-text-main/80">{v.telefone}</td>
                <td className="px-4 py-3 text-text-main/80">{v.email}</td>
                <td className="px-4 py-3 text-text-main/80">
                  {v.data_nascimento ? formatarDataPtBr(v.data_nascimento) : "—"}
                </td>
                <td className="px-4 py-3">
                  {v.eh_organizador && (
                    <ShieldCheck size={18} className="text-success" aria-label="Organizador" />
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      v.ativo ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {v.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                {ehOrganizador && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/voluntarios/${v.id}/editar`}
                        className="text-text-main/60 hover:text-primary"
                        aria-label="Editar"
                      >
                        <Pencil size={16} />
                      </Link>
                      <button
                        onClick={() => setAlvo(v)}
                        className="text-text-main/60 hover:text-danger"
                        aria-label={v.ativo ? "Inativar" : "Ativar"}
                      >
                        <Power size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={ehOrganizador ? 7 : 6} className="px-4 py-6 text-center text-text-main/50">
                  Nenhum voluntário cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        aberto={Boolean(alvo)}
        titulo={alvo?.ativo ? "Inativar voluntário" : "Ativar voluntário"}
        descricao={
          alvo?.ativo
            ? `${alvo?.nome} não poderá mais ser selecionado em novos agendamentos.`
            : `${alvo?.nome} voltará a ficar disponível para agendamentos.`
        }
        confirmarLabel={alvo?.ativo ? "Inativar" : "Ativar"}
        destrutivo={Boolean(alvo?.ativo)}
        carregando={carregando}
        erro={erro}
        onConfirmar={confirmarAlternarAtivo}
        onCancelar={() => {
          setAlvo(null);
          setErro(null);
        }}
      />
    </>
  );
}
