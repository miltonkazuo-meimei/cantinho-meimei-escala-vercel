"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { LogIn, Mail, Lock } from "lucide-react";
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
          <h1 className="text-xl font-bold text-text-main">Cantinho da Meimei</h1>
          <p className="mt-1 text-sm text-text-main/60">Acesso ao sistema</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-main">
              E-mail
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-main/50"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                className="w-full rounded-md border border-black/15 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                placeholder="seu@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="senha" className="mb-1 block text-sm font-medium text-text-main">
              Senha
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-main/50"
              />
              <input
                id="senha"
                type="password"
                autoComplete="current-password"
                {...register("senha")}
                className="w-full rounded-md border border-black/15 py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
                placeholder="••••••••"
              />
            </div>
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

        <div className="mt-6 text-center">
          <Link
            href="/esqueci-senha"
            className="text-sm text-primary transition-colors hover:text-primary/80"
          >
            Esqueci minha senha
          </Link>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-text-main/50">
        © {new Date().getFullYear()} Cantinho da Meimei
      </p>
    </div>
  );
}
