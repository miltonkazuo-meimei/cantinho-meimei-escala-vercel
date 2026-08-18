import "server-only";

import { NextResponse, type NextRequest } from "next/server";

export function autenticado(request: NextRequest): boolean {
  const cabecalho = request.headers.get("authorization");
  return cabecalho === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;
}

export function respostaNaoAutorizada() {
  return NextResponse.json({ erro: "Não autorizado." }, { status: 401 });
}

export const AGENDAMENTO_RELACOES = `*,
  voluntario_abertura:voluntarios!agendamentos_voluntario_abertura_id_fkey(*),
  voluntario_apresentacao:voluntarios!agendamentos_voluntario_apresentacao_id_fkey(*),
  livro:livros(*)`;
