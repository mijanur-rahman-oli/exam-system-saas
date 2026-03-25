"use client";

import { useEffect, useRef } from "react";

export function KaTeXDisplay({ text, inline = false }: { text: string; inline?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current || !text) return;
    import("katex").then((katex) => {
      let html = text
        .replace(/\$\$(.+?)\$\$/gs, (_, expr) => {
          try {
            return katex.default.renderToString(expr, { displayMode: true, throwOnError: false });
          } catch {
            return `<span class="katex-error">${expr}</span>`;
          }
        })
        .replace(/\$(.+?)\$/g, (_, expr) => {
          try {
            return katex.default.renderToString(expr, { displayMode: false, throwOnError: false });
          } catch {
            return `<span class="katex-error">${expr}</span>`;
          }
        });
      if (ref.current) ref.current.innerHTML = html;
    });
  }, [text]);

  return (
    <span 
      ref={ref} 
      style={{ 
        fontSize: inline ? "0.85rem" : "1rem", 
        lineHeight: 1.6, 
        color: "var(--text)" 
      }} 
    />
  );
}