"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, CheckCircle2, Trash2, Plus } from "lucide-react";
import Link from "next/link";

// ─── Styles ───────────────────────────────────────────────────────────────────
const selBase: React.CSSProperties = {
  width: "100%", height: "2.1rem", padding: "0 0.7rem",
  borderRadius: "0.5rem", background: "var(--input-bg)",
  border: "1.5px solid var(--border)", color: "var(--text)",
  fontSize: "0.8rem", outline: "none", appearance: "none" as any,
  boxSizing: "border-box", transition: "border-color 0.15s",
};
const inpBase: React.CSSProperties = { ...selBase, appearance: undefined };
const textareaBase: React.CSSProperties = {
  ...inpBase, height: "auto", padding: "0.5rem 0.75rem",
  resize: "vertical" as any, lineHeight: "1.6",
};

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: "var(--radius)", overflow: "hidden",
    }}>
      {title && (
        <div style={{ padding: "0.7rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text2)" }}>
            {title}
          </span>
        </div>
      )}
      <div style={{ padding: "1.1rem 1.25rem" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
      {children}
      {optional && <span style={{ fontWeight: 400, color: "var(--text3)", marginLeft: "0.3rem" }}>(optional)</span>}
    </span>
  );
}

// ─── Schema — uses options array to match the Create page and API ─────────────
const schema = z.object({
  subjectId:        z.string().min(1, "Subject is required"),
  chapterId:        z.string().optional(),
  subconceptId:     z.string().optional(),
  gradeLevel:       z.string().optional(),
  question:         z.string().min(5, "Question must be at least 5 characters"),
  difficulty:       z.enum(["easy", "medium", "hard"]).default("medium"),
  marks:            z.coerce.number().min(1).max(100).default(1),
  isMultipleAnswer: z.boolean().default(false),
  explanation:      z.string().optional(),
  options: z.array(z.object({
    text:      z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
  })).min(2, "At least 2 options required"),
});
type FormData = z.infer<typeof schema>;

// ─── Helper: rebuild options array from flat DB row ───────────────────────────
// The DB stores optionA/B/C/D + correctAnswer ("A" | "B" | "A,C").
// The edit form uses an options array just like the create form.
function buildOptionsFromQuestion(q: any): FormData["options"] {
  const correctLetters = (q.correctAnswer as string).split(",").map((s: string) => s.trim());
  const letters = ["A", "B", "C", "D"];
  const raw = [q.optionA, q.optionB, q.optionC, q.optionD];
  return raw
    .map((text: string | null, i: number) => ({ text: text ?? "", isCorrect: correctLetters.includes(letters[i]) }))
    .filter((o: { text: string; isCorrect: boolean }) => o.text !== ""); // drop empty C/D slots
}

