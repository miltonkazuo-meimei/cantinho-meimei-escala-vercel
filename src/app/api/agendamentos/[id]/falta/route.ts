import { NextResponse, type NextRequest } from "next/server";
import { autenticado, respostaNaoAutorizada, AGENDAMENTO_RELACOES } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!autenticado(request)) return respostaNaoAutorizada();

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const tipo = body?.tipo;

  if (tipo !== "abertura" && tipo !== "apresentacao") {
    return NextResponse.json(
      { erro: 'Informe "tipo" como "abertura" ou "apresentacao".' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agendamentos")
    .update({ status: tipo === "abertura" ? "falta_abertura" : "falta_apresentacao" })
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
