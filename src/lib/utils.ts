// crypto.randomUUID só existe em contexto seguro (https ou localhost);
// cai no fallback ao acessar via IP local em http (ex: teste no celular).
export function gerarId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
