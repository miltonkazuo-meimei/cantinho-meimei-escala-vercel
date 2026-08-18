import { NextResponse, type NextRequest } from "next/server";
import { autenticado, respostaNaoAutorizada, AGENDAMENTO_RELACOES } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!autenticado(request)) return respostaNaoAutorizada();

  const { id } = await params;
  const body = await request.json().catch(() => ({}) as { motivo?: string });
  const motivo = body?.motivo?.trim();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agendamentos")
    .update({
      status: "cancelado",
      observacoes: motivo ? `Cancelado: ${motivo}` : "Cancelado sem motivo informado",
    })
    .eq("id", id)
    .select(AGENDAMENTO_RELACOES)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ agendamento: data });
}
