"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import Link from "next/link";
import { Mail, Send, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().min(1, "O e-mail é obrigatório").email("Informe um e-mail válido"),
});

type FormValues = z.infer<typeof schema>;

export default function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(dados: FormValues) {
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(dados.email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    // Mensagem genérica sempre exibida, para não revelar se o e-mail existe.
    setEnviado(true);
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
          <h1 className="text-xl font-bold text-text-main">Esqueci minha senha</h1>
          <p className="mt-1 text-sm text-text-main/60">
            Informe seu e-mail para receber o link de redefinição.
          </p>
        </div>

        {enviado ? (
          <p className="rounded-md bg-success/10 px-3 py-3 text-center text-sm text-success">
            Se este e-mail estiver cadastrado, você receberá um link para
            redefinir sua senha em instantes.
          </p>
        ) : (
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Send size={18} />
              {isSubmitting ? "Enviando..." : "Enviar link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-primary transition-colors hover:text-primary/80"
          >
            <ArrowLeft size={14} />
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
