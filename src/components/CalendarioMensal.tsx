"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type { DatesSetArg, DayCellContentArg } from "@fullcalendar/core";
import { createClient } from "@/lib/supabase/client";
import { CardAgendamento } from "@/components/CardAgendamento";
import { ConfirmModal } from "@/components/ConfirmModal";
import type { AgendamentoComRelacoes } from "@/lib/types";

function toIsoDate(date: Date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

type CalendarioMensalProps = {
  ehOrganizador: boolean;
};

export function CalendarioMensal({ ehOrganizador }: CalendarioMensalProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [agendamentosPorData, setAgendamentosPorData] = useState<
    Record<string, AgendamentoComRelacoes>
  >({});
  const [selecionado, setSelecionado] = useState<AgendamentoComRelacoes | null>(null);
  const [mostrarCancelar, setMostrarCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [erroCancelar, setErroCancelar] = useState<string | null>(null);

  const carregarMes = useCallback(
    async (arg: DatesSetArg) => {
      const inicio = toIsoDate(arg.view.currentStart);
      const fim = toIsoDate(arg.view.currentEnd);

      const { data, error } = await supabase
        .from("agendamentos")
        .select(
          `*,
          voluntario_abertura:voluntarios!agendamentos_voluntario_abertura_id_fkey(*),
          voluntario_apresentacao:voluntarios!agendamentos_voluntario_apresentacao_id_fkey(*),
          livro:livros(*)`
        )
        .gte("data", inicio)
        .lt("data", fim);

      if (error) {
        console.error("Erro ao carregar agendamentos", error);
        return;
      }

      const mapa: Record<string, AgendamentoComRelacoes> = {};
      for (const linha of (data ?? []) as unknown as AgendamentoComRelacoes[]) {
        mapa[linha.data] = linha;
      }
      setAgendamentosPorData(mapa);
    },
    [supabase]
  );

  function handleDateClick(dataStr: string) {
    const agendamento = agendamentosPorData[dataStr];
    if (agendamento) {
      setSelecionado(agendamento);
      return;
    }
    if (ehOrganizador) {
      router.push(`/agendamentos/novo?data=${dataStr}`);
    }
  }

  async function confirmarCancelamento(motivo?: string) {
    if (!selecionado) return;
    setCancelando(true);
    setErroCancelar(null);

    const observacoes = motivo
      ? `Cancelado: ${motivo}`
      : "Cancelado sem motivo informado";

    const { error } = await supabase
      .from("agendamentos")
      .update({ status: "cancelado", observacoes })
      .eq("id", selecionado.id);

    setCancelando(false);

    if (error) {
      setErroCancelar("Não foi possível cancelar. Tente novamente.");
      return;
    }

    setAgendamentosPorData((atual) => ({
      ...atual,
      [selecionado.data]: { ...selecionado, status: "cancelado", observacoes },
    }));
    setMostrarCancelar(false);
    setSelecionado(null);
  }

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <style>{`
        .fc-day-today { background: color-mix(in srgb, var(--color-primary) 8%, transparent) !important; }
        .fc .fc-daygrid-day-number { padding: 4px; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(0,0,0,0.08); }
        .fc-daygrid-day-frame { cursor: pointer; }
      `}</style>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={ptBrLocale}
        height="auto"
        headerToolbar={{ left: "prev,next today", center: "title", right: "" }}
        datesSet={carregarMes}
        dateClick={(info) => handleDateClick(info.dateStr)}
        dayCellContent={(arg: DayCellContentArg) => {
          const dataStr = toIsoDate(arg.date);
          const agendamento = agendamentosPorData[dataStr];
          return (
            <div className="flex h-full flex-col items-center gap-1 pt-1">
              <span>{arg.dayNumberText}</span>
              {agendamento && (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--color-primary)" }}
                />
              )}
            </div>
          );
        }}
      />

      {selecionado && (
        <CardAgendamento
          agendamento={selecionado}
          ehOrganizador={ehOrganizador}
          onFechar={() => setSelecionado(null)}
          onEditar={() => router.push(`/agendamentos/${selecionado.id}/editar`)}
          onCancelar={() => setMostrarCancelar(true)}
        />
      )}

      <ConfirmModal
        aberto={mostrarCancelar}
        titulo="Cancelar agendamento"
        descricao="Esta ação marcará o agendamento como cancelado. Informe o motivo abaixo."
        pedirMotivo
        motivoLabel="Motivo do cancelamento"
        confirmarLabel="Cancelar agendamento"
        cancelarLabel="Voltar"
        destrutivo
        carregando={cancelando}
        erro={erroCancelar}
        onConfirmar={confirmarCancelamento}
        onCancelar={() => {
          setMostrarCancelar(false);
          setErroCancelar(null);
        }}
      />
    </div>
  );
}
