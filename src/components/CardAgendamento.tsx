"use client";

import { Pencil, X } from "lucide-react";
import { BadgeStatus } from "@/components/BadgeStatus";
import type { AgendamentoComRelacoes } from "@/lib/types";

function formatarDataPtBr(data: string) {
  const [ano, mes, dia] = data.split("-");
  const dataObj = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const diaSemana = dataObj.toLocaleDateString("pt-BR", { weekday: "long" });
  return `${dia}/${mes}/${ano} (${diaSemana})`;
}

type CardAgendamentoProps = {
  agendamento: AgendamentoComRelacoes;
  ehOrganizador: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onFechar: () => void;
};

export function CardAgendamento({
  agendamento,
  ehOrganizador,
  onEditar,
  onCancelar,
  onFechar,
}: CardAgendamentoProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold capitalize text-text-main">
            {formatarDataPtBr(agendamento.data)}
          </h2>
          <button
            onClick={onFechar}
            className="text-text-main/50 hover:text-text-main"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-2">
          <BadgeStatus status={agendamento.status} />
        </div>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="font-medium text-text-main/60">Abertura</dt>
            <dd className="text-text-main">
              {agendamento.voluntario_abertura?.nome ?? "Não definido"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-text-main/60">Apresentação</dt>
            <dd className="text-text-main">
              {agendamento.voluntario_apresentacao?.nome ?? "Não definido"}
            </dd>
          </div>
          {agendamento.livro && (
            <div>
              <dt className="font-medium text-text-main/60">Livro</dt>
              <dd className="text-text-main">{agendamento.livro.nome}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-text-main/60">Tema</dt>
            <dd className="text-text-main">{agendamento.tema}</dd>
          </div>
          {agendamento.observacoes && (
            <div>
              <dt className="font-medium text-text-main/60">Observações</dt>
              <dd className="text-text-main">{agendamento.observacoes}</dd>
            </div>
          )}
        </dl>

        {ehOrganizador && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onCancelar}
              className="flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
            >
              <X size={16} />
              Cancelar
            </button>
            <button
              onClick={onEditar}
              className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
            >
              <Pencil size={16} />
              Editar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
