"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
  ArrowLeft, Plus, Trash2, ImageIcon,
  FunctionSquare, X, CheckCircle2, Upload,
  Eye, EyeOff, AlignLeft, Save, Tag, ChevronDown
} from "lucide-react";

// ─── KaTeX renderer ───────────────────────────────────────────────────────────
function KaTeXDisplay({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
          try {
            return katex.default.renderToString(expr, { displayMode: true, throwOnError: false });
          } catch { return _; }
        })
        .replace(/\$(.+?)\$/g, (_, expr) => {
          try {
            return katex.default.renderToString(expr, { displayMode: false, throwOnError: false });
          } catch { return _; }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);

  return (
    <div
      ref={ref}
      style={{ fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text)" }}
    />
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────
const schema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  question: z.string().min(5, "Question must be at least 5 characters"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  marks: z.coerce.number().min(1).max(100).default(1),
  isMultipleAnswer: z.boolean().default(false),
  options: z.array(z.object({
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
  })).min(2, "At least 2 options required"),
  solutionType: z.enum(["none", "text", "image"]).default("none"),
  solutionText: z.string().optional(),
  tags: z.array(z.string()).default([]),
});
type FormData = z.infer<typeof schema>;

// ─── LaTeX snippets ───────────────────────────────────────────────────────────
const SNIPPETS = [
  { label: "\\frac{a}{b}", val: "\\frac{a}{b}" },
  { label: "\\sqrt{x}", val: "\\sqrt{x}" },
  { label: "x^{n}", val: "x^{n}" },
  { label: "x_{n}", val: "x_{n}" },
  { label: "\\sum", val: "\\sum_{i=1}^{n}" },
  { label: "\\int", val: "\\int_{a}^{b}" },
  { label: "\\lim", val: "\\lim_{x \\to \\infty}" },
  { label: "\\alpha", val: "\\alpha" },
  { label: "\\beta", val: "\\beta" },
  { label: "\\pi", val: "\\pi" },
  { label: "\\infty", val: "\\infty" },
  { label: "\\pm", val: "\\pm" },
  { label: "\\leq", val: "\\leq" },
  { label: "\\geq", val: "\\geq" },
  { label: "\\to", val: "\\to" },
  { label: "\\neq", val: "\\neq" },
  { label: "\\times", val: "\\times" },
  { label: "\\div", val: "\\div" },
];

// ─── Tag Input Component ──────────────────────────────────────────────────────
function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/tags?search=${encodeURIComponent(input)}`)
        .then(r => r.json())
        .then(d => setSuggestions(Array.isArray(d) ? d : []))
        .catch(() => { });
    }, 250);
    return () => clearTimeout(timer);
  }, [input]);

  const addTag = (name: string) => {
    const n = name.toLowerCase().trim();
    if (n && !tags.includes(n)) {
      onChange([...tags, n]);
    }
    setInput("");
    setSuggestions([]);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.5rem",
        padding: "0.5rem",
        borderRadius: "0.5rem",
        border: "1.5px solid var(--border)",
        background: "var(--input-bg)",
        minHeight: "2.5rem",
        alignItems: "center",
      }}>
        {tags.map(tag => (
          <span
            key={tag}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "999px",
              background: "var(--accent-bg)",
              border: "1px solid var(--accent-dim)",
              fontSize: "0.75rem",
              color: "var(--accent)",
              fontWeight: 600,
            }}
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--accent)",
                display: "flex",
                padding: 0,
              }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (input.trim()) addTag(input.trim());
            }
          }}
          placeholder={tags.length === 0 ? "Add tags (e.g., algebra, calculus)..." : ""}
          style={{
            border: "none",
            background: "transparent",
            outline: "none",
            fontSize: "0.8rem",
            color: "var(--text)",
            minWidth: "100px",
            flex: 1,
          }}
        />
      </div>
      {suggestions.length > 0 && (
        <div style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          zIndex: 20,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "0.5rem",
          boxShadow: "var(--shadow)",
          maxHeight: "160px",
          overflowY: "auto",
          marginTop: "0.25rem",
        }}>
          {suggestions.map((s: any) => (
            <div
              key={s.id}
              onClick={() => addTag(s.name)}
              style={{
                padding: "0.5rem 0.875rem",
                cursor: "pointer",
                fontSize: "0.8rem",
                color: "var(--text2)",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              #{s.name} <span style={{ color: "var(--text3)", fontSize: "0.7rem" }}>({s._count?.questions ?? 0})</span>
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: "0.65rem", color: "var(--text3)", marginTop: "0.3rem" }}>
        Press Enter or comma to add a tag
      </p>
    </div>
  );
}

// ─── Image dropzone ───────────────────────────────────────────────────────────
function ImgDrop({ value, onChange, label = "Add image", compact = false }: {
  value: File | null; onChange: (f: File | null) => void; label?: string; compact?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const r = new FileReader();
      r.onload = (e) => setPreview(e.target?.result as string);
      r.readAsDataURL(value);
    } else {
      setPreview(null);
    }
  }, [value]);

  const handle = (file: File) => {
    onChange(file);
  };

  return (
    <div
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith("image/")) handle(f); }}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => ref.current?.click()}
      style={{ cursor: "pointer", borderRadius: "0.5rem", border: "2px dashed var(--border2)", background: "var(--surface2)", transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border2)")}
    >
      {preview ? (
        <div style={{ position: "relative", padding: "0.5rem" }}>
          <img src={preview} alt="preview" style={{ maxHeight: "9rem", margin: "0 auto", display: "block", borderRadius: "0.375rem", objectFit: "contain" }} />
          <button type="button" onClick={(e) => { e.stopPropagation(); onChange(null); setPreview(null); }}
            style={{ position: "absolute", top: "0.25rem", right: "0.25rem", background: "var(--red)", color: "#fff", border: "none", borderRadius: "50%", width: "1.25rem", height: "1.25rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={10} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem", padding: compact ? "0.65rem" : "1.25rem" }}>
          <Upload size={16} style={{ color: "var(--text3)" }} />
          <span style={{ fontSize: "0.72rem", color: "var(--text2)" }}>{label}</span>
          {!compact && <span style={{ fontSize: "0.65rem", color: "var(--text3)" }}>drag & drop or click</span>}
        </div>
      )}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

// ─── Rich text / LaTeX field with preview and clickable snippets ─────────────
function RichField({ value, onChange, placeholder, multiline = false, label }: {
  value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean; label?: string;
}) {
  const [mode, setMode] = useState<"text" | "latex">("latex");
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const insertSnippet = (snippet: string) => {
    const el = multiline ? textareaRef.current : inputRef.current;
    const textToInsert = `$${snippet}$`;

    if (el) {
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const newValue = value.slice(0, start) + textToInsert + value.slice(end);
      onChange(newValue);
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
      }, 0);
    } else {
      onChange(value + textToInsert);
    }
  };

  const base: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "1.5px solid var(--border)",
    color: "var(--text)",
    fontFamily: mode === "latex" ? "monospace" : "inherit",
    fontSize: "0.85rem",
    borderRadius: "0.5rem",
    width: "100%",
    padding: "0.6rem 0.75rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {label && (
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>{label}</span>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
        <div style={{
          display: "flex",
          borderRadius: "0.375rem",
          overflow: "hidden",
          border: "1px solid var(--border)",
          fontSize: "0.68rem"
        }}>
          {(["text", "latex"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: "0.28rem 0.7rem",
                background: mode === m ? "var(--accent)" : "var(--surface2)",
                color: mode === m ? "#fff" : "var(--text2)",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                transition: "all 0.12s",
              }}
            >
              {m === "text" ? <AlignLeft size={11} /> : <FunctionSquare size={11} />}
              <span>{m === "text" ? "Text" : "LaTeX"}</span>
            </button>
          ))}
        </div>

        {mode === "latex" && value && value.trim() && (
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            style={{
              fontSize: "0.68rem",
              color: "var(--text2)",
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.2rem",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.375rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            {showPreview ? <EyeOff size={11} /> : <Eye size={11} />}
            {showPreview ? "Hide preview" : "Preview"}
          </button>
        )}
      </div>

      {multiline ? (
        <textarea
          ref={textareaRef}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" ? "Use $...$ for inline math or $$...$$ for display math" : placeholder}
          rows={4}
          style={{ ...base, resize: "vertical", lineHeight: 1.6 }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      ) : (
        <input
          ref={inputRef}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={mode === "latex" ? "Use $...$ for math (e.g., $E = mc^2$)" : placeholder}
          style={{ ...base, height: "2.4rem" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      )}

      {mode === "latex" && (
        <div style={{
          marginTop: "0.5rem",
          padding: "0.5rem",
          background: "var(--surface2)",
          borderRadius: "0.5rem",
          border: "1px solid var(--border)"
        }}>
          <div style={{
            fontSize: "0.65rem",
            fontWeight: 600,
            color: "var(--text2)",
            marginBottom: "0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem"
          }}>
            <FunctionSquare size={12} />
            <span>Quick LaTeX Snippets (click to insert)</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {SNIPPETS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => insertSnippet(s.val)}
                style={{
                  fontSize: "0.7rem",
                  padding: "0.25rem 0.7rem",
                  borderRadius: "0.375rem",
                  fontFamily: "monospace",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--accent)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-bg)";
                  e.currentTarget.style.borderColor = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--surface)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <p style={{
            fontSize: "0.6rem",
            color: "var(--text3)",
            margin: "0.5rem 0 0 0",
            padding: "0.25rem 0",
            borderTop: "1px solid var(--border)",
            marginTop: "0.5rem"
          }}>
            💡 Tip: Click any snippet to insert at cursor position
          </p>
        </div>
      )}

      {mode === "latex" && showPreview && value && value.trim() && (
        <div style={{
          padding: "0.875rem 1rem",
          borderRadius: "0.5rem",
          background: "var(--surface2)",
          border: "1px solid var(--accent-dim)",
          maxHeight: "300px",
          overflow: "auto"
        }}>
          <div style={{
            fontSize: "0.6rem",
            color: "var(--text3)",
            display: "block",
            marginBottom: "0.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            fontWeight: 600
          }}>
            Rendered Preview
          </div>
          <KaTeXDisplay text={value} />
        </div>
      )}
    </div>
  );
}

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
      {title && (
        <div style={{ padding: "0.7rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text2)" }}>{title}</span>
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

const selBase: React.CSSProperties = {
  width: "100%", height: "2.1rem", padding: "0 0.7rem",
  borderRadius: "0.5rem", background: "var(--input-bg)",
  border: "1.5px solid var(--border)", color: "var(--text)",
  fontSize: "0.8rem", outline: "none", appearance: "none" as any,
  boxSizing: "border-box", transition: "border-color 0.15s",
};
const inpBase: React.CSSProperties = { ...selBase, appearance: undefined };

function OptionRow({ index, control, errors, isMultiple, fields, setValue, optionImages, setOptionImages, onRemove, canRemove }: {
  index: number; control: any; errors: any; isMultiple: boolean; fields: any[];
  setValue: any; optionImages: (File | null)[]; setOptionImages: React.Dispatch<React.SetStateAction<(File | null)[]>>;
  onRemove: () => void; canRemove: boolean;
}) {
  const [showImg, setShowImg] = useState(false);
  const letter = String.fromCharCode(65 + index);

  return (
    <div style={{
      border: `1.5px solid ${control._formValues?.options?.[index]?.isCorrect ? "var(--green)" : "var(--border)"}`,
      borderRadius: "0.625rem",
      overflow: "hidden",
      marginBottom: "0.75rem"
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "0.65rem", padding: "0.75rem" }}>
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
                marginTop: "0.2rem",
                width: "1.55rem",
                height: "1.55rem",
                borderRadius: "50%",
                border: `2px solid ${f.value ? "var(--green)" : "var(--border2)"}`,
                background: f.value ? "var(--green)" : "transparent",
                color: f.value ? "#fff" : "var(--text3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
              }}
            >
              {f.value ? <CheckCircle2 size={13} /> : letter}
            </button>
          )}
        />

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <Controller
            name={`options.${index}.text`}
            control={control}
            render={({ field: f }) => (
              <RichField
                value={f.value || ""}
                onChange={f.onChange}
                placeholder={`Option ${letter}`}
              />
            )}
          />
          {errors.options?.[index]?.text && (
            <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>
              {errors.options[index]?.text?.message}
            </span>
          )}

          <button
            type="button"
            onClick={() => setShowImg(!showImg)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "0.68rem",
              color: "var(--text3)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: 0,
              width: "fit-content",
            }}
          >
            <ImageIcon size={10} />
            {showImg ? "Remove image" : "Add image to this option"}
          </button>

          {showImg && (
            <ImgDrop
              compact
              value={optionImages[index] ?? null}
              onChange={(f) => setOptionImages(prev => {
                const next = [...prev];
                next[index] = f;
                return next;
              })}
              label={`Image for option ${letter}`}
            />
          )}
        </div>

        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text3)",
              padding: "0.2rem",
              borderRadius: "0.25rem",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text3)")}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminCreateQuestionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [questionImage, setQuestionImage] = useState<File | null>(null);
  const [solutionImage, setSolutionImage] = useState<File | null>(null);
  const [optionImages, setOptionImages] = useState<(File | null)[]>([null, null, null, null]);

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => fetch("/api/subjects?scope=all").then(r => r.json()).then(d => Array.isArray(d) ? d : [])
  });

  const { handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      marks: 1,
      difficulty: "medium",
      isMultipleAnswer: false,
      solutionType: "none",
      solutionText: "",
      tags: [],
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const isMultiple = watch("isMultipleAnswer");
  const solutionType = watch("solutionType");

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const fd = new FormData();
      fd.append("subjectId", data.subjectId);
      fd.append("question", data.question);
      fd.append("difficulty", data.difficulty);
      fd.append("marks", String(data.marks));
      fd.append("isMultipleAnswer", String(data.isMultipleAnswer));
      fd.append("solutionType", data.solutionType);
      fd.append("options", JSON.stringify(data.options.map(o => ({ text: o.text, isCorrect: o.isCorrect }))));
      fd.append("tags", JSON.stringify(data.tags));
      fd.append("status", "published");

      if (data.solutionType === "text" && data.solutionText) {
        fd.append("explanation", data.solutionText);
      }
      if (questionImage) {
        fd.append("questionImage", questionImage);
      }
      if (data.solutionType === "image" && solutionImage) {
        fd.append("solutionImage", solutionImage);
      }
      optionImages.forEach((img, i) => {
        if (img) fd.append(`optionImage_${i}`, img);
      });

      const res = await fetch("/api/questions", { method: "POST", body: fd });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Failed to save");
      return d;
    },
    onSuccess: () => {
      toast({ title: "Question saved and published!" });
      router.push("/question-setter/questions");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const onSubmit = async (data: FormData) => {
    if (!data.options.some(o => o.isCorrect)) {
      toast({ title: "Mark at least one correct answer", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await saveMutation.mutateAsync(data);
    } finally {
      setLoading(false);
    }
  };

  const diffStyle = {
    easy: { border: "var(--green)", bg: "var(--green-bg)", text: "var(--green)" },
    medium: { border: "var(--amber)", bg: "var(--amber-bg)", text: "var(--amber)" },
    hard: { border: "var(--red)", bg: "var(--red-bg)", text: "var(--red)" },
  };

  const validOpts = fields.filter(f => f.text?.trim());
  const hasCorrect = fields.some((_, i) => control._formValues?.options?.[i]?.isCorrect);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <Link href="/question-setter/questions">
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex", padding: "0.25rem" }}>
              <ArrowLeft size={18} />
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>Create Question</h1>
            <p style={{ fontSize: "0.78rem", color: "var(--text3)", margin: 0 }}>Supports LaTeX math with clickable snippets</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <select value="published" style={{
              height: "2.1rem", padding: "0 2rem 0 0.75rem",
              borderRadius: "0.5rem", border: "1px solid var(--border)",
              background: "var(--surface2)", color: "var(--text2)",
              fontSize: "0.78rem", outline: "none", appearance: "none" as const, cursor: "pointer",
            }}>
              <option value="published">Publish</option>
            </select>
            <ChevronDown size={12} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }} />
          </div>
          <button onClick={handleSubmit(onSubmit)} disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: loading ? "var(--accent-dim)" : "var(--accent)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}>
            <Save size={14} />
            {loading ? "Saving..." : "Save Question"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: "1.25rem", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Card title="Question">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Controller name="question" control={control} render={({ field }) => (
                <RichField
                  value={field.value || ""}
                  onChange={field.onChange}
                  placeholder="Type your question here..."
                  multiline
                />
              )} />
              {errors.question && <span style={{ fontSize: "0.72rem", color: "var(--red)" }}>{errors.question.message}</span>}
              <div>
                <p style={{ fontSize: "0.7rem", color: "var(--text3)", marginBottom: "0.4rem" }}>Question image (optional)</p>
                <ImgDrop value={questionImage} onChange={setQuestionImage} label="Attach image to question" />
              </div>
            </div>
          </Card>

          <Card title="Answer Options">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text2)" }}>
                  Click the circle to mark correct answer{isMultiple ? "s" : ""}
                </span>
                <Controller name="isMultipleAnswer" control={control} render={({ field }) => (
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.75rem", color: "var(--text2)" }}>
                    <div
                      onClick={() => field.onChange(!field.value)}
                      style={{
                        width: "2.5rem", height: "1.35rem", borderRadius: "999px",
                        background: field.value ? "var(--accent)" : "var(--surface3)",
                        border: `1.5px solid ${field.value ? "var(--accent)" : "var(--border)"}`,
                        position: "relative", transition: "all 0.2s", cursor: "pointer",
                      }}>
                      <div style={{
                        width: "1rem", height: "1rem", borderRadius: "50%", background: "#fff",
                        position: "absolute", top: "50%",
                        transform: `translateX(${field.value ? "1.2rem" : "0.1rem"}) translateY(-50%)`,
                        transition: "transform 0.2s",
                      }} />
                    </div>
                    Multiple correct (MSQ)
                  </label>
                )} />
              </div>

              {fields.map((field, index) => (
                <OptionRow
                  key={field.id}
                  index={index}
                  control={control}
                  errors={errors}
                  isMultiple={isMultiple}
                  fields={fields}
                  setValue={setValue}
                  optionImages={optionImages}
                  setOptionImages={setOptionImages}
                  onRemove={() => {
                    remove(index);
                    setOptionImages(prev => prev.filter((_, i) => i !== index));
                  }}
                  canRemove={fields.length > 2}
                />
              ))}

              {fields.length < 6 && (
                <button type="button" onClick={() => { append({ text: "", isCorrect: false }); setOptionImages(prev => [...prev, null]); }}
                  style={{ width: "100%", padding: "0.6rem", border: "1.5px dashed var(--border)", borderRadius: "0.625rem", background: "none", color: "var(--text3)", cursor: "pointer", fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", transition: "all 0.12s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent)"; e.currentTarget.style.background = "var(--accent-bg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.background = "none"; }}>
                  <Plus size={14} /> Add option
                </button>
              )}

              <div style={{ display: "flex", gap: "1rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)", fontSize: "0.7rem" }}>
                <span style={{ color: validOpts.length >= 2 ? "var(--green)" : "var(--text3)" }}>
                  {validOpts.length >= 2 ? "✓" : "○"} {validOpts.length}/2 min options
                </span>
                <span style={{ color: hasCorrect ? "var(--green)" : "var(--red)" }}>
                  {hasCorrect ? "✓ Correct answer set" : "✗ No correct answer"}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Solution / Explanation">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <Controller name="solutionType" control={control} render={({ field }) => (
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {([{ val: "none", label: "None" }, { val: "text", label: "Written solution" }, { val: "image", label: "Image solution" }] as const).map(opt => (
                    <button key={opt.val} type="button" onClick={() => field.onChange(opt.val)}
                      style={{ padding: "0.38rem 0.875rem", borderRadius: "0.4rem", fontSize: "0.75rem", fontWeight: field.value === opt.val ? 700 : 500, border: `1.5px solid ${field.value === opt.val ? "var(--accent)" : "var(--border)"}`, background: field.value === opt.val ? "var(--accent-bg)" : "var(--surface2)", color: field.value === opt.val ? "var(--accent)" : "var(--text2)", cursor: "pointer" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )} />
              {solutionType === "text" && (
                <Controller name="solutionText" control={control} render={({ field }) => (
                  <RichField
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="Write step-by-step solution..."
                    multiline
                    label="Solution"
                  />
                )} />
              )}
              {solutionType === "image" && (
                <ImgDrop value={solutionImage} onChange={setSolutionImage} label="Upload solution image" />
              )}
              {solutionType === "none" && (
                <p style={{ fontSize: "0.78rem", color: "var(--text3)", textAlign: "center" }}>No solution attached.</p>
              )}
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", position: "sticky", top: "1.5rem" }}>
          <Card title="Classification">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>
                  Subject <span style={{ color: "var(--red)" }}>*</span>
                </span>
                <div style={{ position: "relative" }}>
                  <Controller name="subjectId" control={control} render={({ field }) => (
                    <select
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      style={{
                        width: "100%", height: "2.25rem", padding: "0 2rem 0 0.75rem",
                        borderRadius: "0.5rem", border: "1.5px solid var(--border)",
                        background: "var(--input-bg)", color: field.value ? "var(--text)" : "var(--text3)",
                        fontSize: "0.82rem", outline: "none", appearance: "none" as const,
                        boxSizing: "border-box",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}>
                      <option value="">Select subject</option>
                      {(subjects || []).map((s: any) => (
                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                      ))}
                    </select>
                  )} />
                  <ChevronDown size={12} style={{ position: "absolute", right: "0.6rem", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }} />
                </div>
                {errors.subjectId && <span style={{ fontSize: "0.7rem", color: "var(--red)" }}>{errors.subjectId.message}</span>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Difficulty</span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
                  {(["easy", "medium", "hard"] as const).map(d => {
                    const dc = diffStyle[d];
                    return (
                      <Controller key={d} name="difficulty" control={control} render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(d)}
                          style={{
                            padding: "0.4rem",
                            borderRadius: "0.375rem",
                            fontSize: "0.72rem",
                            fontWeight: field.value === d ? 700 : 400,
                            textTransform: "capitalize",
                            border: `1.5px solid ${field.value === d ? dc.border : "var(--border)"}`,
                            background: field.value === d ? dc.bg : "var(--surface2)",
                            color: field.value === d ? dc.text : "var(--text3)",
                            cursor: "pointer",
                            transition: "all 0.12s",
                          }}
                        >
                          {d}
                        </button>
                      )} />
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)" }}>Marks</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Controller name="marks" control={control} render={({ field }) => (
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      style={{
                        flex: 1, height: "2.25rem", padding: "0 0.75rem",
                        borderRadius: "0.5rem", border: "1.5px solid var(--border)",
                        background: "var(--input-bg)", color: "var(--text)",
                        fontSize: "0.82rem", outline: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                      onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                  )} />
                  <span style={{ fontSize: "0.72rem", color: "var(--text3)", flexShrink: 0 }}>pts</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Tags">
            <Controller name="tags" control={control} render={({ field }) => (
              <TagInput tags={field.value || []} onChange={field.onChange} />
            )} />
          </Card>

          <div style={{
            background: "var(--surface2)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "0.875rem",
            display: "flex", flexDirection: "column", gap: "0.35rem",
          }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.2rem" }}>Checklist</span>
            {[
              { ok: !!control._formValues?.subjectId, label: "Subject selected" },
              { ok: !!control._formValues?.question?.trim(), label: "Question text" },
              { ok: validOpts.length >= 2, label: "At least 2 options" },
              { ok: hasCorrect, label: "Correct answer marked" },
            ].map(({ ok, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem", color: ok ? "var(--green)" : "var(--text3)" }}>
                <span style={{ fontSize: "0.8rem" }}>{ok ? "✓" : "○"}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}