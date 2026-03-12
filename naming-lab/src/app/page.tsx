"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project } from "@/types";

const TYPE_LABELS: Record<string, string> = {
  brand: "Marca", product: "Produto", saas: "SaaS",
  character: "Personagem", place: "Lugar", title: "Título", "product-line": "Linha",
};

function ProjectCard({ project, onDelete }: { project: Project & { decision?: { chosenName: string } | null }; onDelete: (id: string) => void }) {
  const chosen = (project as any).decision?.chosenName;
  const count = (project as any)._count?.candidates ?? 0;
  const typeLabel = TYPE_LABELS[project.type] ?? project.type;
  const date = new Date(project.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div className="surface rounded-xl p-5 flex flex-col gap-3 hover:shadow-md transition group">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded-full">
              {typeLabel}
            </span>
            {project.isFavorite && <span className="text-amber-500 text-xs">★</span>}
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">{project.name}</h3>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onDelete(project.id); }}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition text-lg leading-none"
          title="Excluir"
        >×</button>
      </div>

      {project.context && (
        <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">{project.context}</p>
      )}

      <div className="flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 mt-auto pt-2 border-t border-slate-100 dark:border-zinc-800">
        <span>{count} candidato{count !== 1 ? "s" : ""}</span>
        {chosen && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">✓ {chosen}</span>
        )}
        <span>{date}</span>
      </div>

      <Link
        href={`/projects/${project.id}`}
        className="btn-primary justify-center text-center text-xs py-1.5"
      >
        Abrir workspace
      </Link>
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
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir projeto permanentemente?")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    fetchProjects(query);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProjects(query);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-sm">N</div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Naming Lab</span>
          </div>
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar projetos..."
              className="input"
            />
          </form>
          <Link href="/projects/new" className="btn-primary">
            + Novo projeto
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8 w-full flex-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projetos</h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
            {projects.length} projeto{projects.length !== 1 ? "s" : ""} encontrado{projects.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="surface rounded-xl p-5 h-48 animate-pulse bg-slate-100 dark:bg-zinc-800" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-24 text-slate-400 dark:text-zinc-500">
            <div className="text-5xl mb-4">◎</div>
            <p className="text-lg font-medium mb-2">Nenhum projeto ainda</p>
            <p className="text-sm mb-6">Crie seu primeiro workspace de naming</p>
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
    </div>
  );
}
