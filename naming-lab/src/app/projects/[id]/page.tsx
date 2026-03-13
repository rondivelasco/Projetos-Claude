"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Candidate, Diagnosis, Decision, Project, Round } from "@/types";
import { NAMING_STATE_LABELS } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBar({ value }: { value: number }) {
  const pct = Math.round((value / 10) * 100);
  const fill =
    value >= 8 ? "bg-forest-400" :
    value >= 6 ? "bg-forest-600" :
    value >= 4 ? "bg-amber-500" :
    "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar flex-1">
        <div className={`score-fill ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-7 text-right text-muted">{value.toFixed(1)}</span>
    </div>
  );
}

function Badge({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "forest";
}) {
  const styles: Record<string, string> = {
    default:  "bg-[#EDE8DF] text-[#504E48]",
    success:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    warning:  "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    danger:   "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    forest:   "bg-forest-50 text-forest-700 dark:bg-forest-950 dark:text-forest-300",
  };
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[variant]}`}>
      {label}
    </span>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, "success" | "warning" | "danger"> = {
    low: "success", medium: "warning", high: "danger",
  };
  const labels: Record<string, string> = { low: "baixo", medium: "médio", high: "alto" };
  return <Badge label={labels[level] ?? level} variant={map[level] ?? "default"} />;
}

