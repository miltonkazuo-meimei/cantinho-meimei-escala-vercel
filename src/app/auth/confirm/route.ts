import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Rota de confirmação para os links de e-mail do Supabase Auth que usam o
// fluxo PKCE (chegam como "?code=..." em vez do formato antigo "#access_
// token=..." no hash). É o padrão oficial do Supabase para @supabase/ssr:
// a troca do código pela sessão precisa acontecer no servidor, porque o
// "code_verifier" gerado ao chamar resetPasswordForEmail() só existe como
// cookie — nunca chega no #hash, então uma página client-side sozinha não
// consegue processá-lo.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL("/redefinir-senha", request.url));
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL("/redefinir-senha", request.url));
    }
  }

  // Sessão não estabelecida: manda para a mesma tela, que já sabe mostrar
  // "link inválido ou expirado" quando não encontra uma sessão válida.
  return NextResponse.redirect(new URL("/redefinir-senha", request.url));
}
