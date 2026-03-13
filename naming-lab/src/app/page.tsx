"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  brand: "Marca", product: "Produto", saas: "SaaS",
  character: "Personagem", place: "Lugar", title: "Título", "product-line": "Linha",
};

function ProjectCard({
  project,
  onDelete,
}: {
  project: Project & { decision?: { chosenName: string } | null };
  onDelete: (id: string) => void;
}) {
  const chosen = (project as any).decision?.chosenName;
  const count = (project as any)._count?.candidates ?? 0;
  const typeLabel = TYPE_LABELS[project.type] ?? project.type;
  const date = new Date(project.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div className="surface rounded-xl p-5 flex flex-col gap-3 hover:shadow-[0_4px_24px_rgba(42,82,49,0.08)] transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-forest-600 bg-forest-50 px-2.5 py-0.5 rounded-full">
              {typeLabel}
            </span>
            {project.isFavorite && <span className="text-oak-400 text-xs">★</span>}
          </div>
          <h3 className="font-bold text-charcoal-700 text-base leading-tight tracking-tight">{project.name}</h3>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
          className="opacity-0 group-hover:opacity-100 text-charcoal-300 hover:text-red-500 transition text-xl leading-none mt-0.5"
          title="Excluir"
        >×</button>
      </div>

      {project.context && (
        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#8A8478" }}>{project.context}</p>
      )}

      <div className="mt-auto pt-2.5 border-t border-[#EDE8DF]">
        <div className="flex items-center justify-between text-xs mb-3" style={{ color: "#A8A49B" }}>
          <span>{count} candidato{count !== 1 ? "s" : ""}</span>
          {chosen && (
            <span className="font-semibold text-forest-600">✓ {chosen}</span>
          )}
          <span>{date}</span>
        </div>
        <Link href={`/projects/${project.id}`} className="btn-primary justify-center text-center w-full text-xs py-1.5">
          Abrir workspace
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async (q = "") => {
    setLoading(true);
    const res = await fetch(`/api/projects?q=${encodeURIComponent(q)}`);
    setProjects(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir projeto permanentemente?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects(query);
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchProjects(query); };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F4F0E8" }}>
      {/* Header */}
      <header className="border-b border-[#E0D8CA] bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#F4F0E8] font-black text-sm" style={{ backgroundColor: "#2A5231" }}>
              N
            </div>
            <div>
              <span className="font-black text-charcoal-700 tracking-tight text-base">Naming Lab</span>
              <span className="hidden sm:inline text-xs ml-2 font-medium" style={{ color: "#BEA882" }}>workspace</span>
            </div>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-sm">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar projetos..." className="input" />
          </form>
          <Link href="/projects/new" className="btn-primary whitespace-nowrap">
            + Novo projeto
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-10 w-full flex-1">
        {/* Page header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="section-label mb-1">Dashboard</p>
            <h1 className="text-3xl font-black tracking-tight text-charcoal-700">Projetos</h1>
          </div>
          <p className="text-sm" style={{ color: "#8A8478" }}>
            {projects.length} projeto{projects.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="surface rounded-xl p-5 h-52 animate-pulse" style={{ backgroundColor: "#EDE8DF" }} />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-28" style={{ color: "#B8B0A0" }}>
            <div className="text-6xl mb-5 font-black text-[#D8D0C0]">N</div>
            <p className="text-lg font-bold mb-2 text-charcoal-400">Nenhum projeto ainda</p>
            <p className="text-sm mb-8">Crie seu primeiro workspace de naming</p>
            <Link href="/projects/new" className="btn-primary">
              Criar projeto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E0D8CA] py-4">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-xs" style={{ color: "#B8B0A0" }}>Naming Lab · Workspace estratégico de naming</p>
        </div>
      </footer>
    </div>
  );
}
