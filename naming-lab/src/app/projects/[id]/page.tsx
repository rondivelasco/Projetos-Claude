"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Candidate, Diagnosis, Decision, Project, Round } from "@/types";
import { NAMING_STATE_LABELS } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBar({ value, color = "bg-brand-500" }: { value: number; color?: string }) {
  const pct = Math.round((value / 10) * 100);
  const fill =
    value >= 8 ? "bg-emerald-500" :
    value >= 6 ? "bg-brand-500" :
    value >= 4 ? "bg-amber-500" :
    "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="score-bar flex-1">
        <div className={`score-fill ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono w-7 text-right text-slate-500 dark:text-zinc-400">{value.toFixed(1)}</span>
    </div>
  );
}

function Badge({ label, variant = "default" }: { label: string; variant?: "default" | "success" | "warning" | "danger" | "purple" }) {
  const styles = {
    default: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300",
    success: "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300",
    warning: "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300",
    danger: "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300",
    purple: "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300",
  };
  return <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[variant]}`}>{label}</span>;
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, "success" | "warning" | "danger"> = { low: "success", medium: "warning", high: "danger" };
  const labels: Record<string, string> = { low: "baixo", medium: "médio", high: "alto" };
  return <Badge label={labels[level] ?? level} variant={map[level] ?? "default"} />;
}

