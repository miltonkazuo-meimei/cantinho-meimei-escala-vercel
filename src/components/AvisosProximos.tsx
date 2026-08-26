"use client";

import { useEffect, useState } from "react";
import { Cake, Mic2, X } from "lucide-react";
import { hojeISO, adicionarDiasISO } from "@/lib/utils";

type Aniversariante = { id: string; nome: string; data: string };

type ApresentacaoProxima = {
  id: string;
  data: string;
  tema: string;
  abertura: string | null;
  apresentacao: string | null;
};

type Aviso = {
  id: string;
  data: string;
  texto: string;
  Icone: typeof Cake;
};

type AvisosProximosProps = {
  aniversariantes: Aniversariante[];
  apresentacoes: ApresentacaoProxima[];
};

function formatarDataPtBr(data: string) {
  const [, mes, dia] = data.split("-");
  return `${dia}/${mes}`;
}

function rotuloData(data: string, hoje: string, amanha: string) {
  if (data === hoje) return "hoje";
  if (data === amanha) return "amanhã";
  return `dia ${formatarDataPtBr(data)}`;
}

const CHAVE_STORAGE = "avisos_dispensados";

// A dispensa vale só para o dia em que foi clicada — no dia seguinte o
// aviso volta a aparecer (se o evento ainda estiver dentro da janela de
// antecedência), até o dia do evento em si.
function lerDispensadosHoje(hoje: string): Set<string> {
  try {
    const bruto = window.localStorage.getItem(CHAVE_STORAGE);
    if (!bruto) return new Set();
    const mapa = JSON.parse(bruto) as Record<string, string[]>;
    return new Set(mapa[hoje] ?? []);
  } catch {
    return new Set();
  }
}

function salvarDispensado(hoje: string, id: string) {
  try {
    const bruto = window.localStorage.getItem(CHAVE_STORAGE);
    const mapa = bruto ? (JSON.parse(bruto) as Record<string, string[]>) : {};
    const dispensadosHoje = new Set(mapa[hoje] ?? []);
    dispensadosHoje.add(id);
    // guarda só o dia de hoje — dispensas de dias anteriores não servem
    // mais para nada, não precisam se acumular no localStorage.
    window.localStorage.setItem(
      CHAVE_STORAGE,
      JSON.stringify({ [hoje]: [...dispensadosHoje] })
    );
  } catch {
    // localStorage indisponível (ex: modo privado) — a dispensa dura só a navegação atual
  }
}

export function AvisosProximos({ aniversariantes, apresentacoes }: AvisosProximosProps) {
  const [dispensados, setDispensados] = useState<Set<string> | null>(null);

  useEffect(() => {
    // Lido só depois de montar (não no server) para não divergir do HTML
    // renderizado no SSR — localStorage não existe no servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDispensados(lerDispensadosHoje(hojeISO()));
  }, []);

  if (dispensados === null) return null;

  const hoje = hojeISO();
  const amanha = adicionarDiasISO(hoje, 1);

  const avisos: Aviso[] = [
    ...aniversariantes.map((v) => ({
      id: `aniversario-${v.id}-${v.data}`,
      data: v.data,
      texto: `Aniversário de ${v.nome} ${rotuloData(v.data, hoje, amanha)}.`,
      Icone: Cake,
    })),
    ...apresentacoes.map((a) => {
      const pessoas = [a.abertura, a.apresentacao].filter(Boolean).join(" e ");
      return {
        id: `apresentacao-${a.id}-${a.data}`,
        data: a.data,
        texto: pessoas
          ? `Apresentação ${rotuloData(a.data, hoje, amanha)}: ${a.tema} (${pessoas}).`
          : `Apresentação ${rotuloData(a.data, hoje, amanha)}: ${a.tema}.`,
        Icone: Mic2,
      };
    }),
  ]
    .filter((aviso) => !dispensados.has(aviso.id))
    .sort((a, b) => a.data.localeCompare(b.data));

  if (avisos.length === 0) return null;

  function dispensar(id: string) {
    salvarDispensado(hoje, id);
    setDispensados((atual) => new Set([...(atual ?? []), id]));
  }

  return (
    <div className="border-b border-black/10 bg-primary/5">
      <div className="mx-auto max-w-6xl divide-y divide-black/10 px-4">
        {avisos.map(({ id, texto, Icone }) => (
          <div key={id} className="flex items-center gap-3 py-2.5 text-sm text-text-main">
            <Icone size={18} className="shrink-0 text-primary" />
            <p className="flex-1">{texto}</p>
            <button
              onClick={() => dispensar(id)}
              className="shrink-0 text-text-main/50 hover:text-text-main"
              aria-label="Dispensar aviso"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
