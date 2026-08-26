// crypto.randomUUID só existe em contexto seguro (https ou localhost);
// cai no fallback ao acessar via IP local em http (ex: teste no celular).
export function gerarId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// Chaves de objeto no Supabase Storage rejeitam acentos, espaços e outros
// caracteres fora de [a-zA-Z0-9.-] com erro "InvalidKey".
export function sanitizarNomeArquivo(nome: string): string {
  const semAcentos = nome.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  return semAcentos.replace(/[^a-zA-Z0-9.-]/g, "-");
}

export function hojeISO(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Data "de hoje" no fuso de Brasília, independente do fuso do servidor
// (funções do Vercel rodam em UTC) — evita virar o dia cedo demais perto
// da meia-noite.
export function hojeISOBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// Soma/subtrai dias a uma data YYYY-MM-DD sem depender do fuso local —
// constrói a data em UTC para o cálculo do dia não variar com o horário.
export function adicionarDiasISO(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  data.setUTCDate(data.getUTCDate() + dias);
  return data.toISOString().slice(0, 10);
}
