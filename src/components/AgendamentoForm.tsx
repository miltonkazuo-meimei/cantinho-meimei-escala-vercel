"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Voluntario, Livro } from "@/lib/types";

const agendamentoSchema = z.object({
  data: z.string().min(1, "A data é obrigatória"),
  voluntario_abertura_id: z.string(),
  voluntario_apresentacao_id: z.string(),
  livro_id: z.string(),
  tema: z.string().min(1, "O tema é obrigatório"),
  observacoes: z.string(),
});

type AgendamentoFormValues = z.infer<typeof agendamentoSchema>;

type AgendamentoFormProps = {
  modo: "novo" | "editar";
  agendamentoId?: string;
  valoresIniciais?: Partial<AgendamentoFormValues>;
  voluntarios: Voluntario[];
  livros: Livro[];
};

export function AgendamentoForm({
  modo,
  agendamentoId,
  valoresIniciais,
  voluntarios,
  livros,
}: AgendamentoFormProps) {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AgendamentoFormValues>({
    resolver: zodResolver(agendamentoSchema),
    defaultValues: {
      data: "",
      voluntario_abertura_id: "",
      voluntario_apresentacao_id: "",
      livro_id: "",
      tema: "",
      observacoes: "",
      ...valoresIniciais,
    },
  });

  async function onSubmit(valores: AgendamentoFormValues) {
    setErroServidor(null);
    const supabase = createClient();

    const payload = {
      data: valores.data,
      voluntario_abertura_id: valores.voluntario_abertura_id || null,
      voluntario_apresentacao_id: valores.voluntario_apresentacao_id || null,
      livro_id: valores.livro_id || null,
      tema: valores.tema,
      observacoes: valores.observacoes || null,
    };

    let error;

    if (modo === "novo") {
      // Só pode existir um agendamento por data. Se já houver um (ex: um
      // agendamento excluído anteriormente), o novo o substitui.
      await supabase.from("agendamentos").delete().eq("data", valores.data);
      ({ error } = await supabase.from("agendamentos").insert(payload));
    } else {
      ({ error } = await supabase
        .from("agendamentos")
        .update(payload)
        .eq("id", agendamentoId!));
    }

    if (error) {
      if (error.code === "23505") {
        setErroServidor("Já existe um agendamento para esta data.");
      } else {
        setErroServidor("Não foi possível salvar o agendamento. Tente novamente.");
      }
      return;
    }

    router.push("/calendario");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="data" className="mb-1 block text-sm font-medium text-text-main">
          Data <span className="text-danger">*</span>
        </label>
        <input
          id="data"
          type="date"
          {...register("data")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.data && <p className="mt-1 text-xs text-danger">{errors.data.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="voluntario_abertura_id"
            className="mb-1 block text-sm font-medium text-text-main"
          >
            Voluntário da abertura
          </label>
          <select
            id="voluntario_abertura_id"
            {...register("voluntario_abertura_id")}
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Selecione...</option>
            {voluntarios.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="voluntario_apresentacao_id"
            className="mb-1 block text-sm font-medium text-text-main"
          >
            Voluntário da apresentação
          </label>
          <select
            id="voluntario_apresentacao_id"
            {...register("voluntario_apresentacao_id")}
            className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Selecione...</option>
            {voluntarios.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="livro_id" className="mb-1 block text-sm font-medium text-text-main">
          Livro
        </label>
        <select
          id="livro_id"
          {...register("livro_id")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">Nenhum</option>
          {livros.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nome}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tema" className="mb-1 block text-sm font-medium text-text-main">
          Tema <span className="text-danger">*</span>
        </label>
        <input
          id="tema"
          type="text"
          {...register("tema")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="Tema da apresentação"
        />
        {errors.tema && <p className="mt-1 text-xs text-danger">{errors.tema.message}</p>}
      </div>

      <div>
        <label htmlFor="observacoes" className="mb-1 block text-sm font-medium text-text-main">
          Observações
        </label>
        <textarea
          id="observacoes"
          rows={3}
          {...register("observacoes")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {erroServidor && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erroServidor}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/calendario")}
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
