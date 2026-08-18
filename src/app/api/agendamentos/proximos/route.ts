import { NextResponse, type NextRequest } from "next/server";
import { autenticado, respostaNaoAutorizada, AGENDAMENTO_RELACOES } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

function toIsoDate(date: Date) {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export async function GET(request: NextRequest) {
  if (!autenticado(request)) return respostaNaoAutorizada();

  const dias = Number(request.nextUrl.searchParams.get("dias") ?? "3");
  if (!Number.isFinite(dias) || dias < 0) {
    return NextResponse.json({ erro: 'Parâmetro "dias" inválido.' }, { status: 400 });
  }

  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() + dias);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agendamentos")
    .select(AGENDAMENTO_RELACOES)
    .gte("data", toIsoDate(hoje))
    .lte("data", toIsoDate(limite))
    .eq("status", "agendado")
    .order("data", { ascending: true });

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ agendamentos: data });
}
