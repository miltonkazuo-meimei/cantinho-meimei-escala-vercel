import {
  BookOpen,
  PlayCircle,
  Presentation,
  ClipboardList,
  Headphones,
  FolderOpen,
} from "lucide-react";
import type { TipoMaterial } from "@/lib/types";

export const MODALIDADE_CONFIG: Record<
  TipoMaterial,
  { label: string; icon: typeof BookOpen; className: string }
> = {
  livros: { label: "Livros", icon: BookOpen, className: "bg-primary/10 text-primary" },
  videos: { label: "Vídeos", icon: PlayCircle, className: "bg-danger/10 text-danger" },
  apresentacoes: {
    label: "Apresentações",
    icon: Presentation,
    className: "bg-success/10 text-success",
  },
  normas: { label: "Normas", icon: ClipboardList, className: "bg-primary/10 text-primary" },
  audios: { label: "Áudios", icon: Headphones, className: "bg-danger/10 text-danger" },
  outros: { label: "Outros", icon: FolderOpen, className: "bg-success/10 text-success" },
};
