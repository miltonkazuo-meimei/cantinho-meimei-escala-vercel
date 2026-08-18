import type { StatusAgendamento } from "@/lib/types";

const CONFIG: Record<StatusAgendamento, { label: string; className: string }> = {
  agendado: {
    label: "Agendado",
    className: "bg-primary/10 text-primary",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-danger/10 text-danger",
  },
  falta_abertura: {
    label: "Falta na abertura",
    className: "bg-danger/10 text-danger",
  },
  falta_apresentacao: {
    label: "Falta na apresentação",
    className: "bg-danger/10 text-danger",
  },
};

export function BadgeStatus({ status }: { status: string | null }) {
  const config = CONFIG[(status ?? "agendado") as StatusAgendamento] ?? CONFIG.agendado;

  return (
    <span
      className={`inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
