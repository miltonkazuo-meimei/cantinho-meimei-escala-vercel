import type { Tables } from "@/lib/supabase/database.types";

export type Voluntario = Tables<"voluntarios">;
export type Livro = Tables<"livros">;
export type MaterialApoio = Tables<"materiais_apoio">;
export type Evento = Tables<"eventos">;
export type AvisoEnviado = Tables<"avisos_enviados">;
export type Agendamento = Tables<"agendamentos">;

export type StatusAgendamento =
  | "agendado"
  | "cancelado"
  | "falta_abertura"
  | "falta_apresentacao";

export type TipoMaterial =
  | "livros"
  | "videos"
  | "apresentacoes"
  | "normas"
  | "audios"
  | "outros";

export type AgendamentoComRelacoes = Agendamento & {
  voluntario_abertura: Voluntario | null;
  voluntario_apresentacao: Voluntario | null;
  livro: Livro | null;
};
