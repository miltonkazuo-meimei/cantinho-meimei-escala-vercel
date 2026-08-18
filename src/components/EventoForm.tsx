"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Save, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { gerarId } from "@/lib/utils";

const eventoSchema = z.object({
  data: z.string().min(1, "A data é obrigatória"),
  descricao: z.string().min(1, "A descrição é obrigatória"),
});

type EventoFormValues = z.infer<typeof eventoSchema>;

type EventoFormProps = {
  modo: "novo" | "editar";
  eventoId?: string;
  valoresIniciais?: Partial<EventoFormValues>;
  fotosIniciais?: string[];
};

export function EventoForm({
  modo,
  eventoId,
  valoresIniciais,
  fotosIniciais = [],
}: EventoFormProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [fotosExistentes, setFotosExistentes] = useState(fotosIniciais);
  const [fotosRemovidas, setFotosRemovidas] = useState<string[]>([]);
  const [fotosNovas, setFotosNovas] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EventoFormValues>({
    resolver: zodResolver(eventoSchema),
    defaultValues: { data: "", descricao: "", ...valoresIniciais },
  });

  function removerFotoExistente(caminho: string) {
    setFotosExistentes((atual) => atual.filter((f) => f !== caminho));
    setFotosRemovidas((atual) => [...atual, caminho]);
  }

  async function onSubmit(valores: EventoFormValues) {
    setErroServidor(null);
    setEnviando(true);

    if (fotosRemovidas.length > 0) {
      const { error: erroRemover } = await supabase.storage
        .from("eventos-fotos")
        .remove(fotosRemovidas);

      if (erroRemover) {
        setEnviando(false);
        setErroServidor("Não foi possível remover as fotos excluídas. Tente novamente.");
        return;
      }
    }

    const caminhosNovos: string[] = [];
    for (const foto of fotosNovas) {
      const caminho = `${gerarId()}-${foto.name}`;
      const { data: upload, error: erroUpload } = await supabase.storage
        .from("eventos-fotos")
        .upload(caminho, foto);

      if (erroUpload) {
        setEnviando(false);
        setErroServidor("Não foi possível enviar as fotos. Tente novamente.");
        return;
      }
      caminhosNovos.push(upload.path);
    }

    const fotos = [...fotosExistentes, ...caminhosNovos];
    const payload = {
      data: valores.data,
      descricao: valores.descricao,
      fotos: fotos.length > 0 ? fotos : null,
    };

    const { error } =
      modo === "novo"
        ? await supabase.from("eventos").insert(payload)
        : await supabase.from("eventos").update(payload).eq("id", eventoId!);

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

        {fotosExistentes.length > 0 && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {fotosExistentes.map((caminho) => {
              const url = supabase.storage.from("eventos-fotos").getPublicUrl(caminho).data
                .publicUrl;
              return (
                <div key={caminho} className="group relative aspect-video overflow-hidden rounded-md bg-black/5">
                  <Image src={url} alt="" fill className="object-cover" sizes="150px" />
                  <button
                    type="button"
                    onClick={() => removerFotoExistente(caminho)}
                    aria-label="Remover foto"
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-danger"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <input
          id="fotos"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setFotosNovas(Array.from(e.target.files ?? []))}
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
