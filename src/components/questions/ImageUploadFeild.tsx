"use client";
/**
 * ImageUploadField — reusable image picker with:
 *  - drag-and-drop
 *  - paste from clipboard
 *  - preview of selected OR existing URL
 *  - clear button
 *
 * Usage:
 *   <ImageUploadField
 *     label="Question image"
 *     value={file}           // File | null
 *     existingUrl={url}      // string | null — shown when no new file selected
 *     onChange={setFile}
 *     onClear={() => { setFile(null); setExistingUrl(null); }}
 *   />
 */

import { useRef, useState, useCallback } from "react";
import { Image, X, UploadCloud } from "lucide-react";

interface Props {
  label?: string;
  value: File | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
  onClear?: () => void;
  optional?: boolean;
}

export function ImageUploadField({ label, value, existingUrl, onChange, onClear, optional = true }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Derive the preview src: new file takes priority over existing URL
  const previewSrc: string | null = value
    ? URL.createObjectURL(value)
    : existingUrl ?? null;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onChange(file);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const file = Array.from(e.clipboardData.items)
      .find((i) => i.type.startsWith("image/"))
      ?.getAsFile();
    if (file) onChange(file);
  }, [onChange]);

  return (
    <div>
      {label && (
        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--text2)", marginBottom: "0.35rem", display: "flex", gap: "0.3rem", alignItems: "center" }}>
          <Image size={12} color="var(--text3)" />
          {label}
          {optional && <span style={{ fontWeight: 400, color: "var(--text3)" }}>(optional)</span>}
        </div>
      )}

      {previewSrc ? (
        // ── Preview mode ──
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={previewSrc}
            alt="preview"
            style={{
              maxHeight: 140, maxWidth: "100%", objectFit: "contain",
              display: "block", borderRadius: "0.5rem",
              border: "1.5px solid var(--border)",
            }}
          />
          <button
            type="button"
            onClick={() => { onChange(null); onClear?.(); }}
            style={{
              position: "absolute", top: "-0.4rem", right: "-0.4rem",
              width: "1.35rem", height: "1.35rem", borderRadius: "50%",
              background: "var(--red)", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <X size={10} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            style={{
              marginTop: "0.4rem", fontSize: "0.7rem", color: "var(--text3)",
              background: "none", border: "none", cursor: "pointer", padding: 0,
              display: "block", textDecoration: "underline",
            }}
          >
            Replace image
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        // ── Drop zone ──
        <div
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onClick={() => inputRef.current?.click()}
          style={{
            padding: "0.75rem 1rem",
            border: `1.5px dashed ${dragging ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "0.5rem",
            background: dragging ? "var(--accent-bg)" : "var(--surface2)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.15s",
          }}
        >
          <UploadCloud size={15} color={dragging ? "var(--accent)" : "var(--text3)"} />
          <span style={{ fontSize: "0.75rem", color: dragging ? "var(--accent)" : "var(--text3)" }}>
            Click, drag, or paste an image
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </div>
      )}
    </div>
  );
}