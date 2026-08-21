"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { gerarId, sanitizarNomeArquivo } from "@/lib/utils";

const materialSchema = z.object({
  titulo: z.string().min(1, "O título é obrigatório"),
  tipo: z.enum(["livros", "videos", "apresentacoes", "normas", "audios", "outros"], {
    error: "Selecione a modalidade do material",
  }),
  url_link: z.string(),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

export function MaterialForm() {
  const router = useRouter();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { titulo: "", tipo: "livros", url_link: "" },
  });

  async function onSubmit(valores: MaterialFormValues) {
    setErroServidor(null);

    if (!arquivo && !valores.url_link.trim()) {
      setErroServidor("Envie um arquivo ou informe um link externo.");
      return;
    }

    setEnviando(true);
    const supabase = createClient();

    let url_arquivo: string | null = null;
    const url_link: string | null = valores.url_link.trim() || null;

    if (arquivo) {
      const caminho = `${gerarId()}-${sanitizarNomeArquivo(arquivo.name)}`;
      const { data: upload, error: erroUpload } = await supabase.storage
        .from("materiais-apoio")
        .upload(caminho, arquivo);

      if (erroUpload) {
        setEnviando(false);
        setErroServidor("Não foi possível enviar o arquivo. Tente novamente.");
        return;
      }
      url_arquivo = upload.path;
    }

    const { error } = await supabase.from("materiais_apoio").insert({
      titulo: valores.titulo,
      tipo: valores.tipo,
      url_arquivo,
      url_link,
    });

    setEnviando(false);

    if (error) {
      setErroServidor("Não foi possível salvar o material. Tente novamente.");
      return;
    }

    router.push("/materiais");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="titulo" className="mb-1 block text-sm font-medium text-text-main">
          Título <span className="text-danger">*</span>
        </label>
        <input
          id="titulo"
          type="text"
          {...register("titulo")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        {errors.titulo && <p className="mt-1 text-xs text-danger">{errors.titulo.message}</p>}
      </div>

      <div>
        <label htmlFor="tipo" className="mb-1 block text-sm font-medium text-text-main">
          Modalidade <span className="text-danger">*</span>
        </label>
        <select
          id="tipo"
          {...register("tipo")}
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="livros">Livros</option>
          <option value="videos">Vídeos</option>
          <option value="apresentacoes">Apresentações</option>
          <option value="normas">Normas</option>
          <option value="audios">Áudios</option>
          <option value="outros">Outros</option>
        </select>
      </div>

      <div className="rounded-md border border-dashed border-black/20 p-4">
        <label htmlFor="arquivo" className="mb-1 block text-sm font-medium text-text-main">
          Arquivo
        </label>
        <input
          id="arquivo"
          type="file"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
        <p className="mt-2 text-center text-xs text-text-main/40">— ou —</p>
        <label htmlFor="url_link" className="mb-1 mt-2 block text-sm font-medium text-text-main">
          Link externo
        </label>
        <input
          id="url_link"
          type="url"
          {...register("url_link")}
          placeholder="https://..."
          className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      {erroServidor && (
        <p className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger">{erroServidor}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push("/materiais")}
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
