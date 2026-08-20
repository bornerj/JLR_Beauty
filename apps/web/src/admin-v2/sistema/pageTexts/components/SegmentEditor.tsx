import { STYLE_CLASS_MAP, type StyleId, type TextSegment } from "../../../../modules/public-site/pageTexts";

/**
 * Admin V2 (PLAN-0026, Onda 5) — editor de texto segmentado (múltiplas partes, cada uma com
 * seu próprio estilo visual), porte 1:1 do legado (`admin-page-texts/components/
 * SegmentEditor.tsx`) só trocando as classes pro visual do Admin V2 (`border-gold/40`,
 * `dark:bg-forest-green`). `STYLE_CLASS_MAP`/`StyleId`/`TextSegment` vêm do módulo utilitário
 * compartilhado `modules/public-site/pageTexts.ts` (usado pelo site público também).
 */

const STYLE_OPTIONS: { id: StyleId; label: string }[] = [
  { id: "default", label: "Normal" },
  { id: "gold-gradient", label: "Dourado gradiente ✨" },
  { id: "primary", label: "Verde primário" },
  { id: "gold", label: "Dourado sólido" },
  { id: "bold", label: "Negrito" },
  { id: "uppercase", label: "Maiúsculas espaçadas" },
];

export function SegmentEditor({
  segments,
  onChange,
}: {
  segments: TextSegment[];
  onChange: (segments: TextSegment[]) => void;
}) {
  const update = (index: number, field: keyof TextSegment, value: string): void => {
    onChange(segments.map((seg, i) => (i === index ? { ...seg, [field]: value } : seg)));
  };

  const remove = (index: number): void => {
    onChange(segments.filter((_, i) => i !== index));
  };

  const addPart = (): void => {
    onChange([...segments, { text: "", style: "default" }]);
  };

  return (
    <div className="flex flex-col gap-2">
      {segments.map((seg, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={seg.text}
            onChange={(e) => update(index, "text", e.target.value)}
            placeholder="Texto da parte..."
            className="flex-1 rounded-lg border border-primary/60 bg-white px-3 py-1.5 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
          />
          <select
            value={seg.style}
            onChange={(e) => update(index, "style", e.target.value)}
            className="rounded-lg border border-primary/60 bg-white px-2 py-1.5 text-sm text-forest focus:outline-none focus:ring-2 focus:ring-primary dark:bg-forest-green"
          >
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => remove(index)}
            title="Remover parte"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-stone-200 text-state-critical hover:bg-state-critical/10"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      ))}

      {segments.length > 0 && (
        <div className="mt-1 rounded-lg border border-gold/40 bg-primary/5 px-3 py-2 text-sm">
          <span className="mb-1 block text-[10px] uppercase tracking-widest text-stone-500 dark:text-stone-400">Preview</span>
          <span className="font-medium text-forest">
            {segments.map((seg, i) => {
              const cls = STYLE_CLASS_MAP[seg.style];
              return cls ? (
                <span key={i} className={cls}>
                  {seg.text || "…"}
                </span>
              ) : (
                <span key={i}>{seg.text || "…"}</span>
              );
            })}
          </span>
        </div>
      )}

      <button
        type="button"
        onClick={addPart}
        className="mt-1 inline-flex w-fit items-center gap-1 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Adicionar parte
      </button>
    </div>
  );
}
