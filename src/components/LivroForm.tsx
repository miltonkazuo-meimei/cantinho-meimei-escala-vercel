"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const livroSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório"),
  autor: z.string().min(1, "O autor é obrigatório"),
  capitulos: z.string(),
});

type LivroFormValues = z.infer<typeof livroSchema>;

type LivroFormProps = {
  modo: "novo" | "editar";
  livroId?: string;
  valoresIniciais?: Partial<LivroFormValues>;
};

export function LivroForm({ modo, livroId, valoresIniciais }: LivroFormProps) {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LivroFormValues>({
    resolver: zodResolver(livroSchema),
    defaultValues: { nome: "", autor: "", capitulos: "", ...valoresIniciais },
  });

  async function onSubmit(valores: LivroFormValues) {
    setErroServidor(null);
    const supabase = createClient();

    const payload = {
      nome: valores.nome,
      autor: valores.autor,
      capitulos: valores.capitulos || null,
    };

    const { error } =
      modo === "novo"
        ? await supabase.from("livros").insert(payload)
        : await supabase.from("livros").update(payload).eq("id", livroId!);

    if (error) {
      setErroServidor("Não foi possível salvar o livro. Tente novamente.");
      return;
    }

    router.push("/livros");
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
        <label htmlFor="autor" className="mb-1 block text-sm font-medium text-text-main">
          Autor <span className="text-danger">*</span>
        </label>
        <input
          id="autor"
          type="text"
          {...register("autor")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.autor && <p className="mt-1 text-xs text-danger">{errors.autor.message}</p>}
      </div>

      <div>
        <label htmlFor="capitulos" className="mb-1 block text-sm font-medium text-text-main">
          Capítulos
        </label>
        <textarea
          id="capitulos"
          rows={6}
          {...register("capitulos")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          placeholder="Liste os capítulos do livro..."
        />
      </div>

      {erroServidor && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erroServidor}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/livros")}
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
