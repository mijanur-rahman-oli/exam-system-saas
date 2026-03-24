"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, AlertCircle, CheckCircle } from "lucide-react";

type Answer = { questionId: number; selectedAnswer: string };

// ─── KaTeX renderer ───────────────────────────────────────────────────────────
function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: true,  throwOnError: false }); }
          catch { return _; }
        })
        .replace(/\$(.+?)\$/g, (_, expr) => {
          try { return katex.default.renderToString(expr, { displayMode: false, throwOnError: false }); }
          catch { return _; }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);
  return <span ref={ref} style={{ fontSize: "inherit", lineHeight: "inherit", color: "inherit" }} />;
}

export default function TakeExamPage() {
  const { examId } = useParams<{ examId: string }>();
  const router = useRouter();

  const [answers,      setAnswers]      = useState<Record<number, string>>({});
  const [timeLeft,     setTimeLeft]     = useState<number | null>(null);
  const [attemptId,    setAttemptId]    = useState<number | null>(null);
  const [examStarted,  setExamStarted]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startError,   setStartError]   = useState("");
  const initialized = useRef(false);

  const { data: exam, isLoading: examLoading } = useQuery({
    queryKey: ["exam-take", examId],
    queryFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}`);
      if (!res.ok) throw new Error("Failed to fetch exam");
      return res.json();
    },
  });

  const startMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/student/exams/${examId}/start`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start exam");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setAttemptId(data.attemptId);
      setTimeLeft(data.remaining ?? data.duration * 60);
      setExamStarted(true);
    },
    onError: (err: any) => setStartError(err.message),
  });

  const submitExam = useCallback(async (forced = false) => {
    if (isSubmitting || !attemptId) return;
    setIsSubmitting(true);
    const formatted: Answer[] = Object.entries(answers).map(([qId, ans]) => ({
      questionId: parseInt(qId),
      selectedAnswer: ans,
    }));
    try {
      const res = await fetch(`/api/student/exams/${examId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, answers: formatted }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Submit failed");
      }
      const data = await res.json();
      router.push(`/student/results/${data.resultId}`);
    } catch (err: any) {
      alert(err.message);
      setIsSubmitting(false);
    }
  }, [attemptId, answers, examId, isSubmitting, router]);

  useEffect(() => {
    if (initialized.current || !exam || examLoading) return;
    initialized.current = true;
    startMutation.mutate();
  }, [exam, examLoading]); // eslint-disable-line

  useEffect(() => {
    if (!examStarted || timeLeft === null || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((p) => {
        if (p === null || p <= 1) { clearInterval(t); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [examStarted, timeLeft]);

  useEffect(() => {
    if (examStarted && timeLeft === 0) submitExam(true);
  }, [timeLeft]); // eslint-disable-line

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const questions = exam?.examQuestions ?? [];
  const total     = questions.length;
  const answered  = Object.keys(answers).length;
  const isLowTime = timeLeft !== null && timeLeft < 120;

  if (examLoading || startMutation.isPending || !examStarted || !exam) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "2.5rem", height: "2.5rem", border: "3px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text3)", fontSize: "0.85rem" }}>
          {examLoading ? "Loading exam..." : "Starting exam..."}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (startError) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", maxWidth: "420px", width: "100%", textAlign: "center" }}>
          <AlertCircle size={36} color="var(--red)" style={{ margin: "0 auto 1rem", display: "block" }} />
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", margin: "0 0 0.5rem" }}>Cannot Start Exam</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginBottom: "1.25rem" }}>{startError}</p>
          <button onClick={() => router.push("/student/exams")} style={{ padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}>
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (examStarted && total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "2rem", textAlign: "center" }}>
          <AlertCircle size={36} color="var(--red)" style={{ margin: "0 auto 1rem", display: "block" }} />
          <p style={{ color: "var(--text2)" }}>This exam has no questions or is unavailable.</p>
          <button onClick={() => router.push("/student/exams")} style={{ marginTop: "1rem", padding: "0.5rem 1.25rem", borderRadius: "0.4rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0", margin: "-2rem" }}>

      {/* KaTeX CSS */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      {/* Sticky header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        background: "var(--surface)", borderBottom: "1px solid var(--border)",
        padding: "0.875rem 2rem", boxShadow: "var(--shadow)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>
              {exam.examName}
            </h2>
            <p style={{ fontSize: "0.72rem", color: "var(--text3)", margin: 0 }}>
              {exam.course?.name && <span style={{ color: "var(--accent)", marginRight: "0.4rem" }}>{exam.course.name} ·</span>}
              {answered} of {total} answered
            </p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.5rem 1.1rem", borderRadius: "999px",
            fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace",
            background: isLowTime ? "var(--red-bg)" : "var(--accent-bg)",
            color: isLowTime ? "var(--red)" : "var(--accent)",
            border: `1px solid ${isLowTime ? "var(--red)" : "var(--accent-dim)"}`,
            animation: isLowTime ? "pulse 1s infinite" : "none",
          }}>
            <Clock size={15} />
            {timeLeft !== null ? fmt(timeLeft) : "--:--"}
          </div>
        </div>
        <div style={{ height: "3px", background: "var(--border)", borderRadius: "2px", marginTop: "0.75rem" }}>
          <div style={{ height: "100%", width: `${total > 0 ? (answered / total) * 100 : 0}%`, background: "var(--accent)", borderRadius: "2px", transition: "width 0.3s" }} />
        </div>
      </div>

      {/* All questions */}
      <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {questions.map((item: any, idx: number) => {
          const q        = item.question;
          const qId      = q.id;
          const selected = answers[qId];
          const opts     = [
            { key: "A", text: q.optionA, img: q.optionAImage },
            { key: "B", text: q.optionB, img: q.optionBImage },
            { key: "C", text: q.optionC, img: q.optionCImage },
            { key: "D", text: q.optionD, img: q.optionDImage },
          ].filter((o) => o.text || o.img);

          return (
            <div
              key={qId}
              style={{
                background: "var(--surface)",
                border: `1px solid ${selected ? "var(--accent-dim)" : "var(--border)"}`,
                borderRadius: "var(--radius)", padding: "1.5rem",
                boxShadow: "var(--shadow)", transition: "border-color 0.2s",
              }}
            >
              {/* Question text + image */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--text)" }}>
                    <span style={{ fontWeight: 800, color: "var(--accent)", marginRight: "0.5rem" }}>Q{idx + 1}.</span>
                    <KaTeXDisplay text={q.question} />
                  </div>
                  {q.questionImage && (
                    <img
                      src={q.questionImage}
                      alt="question"
                      style={{ marginTop: "0.75rem", maxHeight: "240px", maxWidth: "100%", objectFit: "contain", borderRadius: "0.5rem", border: "1px solid var(--border)", display: "block" }}
                    />
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                  {selected && <CheckCircle size={16} color="var(--green)" />}
                  <span style={{ fontSize: "0.68rem", color: "var(--text3)", background: "var(--surface2)", padding: "0.2rem 0.5rem", borderRadius: "999px", whiteSpace: "nowrap" }}>
                    {item.marks} mark{item.marks !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {opts.map((opt) => {
                  const isSelected = selected === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setAnswers((p) => ({ ...p, [qId]: opt.key }))}
                      style={{
                        textAlign: "left", padding: "0.75rem 1rem",
                        borderRadius: "0.5rem", cursor: "pointer", transition: "all 0.12s",
                        border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        background: isSelected ? "var(--accent-bg)" : "var(--surface)",
                        display: "flex", alignItems: "flex-start", gap: "0.75rem",
                        fontSize: "0.87rem", color: "var(--text)", width: "100%",
                      }}
                    >
                      <div style={{
                        width: "1.75rem", height: "1.75rem", borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${isSelected ? "var(--accent)" : "var(--border2)"}`,
                        background: isSelected ? "var(--accent)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.72rem", fontWeight: 800,
                        color: isSelected ? "#fff" : "var(--text3)",
                        transition: "all 0.12s", marginTop: "0.1rem",
                      }}>
                        {opt.key}
                      </div>
                      <div style={{ flex: 1 }}>
                        <KaTeXDisplay text={opt.text} />
                        {opt.img && (
                          <img
                            src={opt.img}
                            alt={`option ${opt.key}`}
                            style={{ marginTop: "0.5rem", maxHeight: "160px", maxWidth: "100%", objectFit: "contain", borderRadius: "0.375rem", border: "1px solid var(--border)", display: "block" }}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Submit button */}
        <div style={{ position: "sticky", bottom: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              const unanswered = total - answered;
              const msg = unanswered > 0
                ? `You have ${unanswered} unanswered question(s). Submit anyway?`
                : "Submit your exam?";
              if (confirm(msg)) submitExam(false);
            }}
            disabled={isSubmitting}
            style={{
              padding: "0.75rem 2.5rem", borderRadius: "0.5rem",
              border: "none", background: isSubmitting ? "var(--border)" : "var(--green)",
              color: "#fff", cursor: isSubmitting ? "not-allowed" : "pointer",
              fontWeight: 800, fontSize: "0.95rem", opacity: isSubmitting ? 0.7 : 1,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            {isSubmitting ? "Submitting..." : `Submit Exam (${answered}/${total} answered)`}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>
    </div>
  );
}