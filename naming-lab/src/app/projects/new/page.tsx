"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const PROJECT_TYPES = [
  { value: "brand",        label: "Marca" },
  { value: "product",      label: "Produto" },
  { value: "saas",         label: "SaaS / App" },
  { value: "character",    label: "Personagem" },
  { value: "place",        label: "Lugar / Espaço" },
  { value: "title",        label: "Título / Editorial" },
  { value: "product-line", label: "Linha de Produtos" },
];

const PERSONALITY_TAGS = [
  "premium", "acessível", "tecnológico", "humano", "ousado", "sofisticado",
  "clínico", "artesanal", "inovador", "confiável", "divertido", "sério",
];

export default function NewProject() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "brand",
    context: "",
    targetAudience: "",
    market: "Brasil",
    language: "pt-BR",
    category: "",
    personality: "",
    references: "",
    restrictions: "",
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    const personalityFull = [form.personality, ...selectedTags].filter(Boolean).join(", ");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, personality: personalityFull }),
    });
    const data = await res.json();
    router.push(`/projects/${data.id}`);
  };

  return (
    <div className="min-h-screen bg-[#F4F0E8] dark:bg-[#12110E]">
      {/* Header */}
      <header className="border-b border-[#E0D8CA] dark:border-[#2E2A24] bg-white dark:bg-[#1C1A16]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="btn-ghost text-xs text-muted py-1">← Voltar</Link>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-[#2A5231] flex items-center justify-center shrink-0">
              <span className="text-[7px] text-[#F4F0E8] font-bold">N</span>
            </div>
            <h1 className="font-bold text-[#383834] dark:text-[#F4F0E8] text-sm">Novo Projeto de Naming</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Identidade */}
          <section className="surface rounded-xl p-6 space-y-5">
            <div>
              <p className="section-label mb-1">01 — Identidade</p>
              <h2 className="font-bold text-[#383834] dark:text-[#F4F0E8]">Identidade do projeto</h2>
            </div>

            <div>
              <label className="label block mb-1.5">Nome do projeto *</label>
              <input
                required
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Ex: Renaming da marca principal"
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-2">Tipo de naming *</label>
              <div className="grid grid-cols-4 gap-2">
                {PROJECT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => set("type", t.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                      form.type === t.value
                        ? "border-[#2A5231] bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300"
                        : "border-[#E0D8CA] dark:border-[#3A3630] text-muted hover:border-[#BEA882]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Contexto */}
          <section className="surface rounded-xl p-6 space-y-5">
            <div>
              <p className="section-label mb-1">02 — Contexto</p>
              <h2 className="font-bold text-[#383834] dark:text-[#F4F0E8]">Contexto estratégico</h2>
            </div>

            <div>
              <label className="label block mb-1.5">Contexto livre</label>
              <textarea
                value={form.context}
                onChange={(e) => set("context", e.target.value)}
                placeholder="Descreva o produto, empresa, momento de mercado, desafio de naming..."
                className="input min-h-[100px] resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label block mb-1.5">Público-alvo</label>
                <input
                  value={form.targetAudience}
                  onChange={(e) => set("targetAudience", e.target.value)}
                  placeholder="Ex: Profissionais 25-40 anos"
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1.5">Categoria</label>
                <input
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Ex: Fintech, Saúde, B2B SaaS"
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1.5">Mercado / Região</label>
                <input
                  value={form.market}
                  onChange={(e) => set("market", e.target.value)}
                  placeholder="Ex: Brasil, América Latina"
                  className="input"
                />
              </div>
              <div>
                <label className="label block mb-1.5">Idioma principal</label>
                <select value={form.language} onChange={(e) => set("language", e.target.value)} className="input">
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en">Inglês</option>
                  <option value="es">Espanhol</option>
                  <option value="multilingual">Multilíngue</option>
                </select>
              </div>
            </div>
          </section>

          {/* Personalidade */}
          <section className="surface rounded-xl p-6 space-y-5">
            <div>
              <p className="section-label mb-1">03 — Personalidade</p>
              <h2 className="font-bold text-[#383834] dark:text-[#F4F0E8]">Personalidade da marca</h2>
            </div>

            <div>
              <label className="label block mb-2">Atributos de personalidade</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PERSONALITY_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                      selectedTags.includes(tag)
                        ? "border-[#2A5231] bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300"
                        : "border-[#E0D8CA] dark:border-[#3A3630] text-muted hover:border-[#BEA882]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <input
                value={form.personality}
                onChange={(e) => set("personality", e.target.value)}
                placeholder="Ou descreva livremente..."
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Referências e concorrentes</label>
              <input
                value={form.references}
                onChange={(e) => set("references", e.target.value)}
                placeholder="Ex: Notion, Linear, Stripe (estilo visual / naming)"
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Restrições</label>
              <input
                value={form.restrictions}
                onChange={(e) => set("restrictions", e.target.value)}
                placeholder="Ex: Não pode usar prefixo 'e-', evitar nomes religiosos"
                className="input"
              />
            </div>
          </section>

          <div className="flex items-center justify-between pt-1">
            <Link href="/" className="btn-ghost text-muted">Cancelar</Link>
            <button
              type="submit"
              disabled={loading || !form.name.trim()}
              className="btn-primary px-6"
            >
              {loading ? "Criando..." : "Criar workspace →"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
