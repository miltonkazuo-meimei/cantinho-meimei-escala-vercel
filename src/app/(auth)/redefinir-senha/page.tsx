"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Lock, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((dados) => dados.senha === dados.confirmarSenha, {
    message: "As senhas não coincidem",
    path: ["confirmarSenha"],
  });

type FormValues = z.infer<typeof schema>;

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [sessaoValida, setSessaoValida] = useState<boolean | null>(null);
  const [erroServidor, setErroServidor] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const supabase = createClient();
    // O link do e-mail cria a sessão de recuperação de forma assíncrona
    // ao carregar a página; aguardamos o evento antes de liberar o formulário.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessaoValida(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessaoValida((atual) => atual ?? Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(dados: FormValues) {
    setErroServidor(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: dados.senha });

    if (error) {
      setErroServidor("Não foi possível redefinir a senha. Tente novamente.");
      return;
    }

    setSucesso(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Cantinho da Meimei"
            width={96}
            height={96}
            className="mb-4 h-24 w-24 object-contain"
            priority
          />
          <h1 className="text-xl font-bold text-text-main">Redefinir senha</h1>
          <p className="mt-1 text-sm text-text-main/60">Informe sua nova senha de acesso.</p>
        </div>

        {sucesso ? (
          <p className="rounded-md bg-success/10 px-3 py-3 text-center text-sm text-success">
            Senha redefinida com sucesso! Redirecionando para o login...
          </p>
        ) : sessaoValida === false ? (
          <p className="rounded-md bg-danger/10 px-3 py-3 text-center text-sm text-danger">
            Este link de redefinição é inválido ou expirou. Solicite um novo
            link em &quot;Esqueci minha senha&quot;.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
            <div>
              <label htmlFor="senha" className="mb-1 block text-sm font-medium text-text-main">
                Nova senha
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-main/50"
                />
                <input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  {...register("senha")}
                  className="w-full rounded-md border border-black/15 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              {errors.senha && (
                <p className="mt-1 text-xs text-danger">{errors.senha.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmarSenha"
                className="mb-1 block text-sm font-medium text-text-main"
              >
                Confirmar nova senha
              </label>
              <div className="relative">
                <KeyRound
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-main/50"
                />
                <input
                  id="confirmarSenha"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmarSenha")}
                  className="w-full rounded-md border border-black/15 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmarSenha && (
                <p className="mt-1 text-xs text-danger">{errors.confirmarSenha.message}</p>
              )}
            </div>

            {erroServidor && (
              <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
                {erroServidor}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting || sessaoValida !== true}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