export default function EditQuestionPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { toast } = useToast();
  const [loading,     setLoading]     = useState(false);
  const [selSubject,  setSelSubject]  = useState("");
  const [selChapter,  setSelChapter]  = useState("");

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: question, isLoading: qLoading } = useQuery({
    queryKey: ["question", id],
    queryFn:  () => fetch(`/api/questions/${id}`).then((r) => r.json()),
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn:  () => fetch("/api/subjects").then((r) => r.json()),
  });

  const { data: chapters } = useQuery({
    queryKey: ["chapters", selSubject],
    queryFn:  () => fetch(`/api/chapters?subjectId=${selSubject}`).then((r) => r.json()),
    enabled:  !!selSubject,
  });

  const { data: subconcepts } = useQuery({
    queryKey: ["subconcepts", selChapter],
    queryFn:  () => fetch(`/api/subconcepts?chapterId=${selChapter}`).then((r) => r.json()),
    enabled:  !!selChapter,
  });

  // ── Form ───────────────────────────────────────────────────────────────────
  const {
    register, handleSubmit, control, reset, watch, setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const isMultiple = watch("isMultipleAnswer");

  // Pre-fill when question loads
  useEffect(() => {
    if (!question) return;
    const subId = String(question.subjectId);
    const chId  = question.chapterId ? String(question.chapterId) : "";
    setSelSubject(subId);
    setSelChapter(chId);
    reset({
      subjectId:        subId,
      chapterId:        chId || undefined,
      subconceptId:     question.subconceptId ? String(question.subconceptId) : undefined,
      gradeLevel:       question.gradeLevel    ?? undefined,
      question:         question.question,
      difficulty:       question.difficulty,
      marks:            question.marks,
      isMultipleAnswer: question.isMultipleAnswer,
      explanation:      question.explanation ?? "",
      options:          buildOptionsFromQuestion(question),
    });
  }, [question, reset]);

  // ── Submit — sends JSON to PUT /api/questions/[id] ─────────────────────────
  const onSubmit = async (data: FormData) => {
    const hasCorrect = data.options.some((o) => o.isCorrect);
    if (!hasCorrect) {
      toast({ title: "Mark at least one correct answer", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      // Convert options array → flat fields + correctAnswer string for the PUT API
      const LETTERS = ["A", "B", "C", "D"];
      const correctAnswer = data.options
        .map((o, i) => (o.isCorrect ? LETTERS[i] : null))
        .filter(Boolean)
        .join(",");

      const payload = {
        subjectId:        data.subjectId,
        chapterId:        data.chapterId        || null,
        subconceptId:     data.subconceptId     || null,
        gradeLevel:       data.gradeLevel       || null,
        question:         data.question,
        optionA:          data.options[0]?.text ?? "",
        optionB:          data.options[1]?.text ?? "",
        optionC:          data.options[2]?.text || null,
        optionD:          data.options[3]?.text || null,
        correctAnswer,
        isMultipleAnswer: data.isMultipleAnswer,
        explanation:      data.explanation || null,
        marks:            data.marks,
        difficulty:       data.difficulty,
      };

      const res = await fetch(`/api/questions/${id}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to update");
      }

      toast({ title: "Question updated!" });
      router.push("/question-setter/questions");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const diffStyle = {
    easy:   { border: "var(--green)", bg: "var(--green-bg)", text: "var(--green)" },
    medium: { border: "var(--amber)", bg: "var(--amber-bg)", text: "var(--amber)" },
    hard:   { border: "var(--red)",   bg: "var(--red-bg)",   text: "var(--red)"   },
  };

  if (qLoading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text3)" }}>
        Loading question…
      </div>
    );
  }
  if (!question) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--red)" }}>
        Question not found.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/question-setter/questions">
            <button style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--text2)", display: "flex", padding: "0.25rem",
            }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
              Edit Question
            </h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>
              ID #{id}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Link href="/question-setter/questions">
            <button style={{
              padding: "0.45rem 0.9rem", borderRadius: "0.5rem", fontSize: "0.8rem",
              background: "none", border: "1px solid var(--border)", color: "var(--text2)", cursor: "pointer",
            }}>
              Cancel
            </button>
          </Link>
          <button
            onClick={handleSubmit(onSubmit)}
            disabled={loading}
            style={{
              padding: "0.45rem 1.1rem", borderRadius: "0.5rem", fontSize: "0.8rem",
              background: loading ? "var(--accent-dim)" : "var(--accent)",
              border: "none", color: "#fff", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 272px", gap: "1.1rem" }}>
        {/* ════ LEFT ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

          {/* Question text */}
          <Card title="Question">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <FieldLabel>Question text</FieldLabel>
              <textarea
                {...register("question")}
                rows={4}
                style={textareaBase}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              {errors.question && (
                <span style={{ fontSize: "0.72rem", color: "var(--red)" }}>{errors.question.message}</span>
              )}
            </div>
          </Card>

          {/* Options */}
          <Card title="Answer Options">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              {/* MSQ toggle */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Controller name="isMultipleAnswer" control={control} render={({ field }) => (
                  <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--text2)" }}>
                    <div
                      onClick={() => field.onChange(!field.value)}
                      style={{
                        width: "2.5rem", height: "1.35rem", borderRadius: "999px",
                        background: field.value ? "var(--accent)" : "var(--surface3)",
                        border: `1.5px solid ${field.value ? "var(--accent)" : "var(--border)"}`,
                        position: "relative", transition: "all 0.2s", cursor: "pointer",
                      }}
                    >
                      <div style={{
                        width: "1rem", height: "1rem", borderRadius: "50%", background: "#fff",
                        position: "absolute", top: "50%",
                        transform: `translateX(${field.value ? "1.2rem" : "0.1rem"}) translateY(-50%)`,
                        transition: "transform 0.2s",
                      }} />
                    </div>
                    Multiple correct answers (MSQ)
                  </label>
                )} />
              </div>

              {/* Option rows — each is its own block, no hooks in loop */}
              {fields.map((field, index) => {
                const letter = String.fromCharCode(65 + index);
                return (
                  <div key={field.id} style={{
                    border: "1px solid var(--border)", borderRadius: "0.625rem", overflow: "hidden",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", padding: "0.75rem" }}>
                      {/* Correct marker */}
                      <Controller
                        name={`options.${index}.isCorrect`}
                        control={control}
                        render={({ field: f }) => (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isMultiple) {
                                fields.forEach((_, i) => {
                                  if (i !== index) setValue(`options.${i}.isCorrect`, false);
                                });
                              }
                              f.onChange(!f.value);
                            }}
                            style={{
                              flexShrink: 0,
                              width: "1.55rem", height: "1.55rem", borderRadius: "50%",
                              border: `2px solid ${f.value ? "var(--green)" : "var(--border2)"}`,
                              background: f.value ? "var(--green-bg)" : "transparent",
                              color: f.value ? "var(--green)" : "var(--text3)",
                              cursor: "pointer", display: "flex", alignItems: "center",
                              justifyContent: "center", fontSize: "0.7rem", fontWeight: 700,
                              transition: "all 0.12s",
                            }}
                          >
                            {f.value ? <CheckCircle2 size={13} /> : letter}
                          </button>
                        )}
                      />

                      {/* Text */}
                      <Controller
                        name={`options.${index}.text`}
                        control={control}
                        render={({ field: f }) => (
                          <input
                            value={f.value ?? ""}
                            onChange={(e) => f.onChange(e.target.value)}
                            placeholder={`Option ${letter}`}
                            style={{ ...inpBase, flex: 1 }}
                            onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                          />
                        )}
                      />

                      {fields.length > 2 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          style={{
                            flexShrink: 0, background: "none", border: "none",
                            cursor: "pointer", color: "var(--text3)", padding: "0.2rem",
                            borderRadius: "0.25rem", transition: "color 0.12s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {errors.options?.[index]?.text && (
                      <div style={{ padding: "0 0.75rem 0.5rem", fontSize: "0.7rem", color: "var(--red)" }}>
                        {errors.options[index]?.text?.message}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => append({ text: "", isCorrect: false })}
                style={{
                  width: "100%", padding: "0.6rem",
                  border: "1.5px dashed var(--border2)", borderRadius: "0.625rem",
                  background: "none", color: "var(--text3)", cursor: "pointer",
                  fontSize: "0.8rem", display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "0.4rem", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border2)"; e.currentTarget.style.color = "var(--text3)"; }}
              >
                <Plus size={14} /> Add option
              </button>
            </div>
          </Card>

          {/* Explanation */}
          <Card title="Explanation / Solution">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <FieldLabel optional>Explanation shown after submission</FieldLabel>
              <textarea
                {...register("explanation")}
                rows={4}
                placeholder="Write the step-by-step solution here…"
                style={textareaBase}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          </Card>
        </div>

        {/* ════ RIGHT SIDEBAR ════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", position: "sticky", top: "1.5rem" }}>

          {/* Classification */}
          <Card title="Classification">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel>Subject</FieldLabel>
                <Controller name="subjectId" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setSelSubject(e.target.value);
                      setSelChapter("");
                      setValue("chapterId", "");
                      setValue("subconceptId", "");
                    }}
                    style={selBase}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  >
                    <option value="">Select subject</option>
                    {subjects?.map((s: any) => (
                      <option key={s.id} value={String(s.id)}>{s.name}</option>
                    ))}
                  </select>
                )} />
                {errors.subjectId && (
                  <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.subjectId.message}</span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel optional>Chapter</FieldLabel>
                <Controller name="chapterId" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => {
                      field.onChange(e.target.value || undefined);
                      setSelChapter(e.target.value);
                      setValue("subconceptId", "");
                    }}
                    disabled={!selSubject || !chapters?.length}
                    style={{ ...selBase, opacity: (!selSubject || !chapters?.length) ? 0.5 : 1 }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  >
                    <option value="">
                      {!selSubject ? "Select subject first" : !chapters?.length ? "No chapters" : "No chapter (general)"}
                    </option>
                    {chapters?.map((c: any) => (
                      <option key={c.id} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                )} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel optional>Subconcept</FieldLabel>
                <Controller name="subconceptId" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    disabled={!selChapter || !subconcepts?.length}
                    style={{ ...selBase, opacity: (!selChapter || !subconcepts?.length) ? 0.5 : 1 }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  >
                    <option value="">
                      {!selChapter ? "Select chapter first" : !subconcepts?.length ? "No subconcepts" : "Any"}
                    </option>
                    {subconcepts?.map((sc: any) => (
                      <option key={sc.id} value={String(sc.id)}>{sc.name}</option>
                    ))}
                  </select>
                )} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel optional>Grade Level</FieldLabel>
                <Controller name="gradeLevel" control={control} render={({ field }) => (
                  <select
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value || undefined)}
                    style={selBase}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                  >
                    <option value="">Any grade</option>
                    {[6, 7, 8, 9, 10, 11, 12].map((g) => (
                      <option key={g} value={String(g)}>Grade {g}</option>
                    ))}
                  </select>
                )} />
              </div>
            </div>
          </Card>

          {/* Grading */}
          <Card title="Grading">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel>Difficulty</FieldLabel>
                <Controller name="difficulty" control={control} render={({ field }) => (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
                    {(["easy", "medium", "hard"] as const).map((d) => {
                      const dc = diffStyle[d];
                      const active = field.value === d;
                      return (
                        <button key={d} type="button" onClick={() => field.onChange(d)} style={{
                          padding: "0.38rem", borderRadius: "0.4rem",
                          fontSize: "0.7rem", fontWeight: active ? 700 : 500,
                          textTransform: "capitalize",
                          border: `1.5px solid ${active ? dc.border : "var(--border)"}`,
                          background: active ? dc.bg : "var(--surface2)",
                          color: active ? dc.text : "var(--text3)",
                          cursor: "pointer", transition: "all 0.15s",
                        }}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                )} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <FieldLabel>Marks</FieldLabel>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Controller name="marks" control={control} render={({ field }) => (
                    <input
                      type="number" min={1} max={100}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      style={inpBase}
                      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                  )} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text3)", flexShrink: 0 }}>pts</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}