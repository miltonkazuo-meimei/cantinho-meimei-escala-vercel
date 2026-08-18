import { NextResponse, type NextRequest } from "next/server";
import { autenticado, respostaNaoAutorizada, AGENDAMENTO_RELACOES } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";
import type { TablesUpdate } from "@/lib/supabase/database.types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!autenticado(request)) return respostaNaoAutorizada();

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ erro: "Corpo da requisição inválido." }, { status: 400 });
  }

  const atualizacao: TablesUpdate<"agendamentos"> = {
    ...(body.data !== undefined && { data: body.data }),
    ...(body.voluntario_abertura_id !== undefined && {
      voluntario_abertura_id: body.voluntario_abertura_id,
    }),
    ...(body.voluntario_apresentacao_id !== undefined && {
      voluntario_apresentacao_id: body.voluntario_apresentacao_id,
    }),
    ...(body.livro_id !== undefined && { livro_id: body.livro_id }),
    ...(body.tema !== undefined && { tema: body.tema }),
    ...(body.observacoes !== undefined && { observacoes: body.observacoes }),
    ...(body.status !== undefined && { status: body.status }),
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agendamentos")
    .update(atualizacao)
    .eq("id", id)
    .select(AGENDAMENTO_RELACOES)
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { erro: "Já existe um agendamento para esta data." },
        { status: 409 }
      );
    }
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ erro: "Agendamento não encontrado." }, { status: 404 });
  }

  return NextResponse.json({ agendamento: data });
}
