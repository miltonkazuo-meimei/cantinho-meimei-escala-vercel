"use client";

import { useState } from "react";
import { X } from "lucide-react";

type ConfirmModalProps = {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  pedirMotivo?: boolean;
  motivoLabel?: string;
  destrutivo?: boolean;
  carregando?: boolean;
  erro?: string | null;
  onConfirmar: (motivo?: string) => void;
  onCancelar: () => void;
};

export function ConfirmModal({
  aberto,
  titulo,
  descricao,
  confirmarLabel = "Confirmar",
  cancelarLabel = "Cancelar",
  pedirMotivo = false,
  motivoLabel = "Motivo",
  destrutivo = false,
  carregando = false,
  erro = null,
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  const [motivo, setMotivo] = useState("");

  if (!aberto) return null;

  const motivoInvalido = pedirMotivo && motivo.trim().length === 0;

  function handleConfirmar() {
    if (motivoInvalido) return;
    onConfirmar(pedirMotivo ? motivo.trim() : undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-card p-6 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-text-main">{titulo}</h2>
          <button
            onClick={onCancelar}
            className="text-text-main/50 hover:text-text-main"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {descricao && (
          <p className="mt-2 text-sm text-text-main/70">{descricao}</p>
        )}

        {pedirMotivo && (
          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-text-main">
              {motivoLabel} <span className="text-danger">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="Descreva o motivo..."
            />
          </div>
        )}

        {erro && <p className="mt-3 text-sm text-danger">{erro}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancelar}
            disabled={carregando}
            className="rounded-md px-4 py-2 text-sm font-medium text-text-main/70 hover:bg-black/5 disabled:opacity-50"
          >
            {cancelarLabel}
          </button>
          <button
            onClick={handleConfirmar}
            disabled={carregando || motivoInvalido}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
              destrutivo ? "bg-danger hover:bg-danger/90" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {carregando ? "Aguarde..." : confirmarLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
