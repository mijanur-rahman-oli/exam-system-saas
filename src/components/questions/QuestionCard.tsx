"use client";
/**
 * Shared components for Question pages:
 *  - KaTeXDisplay       — renders LaTeX inline
 *  - QuestionImageBlock — shows an image with a lightbox on click
 *  - OptionGrid         — renders A/B/C/D option cards with correct highlighting
 *  - QuestionCard       — full expandable card used in list pages
 *
 * Usage:
 *   import { KaTeXDisplay, QuestionCard } from "@/components/questions/QuestionCard";
 */

import { useRef, useEffect, useState } from "react";
import { CheckCircle, Clock, ChevronDown, ChevronUp, Trash2, ZoomIn, X } from "lucide-react";

// ─── KaTeXDisplay ─────────────────────────────────────────────────────────────
export function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, e) => {
          try { return katex.default.renderToString(e, { displayMode: true, throwOnError: false }); }
          catch { return _; }
        })
        .replace(/\$(.+?)\$/g, (_, e) => {
          try { return katex.default.renderToString(e, { displayMode: false, throwOnError: false }); }
          catch { return _; }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);
  return <span ref={ref} style={{ fontSize: "inherit", lineHeight: "inherit", color: "inherit" }} />;
}

// ─── Lightbox ────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: "1rem", right: "1rem",
          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
          width: "2.25rem", height: "2.25rem", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer", color: "#fff",
        }}
      >
        <X size={16} />
      </button>
      <img
        src={src}
        alt="Preview"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain",
          borderRadius: "0.75rem", boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  );
}

