"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { gerarId } from "@/lib/utils";

const eventoSchema = z.object({
  data: z.string().min(1, "A data é obrigatória"),
  descricao: z.string().min(1, "A descrição é obrigatória"),
});

type EventoFormValues = z.infer<typeof eventoSchema>;

export function EventoForm() {
  const router = useRouter();
  const [fotos, setFotos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
    defaultValues: { data: "", descricao: "" },
  });

  async function onSubmit(valores: EventoFormValues) {
    setErroServidor(null);
    setEnviando(true);
    const supabase = createClient();

    const caminhos: string[] = [];
    for (const foto of fotos) {
      const caminho = `${gerarId()}-${foto.name}`;
      const { data: upload, error: erroUpload } = await supabase.storage
        .from("eventos-fotos")
        .upload(caminho, foto);

      if (erroUpload) {
        setEnviando(false);
        setErroServidor("Não foi possível enviar as fotos. Tente novamente.");
        return;
      }
      caminhos.push(upload.path);
    }

    const { error } = await supabase.from("eventos").insert({
      data: valores.data,
      descricao: valores.descricao,
      fotos: caminhos.length > 0 ? caminhos : null,
    });

    setEnviando(false);

    if (error) {
      setErroServidor("Não foi possível salvar o evento. Tente novamente.");
      return;
    }

    router.push("/eventos");
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

      <div>
        <label htmlFor="descricao" className="mb-1 block text-sm font-medium text-text-main">
          Descrição <span className="text-danger">*</span>
        </label>
        <textarea
          id="descricao"
          rows={4}
          {...register("descricao")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.descricao && (
          <p className="mt-1 text-xs text-danger">{errors.descricao.message}</p>
        )}
      </div>

      <div className="rounded-md border border-dashed border-black/20 p-4">
        <label htmlFor="fotos" className="mb-1 block text-sm font-medium text-text-main">
          Fotos (proporção recomendada 16:9, 1200×800 px)
        </label>
        <input
          id="fotos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFotos(Array.from(e.target.files ?? []))}
          className="w-full text-sm"
        />
      </div>

      {erroServidor && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erroServidor}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/eventos")}
          className="rounded-md px-4 py-2 text-sm font-medium text-text-main/70 hover:bg-black/5"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={16} />
          {enviando ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
