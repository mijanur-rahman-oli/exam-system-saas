"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Plus, Search, Tag } from "lucide-react";
import { QuestionCard } from "@/components/questions/QuestionCard";

export default function QSQuestionsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects").then((r) => r.json()),
  });

  const { data: questions, refetch, isLoading } = useQuery({
    queryKey: ["qs-questions", search, tagFilter, subject, status, difficulty],
    queryFn: async () => {
      const params = new URLSearchParams({ createdByMe: "true" });
      if (search) params.set("search", search);
      if (tagFilter) params.append("tags", tagFilter);
      if (subject !== "all") params.set("subjectId", subject);
      if (status !== "all") params.set("status", status);
      if (difficulty !== "all") params.set("difficulty", difficulty);
      const r = await fetch(`/api/questions?${params}`);
      return r.json();
    },
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast({ title: "Question deleted" }); refetch(); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const publish = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/questions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "published" }) });
      if (!r.ok) throw new Error("Failed");
    },
    onSuccess: () => { toast({ title: "Published" }); refetch(); },
  });

  const inp: React.CSSProperties = { height: "2.1rem", padding: "0 0.75rem", borderRadius: "0.5rem", border: "1.5px solid var(--border)", background: "var(--input-bg)", color: "var(--text)", fontSize: "0.78rem", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>My Questions</h1>
          <p style={{ fontSize: "0.8rem", color: "var(--text3)", margin: 0 }}>{questions?.length ?? 0} questions</p>
        </div>
        <Link href="/question-setter/questions/create">
          <button style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.55rem 1.1rem", borderRadius: "0.5rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
            <Plus size={15} /> New Question
          </button>
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
          <Search size={12} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
            style={{ ...inp, paddingLeft: "1.9rem", width: "100%", boxSizing: "border-box" as any }} />
        </div>
        <div style={{ position: "relative" }}>
          <Tag size={12} style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)" }} />
          <input value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} placeholder="#tag"
            style={{ ...inp, paddingLeft: "1.9rem", width: "120px" }} />
        </div>
        {[
          { val: subject, set: setSubject, options: [["all", "All Subjects"], ...(subjects?.map((s: any) => [String(s.id), s.name]) ?? [])] },
          { val: status, set: setStatus, options: [["all", "All Status"], ["draft", "Draft"], ["published", "Published"]] },
          { val: difficulty, set: setDifficulty, options: [["all", "All"], ["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"]] },
        ].map(({ val, set, options }, i) => (
          <select key={i} value={val} onChange={(e) => set(e.target.value)} style={{ ...inp, appearance: "none" as any }}>
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      {/* Questions list */}
      {isLoading
        ? <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>Loading…</div>
        : !questions?.length
          ? <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
            No questions found.
          </div>
          : <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {questions.map((q: any) => (
              <QuestionCard
                key={q.id}
                question={q}
                expanded={expanded === q.id}
                onToggle={() => setExpanded(expanded === q.id ? null : q.id)}
                onDelete={(id) => del.mutate(id)}
                onPublish={(id) => publish.mutate(id)}
                editHref={`/question-setter/questions/${q.id}/edit`}
                isDeleting={del.isPending}
                isPublishing={publish.isPending}
              />
            ))}
          </div>
      }
    </div>
  );
}