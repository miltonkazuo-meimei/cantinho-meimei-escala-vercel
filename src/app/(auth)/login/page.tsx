"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().min(1, "O e-mail é obrigatório").email("Informe um e-mail válido"),
  senha: z.string().min(1, "A senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

function traduzirErro(mensagem: string) {
  if (mensagem.includes("Invalid login credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (mensagem.includes("Email not confirmed")) {
    return "E-mail ainda não confirmado. Verifique sua caixa de entrada.";
  }
  return "Não foi possível entrar. Tente novamente.";
}

export default function LoginPage() {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(dados: LoginForm) {
    setErroServidor(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: dados.email,
      password: dados.senha,
    });

    if (error) {
      setErroServidor(traduzirErro(error.message));
      return;
    }

    router.push("/calendario");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-xl bg-card p-8 shadow-sm">
        <h1 className="text-center text-xl font-semibold text-text-main">
          Cantinho da Meimei
        </h1>
        <p className="mt-1 text-center text-sm text-text-main/60">
          Escala de Apresentações
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-main">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="seu@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-text-main">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              autoComplete="current-password"
              {...register("senha")}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
              placeholder="••••••••"
            />
            {errors.senha && (
              <p className="mt-1 text-xs text-danger">{errors.senha.message}</p>
            )}
          </div>

          {erroServidor && (
            <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">
              {erroServidor}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <LogIn size={18} />
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
