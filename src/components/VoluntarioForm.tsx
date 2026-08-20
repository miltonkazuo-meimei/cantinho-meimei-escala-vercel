"use client";

import { useState } from "react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Save, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { criarVoluntario } from "@/lib/actions/voluntarios";
import { ToggleField } from "@/components/ToggleField";

const voluntarioSchema = z
  .object({
    nome: z.string().min(1, "O nome é obrigatório"),
    telefone: z.string().min(1, "O telefone é obrigatório"),
    email: z.string().min(1, "O e-mail é obrigatório").email("Informe um e-mail válido"),
    modoSenha: z.enum(["convite", "manual"]).optional(),
    senha: z.string().optional(),
    eh_organizador: z.boolean(),
    ativo: z.boolean(),
  })
  .superRefine((dados, ctx) => {
    if (dados.modoSenha === "manual" && (dados.senha ?? "").length < 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["senha"],
        message: "A senha deve ter pelo menos 6 caracteres",
      });
    }
  });

type VoluntarioFormValues = z.infer<typeof voluntarioSchema>;

type VoluntarioFormProps = {
  modo: "novo" | "editar";
  voluntarioId?: string;
  valoresIniciais?: Partial<VoluntarioFormValues>;
};

export function VoluntarioForm({ modo, voluntarioId, valoresIniciais }: VoluntarioFormProps) {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VoluntarioFormValues>({
    resolver: zodResolver(voluntarioSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      modoSenha: "convite",
      senha: "",
      eh_organizador: false,
      ativo: true,
      ...valoresIniciais,
    },
  });

  const modoSenha = useWatch({ control, name: "modoSenha" });

  async function onSubmit(valores: VoluntarioFormValues) {
    setErroServidor(null);

    if (modo === "novo") {
      const { error } = await criarVoluntario({
        nome: valores.nome,
        telefone: valores.telefone,
        email: valores.email,
        eh_organizador: valores.eh_organizador,
        ativo: valores.ativo,
        senha: valores.modoSenha === "manual" ? valores.senha : undefined,
      });

      if (error) {
        setErroServidor(error);
        return;
      }
    } else {
      const supabase = createClient();
      const { error } = await supabase
        .from("voluntarios")
        .update({
          nome: valores.nome,
          telefone: valores.telefone,
          email: valores.email,
          eh_organizador: valores.eh_organizador,
          ativo: valores.ativo,
        })
        .eq("id", voluntarioId!);

      if (error) {
        if (error.code === "23505") {
          setErroServidor("Já existe um voluntário com este e-mail.");
        } else {
          setErroServidor("Não foi possível salvar o voluntário. Tente novamente.");
        }
        return;
      }
    }

    router.push("/voluntarios");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="nome" className="mb-1 block text-sm font-medium text-text-main">
          Nome <span className="text-danger">*</span>
        </label>
        <input
          id="nome"
          type="text"
          {...register("nome")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.nome && <p className="mt-1 text-xs text-danger">{errors.nome.message}</p>}
      </div>

      <div>
        <label htmlFor="telefone" className="mb-1 block text-sm font-medium text-text-main">
          Telefone <span className="text-danger">*</span>
        </label>
        <input
          id="telefone"
          type="tel"
          {...register("telefone")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="(00) 00000-0000"
        />
        {errors.telefone && (
          <p className="mt-1 text-xs text-danger">{errors.telefone.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-text-main">
          E-mail <span className="text-danger">*</span>
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
      </div>

      {modo === "novo" && (
        <div>
          <label className="mb-2 block text-sm font-medium text-text-main">
            Como o voluntário vai acessar?
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
            <label className="flex items-center gap-2 text-sm text-text-main">
              <input
                type="radio"
                value="convite"
                {...register("modoSenha")}
                className="h-4 w-4 accent-primary"
              />
              Enviar convite por e-mail
            </label>
            <label className="flex items-center gap-2 text-sm text-text-main">
              <input
                type="radio"
                value="manual"
                {...register("modoSenha")}
                className="h-4 w-4 accent-primary"
              />
              Definir senha agora
            </label>
          </div>

          {modoSenha === "manual" ? (
            <div className="mt-3">
              <label htmlFor="senha" className="mb-1 block text-sm font-medium text-text-main">
                Senha <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-main/40"
                />
                <input
                  id="senha"
                  type="password"
                  autoComplete="new-password"
                  {...register("senha")}
                  className="w-full rounded-md border border-black/15 py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-text-main/50">
                Compartilhe esta senha com o voluntário por outro meio (WhatsApp, por exemplo).
              </p>
              {errors.senha && (
                <p className="mt-1 text-xs text-danger">{errors.senha.message}</p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-xs text-text-main/50">
              O voluntário receberá um e-mail de boas-vindas para criar a própria senha e
              acessar o sistema.
            </p>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="eh_organizador"
          render={({ field }) => (
            <ToggleField
              label="Organizador"
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="ativo"
          render={({ field }) => (
            <ToggleField label="Ativo" checked={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      {erroServidor && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erroServidor}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/voluntarios")}
          className="rounded-md px-4 py-2 text-sm font-medium text-text-main/70 hover:bg-black/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={16} />
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