function parseJson<T>(str: string | null | undefined, fallback: T): T {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

function PanelHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-base font-bold tracking-tight text-[#383834] dark:text-[#F4F0E8]">{title}</h2>
      {action}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "context" | "diagnosis" | "generate" | "candidates" | "layers" | "compare" | "decision" | "history";

const TABS: { id: Tab; label: string; num: string }[] = [
  { id: "context",   label: "Contexto",   num: "01" },
  { id: "diagnosis", label: "Diagnóstico",num: "02" },
  { id: "generate",  label: "Gerador",    num: "03" },
  { id: "candidates",label: "Candidatos", num: "04" },
  { id: "layers",    label: "Camadas",    num: "05" },
  { id: "compare",   label: "Comparação", num: "06" },
  { id: "decision",  label: "Decisão",    num: "07" },
  { id: "history",   label: "Histórico",  num: "08" },
];

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function ContextPanel({ project, onSave }: { project: Project; onSave: (p: Partial<Project>) => Promise<void> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(project);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onSave(form);
    setEditing(false);
    setSaving(false);
  };

  const TYPE_LABELS: Record<string, string> = {
    brand: "Marca", product: "Produto", saas: "SaaS", character: "Personagem",
    place: "Lugar", title: "Título", "product-line": "Linha de Produtos",
  };

  if (!editing) return (
    <div className="space-y-4">
      <PanelHeader
        title="Contexto do Projeto"
        action={<button onClick={() => setEditing(true)} className="btn-ghost text-xs">Editar</button>}
      />
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          ["Tipo", TYPE_LABELS[project.type] ?? project.type],
          ["Mercado", project.market ?? "—"],
          ["Idioma", project.language],
          ["Categoria", project.category ?? "—"],
          ["Público-alvo", project.targetAudience ?? "—"],
          ["Personalidade", project.personality ?? "—"],
          ["Referências", project.references ?? "—"],
          ["Restrições", project.restrictions ?? "—"],
        ].map(([k, v]) => (
          <div key={k} className="surface rounded-lg p-3">
            <p className="label mb-1">{k}</p>
            <p className="text-[#504E48] dark:text-[#B8B0A0] text-xs leading-relaxed">{v}</p>
          </div>
        ))}
      </div>
      {project.context && (
        <div className="surface rounded-lg p-4">
          <p className="label mb-2">Contexto</p>
          <p className="text-sm text-[#504E48] dark:text-[#B8B0A0] leading-relaxed whitespace-pre-wrap">{project.context}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Editar Contexto"
        action={
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancelar</button>
            <button onClick={save} disabled={saving} className="btn-primary text-xs py-1">
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-3">
        {(["market", "language", "category", "targetAudience", "personality", "references", "restrictions"] as const).map((k) => (
          <div key={k}>
            <label className="label block mb-1">{k}</label>
            <input value={(form as any)[k] ?? ""} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="input text-xs" />
          </div>
        ))}
      </div>
      <div>
        <label className="label block mb-1">Contexto</label>
        <textarea value={form.context ?? ""} onChange={(e) => setForm({ ...form, context: e.target.value })} className="input min-h-[120px] resize-y text-sm" />
      </div>
    </div>
  );
}

function DiagnosisPanel({ projectId }: { projectId: string }) {
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/diagnose`);
    setDiagnoses(await res.json());
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    setRunning(true);
    await fetch(`/api/projects/${projectId}/diagnose`, { method: "POST" });
    await load();
    setRunning(false);
  };

  const STATE_COLORS: Record<string, string> = {
    N1: "bg-[#EDE5D6] text-[#8C7855] border-[#D9C9AE]",
    N2: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    N3: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
    N4: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
    N5: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
  };

  const latest = diagnoses[0];

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Diagnóstico de Naming"
        action={
          <button onClick={run} disabled={running} className="btn-primary text-xs py-1.5">
            {running ? "Analisando..." : "Rodar diagnóstico"}
          </button>
        }
      />

      {loading && <p className="text-sm text-muted animate-pulse">Carregando...</p>}

      {!loading && !latest && (
        <div className="surface rounded-xl p-10 text-center">
          <p className="text-3xl mb-3 opacity-30">⚡</p>
          <p className="font-semibold text-[#383834] dark:text-[#F4F0E8] mb-1">Nenhum diagnóstico ainda</p>
          <p className="text-xs text-muted">Clique em "Rodar diagnóstico" para analisar o projeto</p>
        </div>
      )}

      {latest && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {parseJson<string[]>(latest.states, []).map((s) => (
              <div key={s} className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${STATE_COLORS[s] ?? ""}`}>
                <span className="font-mono mr-1.5">{s}</span>
                {NAMING_STATE_LABELS[s as keyof typeof NAMING_STATE_LABELS]}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="surface rounded-xl p-4">
              <p className="label mb-2">Sintomas detectados</p>
              <ul className="space-y-1.5">
                {parseJson<string[]>(latest.symptoms, []).map((s, i) => (
                  <li key={i} className="text-xs text-[#504E48] dark:text-[#B8B0A0] flex gap-2">
                    <span className="text-[#BEA882] mt-0.5 shrink-0">▸</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface rounded-xl p-4">
              <p className="label mb-2">Causas prováveis</p>
              <ul className="space-y-1.5">
                {parseJson<string[]>(latest.causes, []).map((c, i) => (
                  <li key={i} className="text-xs text-[#504E48] dark:text-[#B8B0A0] flex gap-2">
                    <span className="text-[#60A86C] mt-0.5 shrink-0">▸</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="surface rounded-xl p-4">
            <p className="label mb-2">Impacto estratégico</p>
            <p className="text-sm text-[#383834] dark:text-[#F4F0E8]">{latest.impact}</p>
          </div>

          {latest.direction && (
            <div className="rounded-xl border border-[#C4DECA] dark:border-forest-800 bg-forest-50 dark:bg-forest-950 p-4">
              <p className="label text-forest-600 dark:text-forest-400 mb-2">Direção recomendada</p>
              <p className="text-sm text-forest-800 dark:text-forest-200">{latest.direction}</p>
            </div>
          )}

          {diagnoses.length > 1 && (
            <p className="text-xs text-muted">
              {diagnoses.length} diagnósticos registrados — mostrando o mais recente
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function GeneratorPanel({
  projectId,
  project,
  candidates: existingCandidates,
  onGenerated,
}: {
  projectId: string;
  project: Project;
  candidates: Candidate[];
  onGenerated: () => void;
}) {
  const [filter, setFilter] = useState("tech");
  const [useLLM, setUseLLM] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    round: Round;
    candidates: Candidate[];
    usedFallback?: boolean;
    fallbackReason?: string | null;
    modelUsed?: string;
  } | null>(null);

  const filters = [
    { value: "tech", label: "Tecnológico" },
    { value: "premium", label: "Premium" },
    { value: "human", label: "Humano" },
    { value: "clinical", label: "Clínico" },
    { value: "bold", label: "Ousado" },
    { value: "sophisticated", label: "Sofisticado" },
    { value: "simple", label: "Simples" },
    { value: "memorable", label: "Memorável" },
  ];

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      let res: Response;
      if (useLLM) {
        res = await fetch("/api/generate-names", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId }),
        });
      } else {
        res = await fetch(`/api/projects/${projectId}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filter, count: 8 }),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).error ?? `Erro ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
      onGenerated();
    } catch (err: any) {
      setError(err.message ?? "Erro desconhecido ao gerar nomes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PanelHeader title="Gerador de Candidatos" />

      <div className="surface rounded-xl p-5 space-y-5">
        {/* Mode toggle */}
        <div>
          <p className="label mb-2.5">Modo de geração</p>
          <div className="flex gap-2">
            {[
              { llm: true,  icon: "✦", title: "Gerador IA",    desc: "30 candidatos com OpenAI" },
              { llm: false, icon: "⚙", title: "Gerador Local", desc: "8 candidatos, sem API" },
            ].map(({ llm, icon, title, desc }) => (
              <button
                key={String(llm)}
                onClick={() => setUseLLM(llm)}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium border transition text-center ${
                  useLLM === llm
                    ? "border-forest-600 bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300"
                    : "border-[#E0D8CA] dark:border-[#3A3630] text-muted hover:border-[#BEA882]"
                }`}
              >
                <span className="block text-base mb-0.5">{icon}</span>
                <span className="block text-xs font-semibold">{title}</span>
                <span className="block text-[10px] opacity-60">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Local-mode filter */}
        {!useLLM && (
          <div>
            <p className="label mb-2.5">Perfil do nome</p>
            <div className="flex flex-wrap gap-2">
              {filters.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    filter === f.value
                      ? "border-forest-600 bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300"
                      : "border-[#E0D8CA] dark:border-[#3A3630] text-muted hover:border-[#BEA882]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LLM context preview */}
        {useLLM && (
          <div className="bg-[#F4F0E8] dark:bg-[#272420] rounded-lg px-4 py-3 space-y-1 text-[11px] text-muted">
            <p className="font-semibold text-[#383834] dark:text-[#F4F0E8] mb-1.5">Contexto enviado ao modelo:</p>
            {project.context && <p>📄 {project.context.slice(0, 90)}{project.context.length > 90 ? "…" : ""}</p>}
            {project.personality && <p>🎯 Personalidade: {project.personality}</p>}
            {project.category && <p>📂 Categoria: {project.category}</p>}
            {project.market && <p>🌍 Mercado: {project.market}</p>}
            {existingCandidates.length > 0 && (
              <p>
                🚫 Nomes a evitar: {existingCandidates.slice(0, 6).map((c) => c.name).join(", ")}
                {existingCandidates.length > 6 ? ` +${existingCandidates.length - 6}` : ""}
              </p>
            )}
          </div>
        )}

        <button onClick={generate} disabled={loading} className="btn-primary w-full justify-center">
          {loading
            ? (useLLM ? "Gerando com IA…" : "Gerando…")
            : (useLLM ? "✦ Gerar com IA" : "Gerar candidatos")}
        </button>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-xs text-red-700 dark:text-red-300">
            <span className="font-semibold">Erro: </span>{error}
          </div>
        )}
      </div>

      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="label">{result.round.label} — {result.candidates.length} candidatos</p>
            {!result.usedFallback && result.modelUsed && (
              <span className="text-[10px] bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300 px-2 py-0.5 rounded-full font-medium font-mono border border-forest-100 dark:border-forest-800">
                {result.modelUsed}
              </span>
            )}
            {result.usedFallback && (
              <span className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium border border-amber-200 dark:border-amber-800">
                fallback local
              </span>
            )}
          </div>

          {result.usedFallback && result.fallbackReason && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Motivo do fallback: </span>{result.fallbackReason}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {result.candidates.map((c) => {
              const meta = parseJson<{ llmCategory?: string; llmReasoning?: string }>(c.notes, {});
              return (
                <div key={c.id} className="surface rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#383834] dark:text-[#F4F0E8]">{c.name}</span>
                    <span className={`text-sm font-bold shrink-0 tabular-nums ${
                      (c.score?.total ?? 0) >= 7 ? "text-forest-600 dark:text-forest-400" :
                      (c.score?.total ?? 0) >= 5 ? "text-amber-600 dark:text-amber-400" :
                      "text-red-600 dark:text-red-400"
                    }`}>{c.score?.total.toFixed(1)}</span>
                  </div>

                  {meta.llmCategory && <Badge label={meta.llmCategory} variant="forest" />}

                  {c.score && (
                    <div className="space-y-1.5 text-xs">
                      {[
                        ["Sonora", c.score.soundFit],
                        ["Semântica", c.score.semanticClarity],
                        ["Memorabilidade", c.score.memorability],
                      ].map(([k, v]) => (
                        <div key={k as string} className="flex items-center gap-2">
                          <span className="text-muted w-20 shrink-0">{k}</span>
                          <ScoreBar value={v as number} />
                        </div>
                      ))}
                    </div>
                  )}

                  {meta.llmReasoning ? (
                    <p className="text-[11px] text-[#6C6860] dark:text-[#9A9488] italic border-l-2 border-[#BEA882] pl-2.5 leading-relaxed">
                      {meta.llmReasoning}
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted">{c.score?.justification}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CandidatesPanel({
  projectId,
  candidates,
  onRefresh,
}: {
  projectId: string;
  candidates: Candidate[];
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [evaluating, setEvaluating] = useState<string | null>(null);

  const addCandidate = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    await fetch(`/api/projects/${projectId}/candidates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    onRefresh();
    setAdding(false);
  };

  const evaluate = async (id: string) => {
    setEvaluating(id);
    await fetch(`/api/candidates/${id}/evaluate`, { method: "POST" });
    onRefresh();
    setEvaluating(null);
  };

  const toggleShortlist = async (c: Candidate) => {
    await fetch(`/api/candidates/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isShortlisted: !c.isShortlisted, isDiscarded: c.isDiscarded }),
    });
    onRefresh();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover candidato?")) return;
    await fetch(`/api/candidates/${id}`, { method: "DELETE" });
    onRefresh();
  };

  const sorted = [...candidates].sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0));

  return (
    <div className="space-y-4">
      <PanelHeader title={`Candidatos (${candidates.length})`} />

      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCandidate()}
          placeholder="Adicionar nome manualmente..."
          className="input flex-1"
        />
        <button onClick={addCandidate} disabled={adding || !newName.trim()} className="btn-primary px-4">
          {adding ? "..." : "Adicionar"}
        </button>
      </div>

      {candidates.length === 0 && (
        <div className="surface rounded-xl p-10 text-center">
          <p className="text-3xl mb-2 opacity-30">◎</p>
          <p className="text-sm text-muted">Nenhum candidato ainda. Use o Gerador ou adicione manualmente.</p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((c) => (
          <div
            key={c.id}
            className={`surface rounded-xl p-4 flex items-center gap-4 transition ${c.isDiscarded ? "opacity-40" : ""}`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="font-bold text-[#383834] dark:text-[#F4F0E8]">{c.name}</span>
                {c.isShortlisted && <Badge label="shortlist" variant="success" />}
                {c.score && (
                  <span className={`text-xs font-bold ml-auto tabular-nums ${
                    c.score.total >= 7 ? "text-forest-600 dark:text-forest-400" :
                    c.score.total >= 5 ? "text-amber-500" : "text-red-500"
                  }`}>{c.score.total.toFixed(1)}/10</span>
                )}
              </div>
              {c.score ? (
                <div className="grid grid-cols-4 gap-1 text-[10px] text-muted">
                  {[
                    ["Som", c.score.soundFit],
                    ["Sem", c.score.semanticClarity],
                    ["Cult", c.score.culturalFit],
                    ["Func", c.score.functionality],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <span>{k} </span>
                      <span className="font-mono text-[#383834] dark:text-[#F4F0E8]">{(v as number).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted">Não avaliado</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!c.score && (
                <button
                  onClick={() => evaluate(c.id)}
                  disabled={evaluating === c.id}
                  className="btn-ghost text-xs py-1"
                >
                  {evaluating === c.id ? "…" : "Avaliar"}
                </button>
              )}
              <button
                onClick={() => toggleShortlist(c)}
                className={`btn-ghost text-sm py-1 ${c.isShortlisted ? "text-[#BEA882]" : "text-[#D0C8B6]"}`}
              >
                {c.isShortlisted ? "★" : "☆"}
              </button>
              <button onClick={() => remove(c.id)} className="btn-ghost text-xs py-1 text-muted hover:text-red-500">×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LayersPanel({ candidates }: { candidates: Candidate[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const candidate = candidates.find((c) => c.id === selected) ?? candidates[0];

  if (candidates.length === 0) return (
    <div className="surface rounded-xl p-10 text-center">
      <p className="text-sm text-muted">Adicione e avalie candidatos primeiro.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold tracking-tight text-[#383834] dark:text-[#F4F0E8]">Análise por Camadas</h2>
        <select
          value={selected ?? candidate?.id ?? ""}
          onChange={(e) => setSelected(e.target.value)}
          className="input w-48 text-xs"
        >
          {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {candidate && (
        <div className="grid grid-cols-2 gap-4">
          {candidate.soundLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-[#383834] dark:text-[#F4F0E8]">Camada Sonora</p>
                <Badge label={(candidate.soundLayer as any).dominantTone} variant="forest" />
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  ["Ritmo", (candidate.soundLayer as any).rhythm],
                  ["Sílabas", (candidate.soundLayer as any).syllableCount],
                  ["Clareza fonética", (candidate.soundLayer as any).clarityScore + "/10"],
                  ["Repetição", (candidate.soundLayer as any).hasRepetition ? "Sim" : "Não"],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <span className="text-muted">{k}</span>
                    <span className="font-medium text-[#383834] dark:text-[#F4F0E8]">{v as string}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {parseJson<string[]>((candidate.soundLayer as any).notes, []).map((n, i) => (
                  <p key={i} className="text-[10px] text-muted">• {n}</p>
                ))}
              </div>
            </div>
          )}

          {candidate.meaningLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm text-[#383834] dark:text-[#F4F0E8]">Camada de Significado</p>
                <Badge label={(candidate.meaningLayer as any).type} />
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  ["Clareza", (candidate.meaningLayer as any).clarity + "/10"],
                  ["Densidade simbólica", (candidate.meaningLayer as any).symbolicDensity + "/10"],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <span className="text-muted">{k}</span>
                    <span className="font-medium text-[#383834] dark:text-[#F4F0E8]">{v as string}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted">{(candidate.meaningLayer as any).suggestion}</p>
            </div>
          )}

          {candidate.culturalLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <p className="font-semibold text-sm text-[#383834] dark:text-[#F4F0E8]">Camada Cultural</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Ambiguidade</span>
                  <RiskBadge level={(candidate.culturalLayer as any).ambiguityLevel} />
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Risco cultural</span>
                  <RiskBadge level={(candidate.culturalLayer as any).culturalRisk} />
                </div>
              </div>
              <div className="space-y-1">
                {parseJson<string[]>((candidate.culturalLayer as any).associations, []).map((a, i) => (
                  <p key={i} className="text-[10px] text-muted">• {a}</p>
                ))}
              </div>
            </div>
          )}

          {candidate.functionalLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <p className="font-semibold text-sm text-[#383834] dark:text-[#F4F0E8]">Camada Funcional</p>
              <div className="space-y-2 text-xs">
                {[
                  ["Pronúncia", (candidate.functionalLayer as any).pronunciation],
                  ["Escrita", (candidate.functionalLayer as any).writability],
                  ["Memorabilidade", (candidate.functionalLayer as any).memorability],
                  ["Legibilidade", (candidate.functionalLayer as any).readability],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-muted">{k}</span>
                    </div>
                    <ScoreBar value={v as number} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted">Teste do telefone:</span>
                <Badge
                  label={(candidate.functionalLayer as any).phoneTest ? "Passa" : "Falha"}
                  variant={(candidate.functionalLayer as any).phoneTest ? "success" : "danger"}
                />
              </div>
            </div>
          )}

          {!candidate.soundLayer && !candidate.meaningLayer && !candidate.culturalLayer && !candidate.functionalLayer && (
            <div className="col-span-2 surface rounded-xl p-8 text-center text-sm text-muted">
              Candidato não avaliado. Vá em Candidatos e clique em "Avaliar".
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComparePanel({ candidates }: { candidates: Candidate[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 4 ? [...prev, id] : prev
    );

  const compared = candidates.filter((c) => selected.includes(c.id));
  const evaluated = candidates.filter((c) => c.score);

  const DIMENSIONS = [
    { key: "soundFit",        label: "Fit Sonoro" },
    { key: "semanticClarity", label: "Clareza Semântica" },
    { key: "culturalFit",     label: "Fit Cultural" },
    { key: "functionality",   label: "Funcionalidade" },
    { key: "memorability",    label: "Memorabilidade" },
    { key: "differentiation", label: "Diferenciação" },
    { key: "brandPotential",  label: "Potencial de Marca" },
    { key: "total",           label: "Nota Final" },
  ];

  return (
    <div className="space-y-4">
      <PanelHeader title="Comparação de Candidatos" />

      <div className="surface rounded-lg p-4">
        <p className="label mb-3">Selecione até 4 candidatos para comparar</p>
        <div className="flex flex-wrap gap-2">
          {evaluated.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                selected.includes(c.id)
                  ? "border-forest-600 bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300"
                  : "border-[#E0D8CA] dark:border-[#3A3630] text-muted hover:border-[#BEA882]"
              }`}
            >
              {c.name}
              {c.score && <span className="ml-1.5 opacity-60 font-mono">{c.score.total.toFixed(1)}</span>}
            </button>
          ))}
        </div>
        {evaluated.length === 0 && <p className="text-xs text-muted mt-2">Avalie candidatos primeiro.</p>}
      </div>

      {compared.length >= 2 && (
        <div className="overflow-x-auto surface rounded-xl p-4">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E0D8CA] dark:border-[#2E2A24]">
                <th className="text-left py-2 pr-4 text-muted font-medium w-36">Dimensão</th>
                {compared.map((c) => (
                  <th key={c.id} className="text-center py-2 px-3 font-bold text-[#383834] dark:text-[#F4F0E8] min-w-[120px]">
                    {c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map(({ key, label }) => {
                const values = compared.map((c) => (c.score as any)?.[key] ?? 0);
                const max = Math.max(...values);
                return (
                  <tr key={key} className="border-b border-[#EDE8DF] dark:border-[#272420]">
                    <td className="py-2 pr-4 text-muted">{label}</td>
                    {compared.map((c) => {
                      const v = (c.score as any)?.[key] ?? 0;
                      return (
                        <td key={c.id} className="py-2 px-3 text-center">
                          <span className={`font-mono font-semibold ${
                            v === max && max > 0
                              ? "text-forest-600 dark:text-forest-400"
                              : "text-[#504E48] dark:text-[#B8B0A0]"
                          }`}>
                            {Number(v).toFixed(1)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DecisionPanel({ projectId, candidates }: { projectId: string; candidates: Candidate[] }) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [form, setForm] = useState({ chosenName: "", justification: "", candidateId: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/decision`)
      .then((r) => r.json())
      .then((d) => {
        if (d) {
          setDecision(d);
          setForm({ chosenName: d.chosenName, justification: d.justification, candidateId: d.candidateId ?? "" });
        }
      });
  }, [projectId]);

  const save = async () => {
    setSaving(true);
    const shortlist = candidates.filter((c) => c.isShortlisted).map((c) => c.name);
    const res = await fetch(`/api/projects/${projectId}/decision`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, shortlist }),
    });
    setDecision(await res.json());
    setSaving(false);
  };

  const shortlisted = candidates.filter((c) => c.isShortlisted);

  return (
    <div className="space-y-5">
      <PanelHeader title="Decisão Final" />

      {shortlisted.length > 0 && (
        <div className="surface rounded-xl p-4">
          <p className="label mb-3">Shortlist</p>
          <div className="flex flex-wrap gap-2">
            {shortlisted.map((c) => (
              <button
                key={c.id}
                onClick={() => setForm((f) => ({ ...f, chosenName: c.name, candidateId: c.id }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                  form.candidateId === c.id
                    ? "border-forest-600 bg-forest-50 dark:bg-forest-950 text-forest-700 dark:text-forest-300"
                    : "border-[#E0D8CA] dark:border-[#3A3630] text-[#383834] dark:text-[#F4F0E8]"
                }`}
              >
                {c.name}
                {c.score && <span className="ml-1.5 text-xs opacity-60 font-mono">{c.score.total.toFixed(1)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="surface rounded-xl p-5 space-y-4">
        <div>
          <label className="label block mb-1.5">Nome escolhido</label>
          <input
            value={form.chosenName}
            onChange={(e) => setForm((f) => ({ ...f, chosenName: e.target.value }))}
            placeholder="Nome final selecionado"
            className="input"
          />
        </div>
        <div>
          <label className="label block mb-1.5">Justificativa estratégica</label>
          <textarea
            value={form.justification}
            onChange={(e) => setForm((f) => ({ ...f, justification: e.target.value }))}
            placeholder="Por que este nome foi escolhido? Quais critérios foram decisivos?"
            className="input min-h-[120px] resize-y"
          />
        </div>
        <button onClick={save} disabled={saving || !form.chosenName.trim()} className="btn-primary">
          {saving ? "Salvando..." : "Registrar decisão"}
        </button>
      </div>

      {decision && (
        <div className="rounded-xl border border-forest-200 dark:border-forest-800 bg-forest-50 dark:bg-forest-950 p-5">
          <p className="label text-forest-600 dark:text-forest-400 mb-2">Decisão registrada</p>
          <p className="text-xl font-bold text-forest-800 dark:text-forest-200 mb-1.5">{decision.chosenName}</p>
          <p className="text-sm text-forest-700 dark:text-forest-300 leading-relaxed">{decision.justification}</p>
          <p className="text-xs text-forest-500 dark:text-forest-500 mt-3">
            Atualizado em {new Date(decision.updatedAt).toLocaleString("pt-BR")}
          </p>
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ projectId }: { projectId: string }) {
  const [rounds, setRounds] = useState<Round[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/rounds`)
      .then((r) => r.json())
      .then(setRounds);
  }, [projectId]);

  if (rounds.length === 0) return (
    <div className="surface rounded-xl p-10 text-center">
      <p className="text-sm text-muted">Nenhuma rodada ainda. Use o Gerador para criar candidatos.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <PanelHeader title="Histórico de Rodadas" />
      <div className="space-y-4">
        {rounds.map((r) => (
          <div key={r.id} className="surface rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-semibold text-sm text-[#383834] dark:text-[#F4F0E8]">
                  {r.label ?? `Rodada ${r.number}`}
                </span>
                <span className="text-xs text-muted ml-2">
                  {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <Badge label={`${(r as any).candidates?.length ?? 0} nomes`} />
            </div>
            <div className="flex flex-wrap gap-2">
              {((r as any).candidates as Candidate[] ?? []).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-1.5 bg-[#F4F0E8] dark:bg-[#272420] rounded-lg px-2.5 py-1 border border-[#E0D8CA] dark:border-[#2E2A24]"
                >
                  <span className="text-sm font-medium text-[#383834] dark:text-[#F4F0E8]">{c.name}</span>
                  {c.score && (
                    <span className={`text-xs font-bold font-mono ${
                      c.score.total >= 7 ? "text-forest-600 dark:text-forest-400" :
                      c.score.total >= 5 ? "text-amber-500" : "text-muted"
                    }`}>{c.score.total.toFixed(1)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main workspace page ──────────────────────────────────────────────────────

export default function WorkspacePage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("context");
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}`);
    setProject(await res.json());
  }, [params.id]);

  const loadCandidates = useCallback(async () => {
    const res = await fetch(`/api/projects/${params.id}/candidates`);
    setCandidates(await res.json());
  }, [params.id]);

  useEffect(() => {
    Promise.all([loadProject(), loadCandidates()]).then(() => setLoading(false));
  }, [loadProject, loadCandidates]);

  const saveProject = async (updates: Partial<Project>) => {
    await fetch(`/api/projects/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await loadProject();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F0E8] dark:bg-[#12110E]">
      <p className="text-muted animate-pulse text-sm">Carregando workspace...</p>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F0E8] dark:bg-[#12110E]">
      <div className="text-center">
        <p className="text-muted mb-4">Projeto não encontrado.</p>
        <Link href="/" className="btn-primary">Voltar ao dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F0E8] dark:bg-[#12110E]">
      {/* Header */}
      <header className="border-b border-[#E0D8CA] dark:border-[#2E2A24] bg-white dark:bg-[#1C1A16] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="btn-ghost text-xs py-1 text-muted">← Dashboard</Link>

          <div className="flex-1 min-w-0 flex items-center gap-3">
            {/* Forest green logo mark */}
            <div className="w-5 h-5 rounded bg-[#2A5231] flex items-center justify-center shrink-0">
              <span className="text-[7px] text-[#F4F0E8] font-bold">N</span>
            </div>
            <h1 className="font-bold text-[#383834] dark:text-[#F4F0E8] truncate text-sm">{project.name}</h1>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted">
            <span>{candidates.length} candidatos</span>
            <span className="text-[#E0D8CA] dark:text-[#3A3630]">·</span>
            <span>{candidates.filter((c) => c.isShortlisted).length} shortlist</span>
          </div>

          <button
            onClick={() => saveProject({ isFavorite: !project.isFavorite })}
            className={`btn-ghost text-base py-1 transition ${project.isFavorite ? "text-[#BEA882]" : "text-[#D0C8B6]"}`}
            title={project.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {project.isFavorite ? "★" : "☆"}
          </button>
        </div>

        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-6 flex gap-0.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`group px-3 py-2.5 text-xs whitespace-nowrap border-b-2 transition flex items-center gap-1.5 ${
                activeTab === t.id
                  ? "border-[#2A5231] text-[#2A5231] dark:text-forest-400 dark:border-forest-400"
                  : "border-transparent text-muted hover:text-[#383834] dark:hover:text-[#F4F0E8]"
              }`}
            >
              <span className={`font-mono text-[9px] transition ${
                activeTab === t.id ? "text-[#BEA882]" : "text-[#D0C8B6] group-hover:text-[#BEA882]"
              }`}>{t.num}</span>
              <span className="font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-7 w-full flex-1">
        {activeTab === "context"    && <ContextPanel   project={project} onSave={saveProject} />}
        {activeTab === "diagnosis"  && <DiagnosisPanel projectId={params.id} />}
        {activeTab === "generate"   && <GeneratorPanel  projectId={params.id} project={project} candidates={candidates} onGenerated={loadCandidates} />}
        {activeTab === "candidates" && <CandidatesPanel projectId={params.id} candidates={candidates} onRefresh={loadCandidates} />}
        {activeTab === "layers"     && <LayersPanel     candidates={candidates} />}
        {activeTab === "compare"    && <ComparePanel    candidates={candidates} />}
        {activeTab === "decision"   && <DecisionPanel   projectId={params.id} candidates={candidates} />}
        {activeTab === "history"    && <HistoryPanel    projectId={params.id} />}
      </main>
    </div>
  );
}