function parseJson<T>(str: string | null | undefined, fallback: T): T {
  try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = "context" | "diagnosis" | "generate" | "candidates" | "layers" | "compare" | "decision" | "history";

const TABS: { id: Tab; label: string }[] = [
  { id: "context", label: "Contexto" },
  { id: "diagnosis", label: "Diagnóstico" },
  { id: "generate", label: "Gerador" },
  { id: "candidates", label: "Candidatos" },
  { id: "layers", label: "Camadas" },
  { id: "compare", label: "Comparação" },
  { id: "decision", label: "Decisão" },
  { id: "history", label: "Histórico" },
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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Contexto do Projeto</h3>
        <button onClick={() => setEditing(true)} className="btn-ghost text-xs">Editar</button>
      </div>
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
            <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed">{v}</p>
          </div>
        ))}
      </div>
      {project.context && (
        <div className="surface rounded-lg p-4">
          <p className="label mb-2">Contexto</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{project.context}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Editar Contexto</h3>
        <div className="flex gap-2">
          <button onClick={() => setEditing(false)} className="btn-ghost text-xs">Cancelar</button>
          <button onClick={save} disabled={saving} className="btn-primary text-xs py-1">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
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
    N1: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    N2: "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    N3: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    N4: "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
    N5: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800",
  };

  const latest = diagnoses[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Diagnóstico de Naming</h3>
        <button onClick={run} disabled={running} className="btn-primary text-xs py-1.5">
          {running ? "Analisando..." : "Rodar diagnóstico"}
        </button>
      </div>

      {loading && <div className="text-sm text-slate-400 animate-pulse">Carregando...</div>}

      {!loading && !latest && (
        <div className="surface rounded-xl p-8 text-center text-slate-400 dark:text-zinc-500">
          <p className="text-4xl mb-3">⚡</p>
          <p className="font-medium mb-1">Nenhum diagnóstico ainda</p>
          <p className="text-xs">Clique em "Rodar diagnóstico" para analisar o projeto</p>
        </div>
      )}

      {latest && (
        <div className="space-y-4">
          {/* States */}
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
              <ul className="space-y-1">
                {parseJson<string[]>(latest.symptoms, []).map((s, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-zinc-300 flex gap-2">
                    <span className="text-amber-500 mt-0.5 shrink-0">▸</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface rounded-xl p-4">
              <p className="label mb-2">Causas prováveis</p>
              <ul className="space-y-1">
                {parseJson<string[]>(latest.causes, []).map((c, i) => (
                  <li key={i} className="text-xs text-slate-600 dark:text-zinc-300 flex gap-2">
                    <span className="text-blue-500 mt-0.5 shrink-0">▸</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="surface rounded-xl p-4">
            <p className="label mb-2">Impacto estratégico</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{latest.impact}</p>
          </div>

          {latest.direction && (
            <div className="rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-950 p-4">
              <p className="label text-brand-600 dark:text-brand-400 mb-2">Direção recomendada</p>
              <p className="text-sm text-brand-800 dark:text-brand-200">{latest.direction}</p>
            </div>
          )}

          {diagnoses.length > 1 && (
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              {diagnoses.length} diagnósticos registrados — mostrando o mais recente
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function GeneratorPanel({ projectId, onGenerated }: { projectId: string; onGenerated: () => void }) {
  const [filter, setFilter] = useState("tech");
  const [count, setCount] = useState(6);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ round: Round; candidates: Candidate[] } | null>(null);

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
    const res = await fetch(`/api/projects/${projectId}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filter, count }),
    });
    const data = await res.json();
    setResult(data);
    onGenerated();
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <h3 className="font-semibold">Gerador de Candidatos</h3>

      <div className="surface rounded-xl p-4 space-y-4">
        <div>
          <p className="label mb-2">Perfil do nome</p>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  filter === f.value
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300"
                    : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div>
            <p className="label mb-1">Quantidade</p>
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="input w-24 text-xs">
              {[4, 6, 8, 10, 12].map((n) => <option key={n} value={n}>{n} nomes</option>)}
            </select>
          </div>
          <div className="flex-1 flex items-end">
            <button onClick={generate} disabled={loading} className="btn-primary w-full justify-center">
              {loading ? "Gerando..." : "Gerar candidatos"}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          <p className="label">{result.round.label} — {result.candidates.length} candidatos gerados</p>
          <div className="grid grid-cols-2 gap-3">
            {result.candidates.map((c) => (
              <div key={c.id} className="surface rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                  <span className={`text-sm font-bold ${
                    (c.score?.total ?? 0) >= 7 ? "text-emerald-600 dark:text-emerald-400" :
                    (c.score?.total ?? 0) >= 5 ? "text-amber-600 dark:text-amber-400" :
                    "text-red-600 dark:text-red-400"
                  }`}>{c.score?.total.toFixed(1)}</span>
                </div>
                {c.score && (
                  <div className="space-y-1 text-xs">
                    {[
                      ["Sonora", c.score.soundFit],
                      ["Semântica", c.score.semanticClarity],
                      ["Memorabilidade", c.score.memorability],
                    ].map(([k, v]) => (
                      <div key={k as string} className="flex items-center gap-2">
                        <span className="text-slate-400 dark:text-zinc-500 w-20 shrink-0">{k}</span>
                        <ScoreBar value={v as number} />
                      </div>
                    ))}
                  </div>
                )}
                {c.soundLayer && (
                  <Badge label={(c.soundLayer as any).dominantTone} variant="purple" />
                )}
                <p className="text-[10px] text-slate-400 dark:text-zinc-500">{c.score?.justification}</p>
              </div>
            ))}
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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Candidatos ({candidates.length})</h3>
      </div>

      {/* Add manually */}
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
        <div className="surface rounded-xl p-8 text-center text-slate-400 dark:text-zinc-500">
          <p className="text-3xl mb-2">◎</p>
          <p className="text-sm">Nenhum candidato ainda. Use o Gerador ou adicione manualmente.</p>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map((c) => (
          <div key={c.id} className={`surface rounded-xl p-4 flex items-center gap-4 ${c.isDiscarded ? "opacity-40" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</span>
                {c.isShortlisted && <Badge label="shortlist" variant="success" />}
                {c.score && (
                  <span className={`text-xs font-bold ml-auto ${
                    c.score.total >= 7 ? "text-emerald-600 dark:text-emerald-400" :
                    c.score.total >= 5 ? "text-amber-500" : "text-red-500"
                  }`}>{c.score.total.toFixed(1)}/10</span>
                )}
              </div>
              {c.score ? (
                <div className="grid grid-cols-4 gap-1 text-[10px] text-slate-500 dark:text-zinc-400">
                  {[
                    ["Som", c.score.soundFit],
                    ["Sem", c.score.semanticClarity],
                    ["Cult", c.score.culturalFit],
                    ["Func", c.score.functionality],
                  ].map(([k, v]) => (
                    <div key={k as string}>
                      <span>{k} </span>
                      <span className="font-mono text-slate-700 dark:text-zinc-300">{(v as number).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 dark:text-zinc-500">Não avaliado</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!c.score && (
                <button
                  onClick={() => evaluate(c.id)}
                  disabled={evaluating === c.id}
                  className="btn-ghost text-xs py-1"
                >
                  {evaluating === c.id ? "..." : "Avaliar"}
                </button>
              )}
              <button
                onClick={() => toggleShortlist(c)}
                className={`btn-ghost text-xs py-1 ${c.isShortlisted ? "text-emerald-600 dark:text-emerald-400" : ""}`}
              >
                {c.isShortlisted ? "★" : "☆"}
              </button>
              <button onClick={() => remove(c.id)} className="btn-ghost text-xs py-1 text-slate-400 hover:text-red-500">×</button>
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
    <div className="surface rounded-xl p-8 text-center text-slate-400 dark:text-zinc-500">
      <p className="text-sm">Adicione e avalie candidatos primeiro.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Análise por Camadas</h3>
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
          {/* Sound */}
          {candidate.soundLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">🔊 Camada Sonora</p>
                <Badge label={(candidate.soundLayer as any).dominantTone} variant="purple" />
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  ["Ritmo", (candidate.soundLayer as any).rhythm],
                  ["Sílabas", (candidate.soundLayer as any).syllableCount],
                  ["Clareza fonética", (candidate.soundLayer as any).clarityScore + "/10"],
                  ["Repetição", (candidate.soundLayer as any).hasRepetition ? "Sim" : "Não"],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{k}</span>
                    <span className="font-medium">{v as string}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1">
                {parseJson<string[]>((candidate.soundLayer as any).notes, []).map((n, i) => (
                  <p key={i} className="text-[10px] text-slate-500 dark:text-zinc-400">• {n}</p>
                ))}
              </div>
            </div>
          )}

          {/* Meaning */}
          {candidate.meaningLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">💡 Camada de Significado</p>
                <Badge label={(candidate.meaningLayer as any).type} />
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  ["Clareza", (candidate.meaningLayer as any).clarity + "/10"],
                  ["Densidade simbólica", (candidate.meaningLayer as any).symbolicDensity + "/10"],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{k}</span>
                    <span className="font-medium">{v as string}</span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400">{(candidate.meaningLayer as any).suggestion}</p>
            </div>
          )}

          {/* Cultural */}
          {candidate.culturalLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <p className="font-medium text-sm">🌍 Camada Cultural</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Ambiguidade</span>
                  <RiskBadge level={(candidate.culturalLayer as any).ambiguityLevel} />
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-zinc-400">Risco cultural</span>
                  <RiskBadge level={(candidate.culturalLayer as any).culturalRisk} />
                </div>
              </div>
              <div className="space-y-1">
                {parseJson<string[]>((candidate.culturalLayer as any).associations, []).map((a, i) => (
                  <p key={i} className="text-[10px] text-slate-500 dark:text-zinc-400">• {a}</p>
                ))}
              </div>
            </div>
          )}

          {/* Functional */}
          {candidate.functionalLayer && (
            <div className="surface rounded-xl p-4 space-y-3">
              <p className="font-medium text-sm">⚙️ Camada Funcional</p>
              <div className="space-y-2 text-xs">
                {[
                  ["Pronúncia", (candidate.functionalLayer as any).pronunciation],
                  ["Escrita", (candidate.functionalLayer as any).writability],
                  ["Memorabilidade", (candidate.functionalLayer as any).memorability],
                  ["Legibilidade", (candidate.functionalLayer as any).readability],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-slate-500 dark:text-zinc-400">{k}</span>
                    </div>
                    <ScoreBar value={v as number} />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>Teste do telefone:</span>
                <Badge
                  label={(candidate.functionalLayer as any).phoneTest ? "Passa" : "Falha"}
                  variant={(candidate.functionalLayer as any).phoneTest ? "success" : "danger"}
                />
              </div>
            </div>
          )}

          {/* No layers yet */}
          {!candidate.soundLayer && !candidate.meaningLayer && !candidate.culturalLayer && !candidate.functionalLayer && (
            <div className="col-span-2 surface rounded-xl p-6 text-center text-slate-400 dark:text-zinc-500 text-sm">
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

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const compared = candidates.filter((c) => selected.includes(c.id));
  const evaluated = candidates.filter((c) => c.score);

  const DIMENSIONS = [
    { key: "soundFit", label: "Fit Sonoro" },
    { key: "semanticClarity", label: "Clareza Semântica" },
    { key: "culturalFit", label: "Fit Cultural" },
    { key: "functionality", label: "Funcionalidade" },
    { key: "memorability", label: "Memorabilidade" },
    { key: "differentiation", label: "Diferenciação" },
    { key: "brandPotential", label: "Potencial de Marca" },
    { key: "total", label: "Nota Final" },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Comparação de Candidatos</h3>

      <div className="surface rounded-lg p-3">
        <p className="label mb-2">Selecione até 4 candidatos para comparar</p>
        <div className="flex flex-wrap gap-2">
          {evaluated.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                selected.includes(c.id)
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300"
                  : "border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400"
              }`}
            >
              {c.name}
              {c.score && <span className="ml-1 opacity-60">{c.score.total.toFixed(1)}</span>}
            </button>
          ))}
        </div>
        {evaluated.length === 0 && <p className="text-xs text-slate-400 dark:text-zinc-500">Avalie candidatos primeiro.</p>}
      </div>

      {compared.length >= 2 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-zinc-700">
                <th className="text-left py-2 pr-4 text-slate-500 dark:text-zinc-400 font-medium w-36">Dimensão</th>
                {compared.map((c) => (
                  <th key={c.id} className="text-center py-2 px-3 font-semibold text-slate-800 dark:text-slate-200 min-w-[120px]">
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
                  <tr key={key} className="border-b border-slate-100 dark:border-zinc-800">
                    <td className="py-2 pr-4 text-slate-500 dark:text-zinc-400">{label}</td>
                    {compared.map((c) => {
                      const v = (c.score as any)?.[key] ?? 0;
                      return (
                        <td key={c.id} className="py-2 px-3 text-center">
                          <span className={`font-mono font-semibold ${v === max && max > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-600 dark:text-zinc-300"}`}>
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
      <h3 className="font-semibold">Decisão Final</h3>

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
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                    : "border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                {c.name}
                {c.score && <span className="ml-1 text-xs opacity-60">{c.score.total.toFixed(1)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="surface rounded-xl p-5 space-y-4">
        <div>
          <label className="label block mb-1">Nome escolhido</label>
          <input
            value={form.chosenName}
            onChange={(e) => setForm((f) => ({ ...f, chosenName: e.target.value }))}
            placeholder="Nome final selecionado"
            className="input"
          />
        </div>
        <div>
          <label className="label block mb-1">Justificativa estratégica</label>
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
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950 p-4">
          <p className="label text-emerald-600 dark:text-emerald-400 mb-2">Decisão registrada</p>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mb-1">{decision.chosenName}</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{decision.justification}</p>
          <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-2">
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
    <div className="surface rounded-xl p-8 text-center text-slate-400 dark:text-zinc-500">
      <p className="text-sm">Nenhuma rodada ainda. Use o Gerador para criar candidatos.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Histórico de Rodadas</h3>
      <div className="space-y-4">
        {rounds.map((r) => (
          <div key={r.id} className="surface rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-sm">{r.label ?? `Rodada ${r.number}`}</span>
                <span className="text-xs text-slate-400 dark:text-zinc-500 ml-2">
                  {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <Badge label={`${(r as any).candidates?.length ?? 0} nomes`} />
            </div>
            <div className="flex flex-wrap gap-2">
              {((r as any).candidates as Candidate[] ?? []).map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 bg-slate-50 dark:bg-zinc-800 rounded-lg px-2.5 py-1">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{c.name}</span>
                  {c.score && (
                    <span className={`text-xs font-bold ${
                      c.score.total >= 7 ? "text-emerald-600 dark:text-emerald-400" :
                      c.score.total >= 5 ? "text-amber-500" : "text-slate-400"
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
    const data = await res.json();
    setProject(data);
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
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      <p className="animate-pulse">Carregando workspace...</p>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-500 mb-4">Projeto não encontrado.</p>
        <Link href="/" className="btn-primary">Voltar ao dashboard</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link href="/" className="btn-ghost text-xs py-1">← Dashboard</Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{project.name}</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
            <span>{candidates.length} candidatos</span>
            <span>·</span>
            <span>{candidates.filter((c) => c.isShortlisted).length} shortlist</span>
          </div>
          <button
            onClick={async () => {
              await saveProject({ isFavorite: !project.isFavorite });
            }}
            className={`btn-ghost text-sm ${project.isFavorite ? "text-amber-500" : "text-slate-300"}`}
            title={project.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            {project.isFavorite ? "★" : "☆"}
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === t.id
                  ? "border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400"
                  : "border-transparent text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6 w-full flex-1">
        {activeTab === "context" && <ContextPanel project={project} onSave={saveProject} />}
        {activeTab === "diagnosis" && <DiagnosisPanel projectId={params.id} />}
        {activeTab === "generate" && <GeneratorPanel projectId={params.id} onGenerated={loadCandidates} />}
        {activeTab === "candidates" && <CandidatesPanel projectId={params.id} candidates={candidates} onRefresh={loadCandidates} />}
        {activeTab === "layers" && <LayersPanel candidates={candidates} />}
        {activeTab === "compare" && <ComparePanel candidates={candidates} />}
        {activeTab === "decision" && <DecisionPanel projectId={params.id} candidates={candidates} />}
        {activeTab === "history" && <HistoryPanel projectId={params.id} />}
      </main>
    </div>
  );
}
