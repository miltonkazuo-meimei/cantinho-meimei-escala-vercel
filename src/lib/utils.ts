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
