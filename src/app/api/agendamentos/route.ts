import { NextResponse, type NextRequest } from "next/server";
import { autenticado, respostaNaoAutorizada, AGENDAMENTO_RELACOES } from "@/lib/api-auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  if (!autenticado(request)) return respostaNaoAutorizada();

  const dataParam = request.nextUrl.searchParams.get("data");
  const supabase = createServiceClient();

  let query = supabase
    .from("agendamentos")
    .select(AGENDAMENTO_RELACOES)
    .order("data", { ascending: true });

  if (dataParam) {
    query = query.eq("data", dataParam);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ agendamentos: data });
}

export async function POST(request: NextRequest) {
  if (!autenticado(request)) return respostaNaoAutorizada();

  const body = await request.json().catch(() => null);

  if (!body?.data || !body?.tema) {
    return NextResponse.json(
      { erro: 'Os campos "data" e "tema" são obrigatórios.' },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("agendamentos")
    .insert({
      data: body.data,
      tema: body.tema,
      voluntario_abertura_id: body.voluntario_abertura_id ?? null,
      voluntario_apresentacao_id: body.voluntario_apresentacao_id ?? null,
      livro_id: body.livro_id ?? null,
      observacoes: body.observacoes ?? null,
    })
    .select(AGENDAMENTO_RELACOES)
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { erro: "Já existe um agendamento para esta data." },
        { status: 409 }
      );
    }
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ agendamento: data }, { status: 201 });
}