// ─── QuestionImageBlock ──────────────────────────────────────────────────────
export function QuestionImageBlock({ src, maxHeight = 160 }: { src: string; maxHeight?: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <Lightbox src={src} onClose={() => setOpen(false)} />}
      <div
        onClick={() => setOpen(true)}
        style={{
          position: "relative", display: "inline-block", cursor: "zoom-in",
          margin: "0.625rem 0",
        }}
      >
        <img
          src={src}
          alt=""
          style={{
            maxHeight, maxWidth: "100%", objectFit: "contain",
            display: "block", borderRadius: "0.5rem",
            border: "1px solid var(--border)",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        />
        <div style={{
          position: "absolute", bottom: "0.35rem", right: "0.35rem",
          background: "rgba(0,0,0,0.5)", borderRadius: "0.25rem",
          padding: "0.15rem 0.3rem", display: "flex", alignItems: "center",
          gap: "0.2rem",
        }}>
          <ZoomIn size={10} color="#fff" />
        </div>
      </div>
    </>
  );
}

// ─── OptionGrid ──────────────────────────────────────────────────────────────
export function OptionGrid({ question }: { question: any }) {
  const opts = [
    { key: "A", text: question.optionA, img: question.optionAImage },
    { key: "B", text: question.optionB, img: question.optionBImage },
    { key: "C", text: question.optionC, img: question.optionCImage },
    { key: "D", text: question.optionD, img: question.optionDImage },
  ].filter((o) => o.text || o.img);

  const correctLetters = (question.correctAnswer ?? "").split(",").map((s: string) => s.trim());

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem 1.25rem", marginTop: "0.75rem" }}>
      {opts.map((opt) => {
        const correct = correctLetters.includes(opt.key);
        return (
          <div
            key={opt.key}
            style={{
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              background: correct ? "var(--green-bg)" : "var(--surface2)",
              border: `1px solid ${correct ? "var(--green)" : "var(--border)"}`,
              display: "flex", gap: "0.5rem", alignItems: "flex-start",
            }}
          >
            <span style={{ fontWeight: 700, fontSize: "0.72rem", color: correct ? "var(--green)" : "var(--text3)", flexShrink: 0 }}>
              {opt.key}.
            </span>
            <div>
              {opt.text && <KaTeXDisplay text={opt.text} />}
              {opt.img && <QuestionImageBlock src={opt.img} maxHeight={80} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── QuestionCard ────────────────────────────────────────────────────────────
interface QuestionCardProps {
  question: any;
  expanded: boolean;
  onToggle: () => void;
  onDelete?: (id: number) => void;
  onPublish?: (id: number) => void;
  editHref?: string;
  isDeleting?: boolean;
  isPublishing?: boolean;
}

const diffColor: Record<string, string> = {
  easy: "var(--green)",
  medium: "var(--amber)",
  hard: "var(--red)",
};

export function QuestionCard({
  question: q,
  expanded: open,
  onToggle,
  onDelete,
  onPublish,
  editHref,
  isDeleting,
  isPublishing,
}: QuestionCardProps) {
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${open ? "var(--accent-dim)" : "var(--border)"}`,
      borderRadius: "var(--radius)",
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      {/* ── Header row ── */}
      <div
        style={{ padding: "0.875rem 1.25rem", display: "flex", alignItems: "flex-start", gap: "0.875rem", cursor: "pointer" }}
        onClick={onToggle}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "0.85rem", color: "var(--text)", lineHeight: 1.6,
            overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: open ? undefined : 2,
            WebkitBoxOrient: "vertical" as any,
          }}>
            <KaTeXDisplay text={q.question} />
          </div>

          {/* Thumbnail strip when collapsed */}
          {!open && q.questionImage && (
            <img
              src={q.questionImage}
              alt=""
              style={{ maxHeight: 40, maxWidth: 80, objectFit: "contain", marginTop: "0.3rem", borderRadius: "0.25rem", border: "1px solid var(--border)", display: "block" }}
            />
          )}

          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.65rem", color: diffColor[q.difficulty] ?? "var(--text3)", fontWeight: 600 }}>{q.difficulty}</span>
            <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>·</span>
            <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>{q.subject?.name}</span>
            <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>· {q.marks}m</span>
            {q.isMultipleAnswer && (
              <span style={{ fontSize: "0.6rem", color: "var(--accent)", background: "var(--accent-bg)", padding: "0.1rem 0.35rem", borderRadius: "999px" }}>MSQ</span>
            )}
            {q.tags?.map((t: any) => (
              <span key={t.tag?.name} style={{ fontSize: "0.65rem", color: "var(--accent)", background: "var(--accent-bg)", padding: "0.1rem 0.35rem", borderRadius: "999px" }}>
                #{t.tag?.name}
              </span>
            ))}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
          <span style={{
            fontSize: "0.65rem", fontWeight: 700, padding: "0.2rem 0.5rem",
            borderRadius: "999px",
            background: q.status === "published" ? "var(--green-bg)" : "var(--amber-bg)",
            color: q.status === "published" ? "var(--green)" : "var(--amber)",
          }}>
            {q.status === "published"
              ? <><CheckCircle size={10} style={{ verticalAlign: "middle" }} /> Published</>
              : <><Clock size={10} style={{ verticalAlign: "middle" }} /> Draft</>}
          </span>

          {q.status !== "published" && onPublish && (
            <button
              onClick={(e) => { e.stopPropagation(); onPublish(q.id); }}
              disabled={isPublishing}
              style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderRadius: "0.375rem", border: "1px solid var(--green)", background: "var(--green-bg)", color: "var(--green)", cursor: "pointer", fontWeight: 600, opacity: isPublishing ? 0.6 : 1 }}
            >
              Publish
            </button>
          )}

          {editHref && (
            <a
              href={editHref}
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderRadius: "0.375rem", border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text2)", cursor: "pointer", fontWeight: 600, textDecoration: "none" }}
            >
              Edit
            </a>
          )}

          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm("Delete this question?")) onDelete(q.id); }}
              disabled={isDeleting}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text3)", display: "flex", padding: "0.2rem", opacity: isDeleting ? 0.5 : 1 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
            >
              <Trash2 size={14} />
            </button>
          )}

          {open ? <ChevronUp size={15} color="var(--text3)" /> : <ChevronDown size={15} color="var(--text3)" />}
        </div>
      </div>

      {/* ── Expanded body ── */}
      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          {/* Question image */}
          {q.questionImage && (
            <QuestionImageBlock src={q.questionImage} maxHeight={200} />
          )}

          {/* Options */}
          <OptionGrid question={q} />

          {/* Explanation */}
          {(q.explanation || q.solutionImage) && (
            <div style={{
              marginTop: "0.875rem", padding: "0.75rem 0.875rem",
              borderRadius: "0.5rem", background: "var(--amber-bg)",
              border: "1px solid var(--amber)",
            }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--amber)", marginBottom: q.explanation ? "0.3rem" : 0 }}>
                💡 Explanation
              </div>
              {q.explanation && (
                <div style={{ fontSize: "0.8rem", color: "var(--text)", lineHeight: 1.6 }}>
                  <KaTeXDisplay text={q.explanation} />
                </div>
              )}
              {q.solutionImage && (
                <QuestionImageBlock src={q.solutionImage} maxHeight={160} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}