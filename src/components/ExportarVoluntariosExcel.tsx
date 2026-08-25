"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { hojeISO } from "@/lib/utils";
import type { Voluntario } from "@/lib/types";

function formatarDataPtBr(data: string | null) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

function escaparCampo(valor: string) {
  if (/[;"\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

type ExportarVoluntariosExcelProps = {
  voluntarios: Voluntario[];
};

export function ExportarVoluntariosExcel({ voluntarios }: ExportarVoluntariosExcelProps) {
  const [mensagem, setMensagem] = useState<string | null>(null);

  function exportar() {
    const cabecalho = [
      "Nome",
      "Telefone",
      "E-mail",
      "Data de nascimento",
      "Organizador",
      "Ativo",
    ];
    const linhas = voluntarios.map((v) => [
      v.nome,
      v.telefone,
      v.email,
      formatarDataPtBr(v.data_nascimento),
      v.eh_organizador ? "Sim" : "Não",
      v.ativo ? "Sim" : "Não",
    ]);

    // Delimitador ";" e BOM UTF-8 porque é assim que o Excel em português
    // do Brasil abre um CSV corretamente (colunas separadas e acentos
    // certos), sem precisar de nenhuma biblioteca externa.
    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((campo) => escaparCampo(String(campo))).join(";"))
      .join("\r\n");

    const nomeArquivo = `voluntarios-${hojeISO()}.csv`;
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // O navegador não expõe o caminho completo do disco por segurança —
    // o máximo que dá para informar com certeza é o nome do arquivo e que
    // ele foi para a pasta de downloads padrão configurada no navegador.
    setMensagem(
      `Arquivo "${nomeArquivo}" salvo na pasta de downloads padrão do seu navegador.`
    );
  }

  return (
    <div className="relative">
      <button
        onClick={exportar}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
      >
        <FileSpreadsheet size={16} />
        Excel
      </button>

      {mensagem && (
        <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-md bg-success/10 px-3 py-2 text-xs text-success shadow-sm">
          {mensagem}
          <button
            onClick={() => setMensagem(null)}
            className="ml-2 font-medium underline"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
