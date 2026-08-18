import Link from "next/link";
import Image from "next/image";
import { Plus, PartyPopper } from "lucide-react";
import { getPerfil } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function formatarDataPtBr(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default async function EventosPage() {
  const perfil = await getPerfil();
  const supabase = await createClient();
  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .order("data", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-text-main">Eventos</h1>
          <p className="text-sm text-text-main/60">Registros de eventos realizados.</p>
        </div>
        {perfil.ehOrganizador && (
          <Link
            href="/eventos/novo"
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            <Plus size={16} />
            Novo Evento
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(eventos ?? []).map((evento) => {
          const primeiraFoto = evento.fotos?.[0]
            ? supabase.storage.from("eventos-fotos").getPublicUrl(evento.fotos[0]).data
                .publicUrl
            : null;

          return (
            <div key={evento.id} className="overflow-hidden rounded-xl bg-card shadow-sm">
              <div className="relative aspect-video w-full bg-black/5">
                {primeiraFoto ? (
                  <Image
                    src={primeiraFoto}
                    alt={evento.descricao}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-main/30">
                    <PartyPopper size={32} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-primary">
                  {formatarDataPtBr(evento.data)}
                </p>
                <p className="mt-1 text-sm text-text-main/80">{evento.descricao}</p>
              </div>
            </div>
          );
        })}
        {(eventos ?? []).length === 0 && (
          <p className="col-span-full py-6 text-center text-text-main/50">
            Nenhum evento cadastrado.
          </p>
        )}
      </div>
    </div>
  );
}
