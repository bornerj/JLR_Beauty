import type { ReactElement } from "react";
import { STYLE_CLASS_MAP, type StyleId, type TextSegment } from "../../public-site/pageTexts";

const STYLE_OPTIONS: { id: StyleId; label: string }[] = [
  { id: "default",       label: "Normal" },
  { id: "gold-gradient", label: "Dourado gradiente ✨" },
  { id: "primary",       label: "Verde primário" },
  { id: "gold",          label: "Dourado sólido" },
  { id: "bold",          label: "Negrito" },
  { id: "uppercase",     label: "Maiúsculas espaçadas" },
];

type SegmentEditorProps = {
  segments: TextSegment[];
  onChange: (segments: TextSegment[]) => void;
};

export const SegmentEditor = ({ segments, onChange }: SegmentEditorProps): ReactElement => {
  const update = (index: number, field: keyof TextSegment, value: string): void => {
    onChange(
      segments.map((seg, i) =>
        i === index ? { ...seg, [field]: value } : seg
      )
    );
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
            className="flex-1 border border-[#cfe7d1] rounded-lg px-3 py-1.5 text-sm bg-[#f6f8f6] text-forest"
            value={seg.text}
            onChange={(e) => update(index, "text", e.target.value)}
            placeholder="Texto da parte..."
          />
          <select
            className="border border-[#cfe7d1] rounded-lg px-2 py-1.5 text-sm bg-[#f6f8f6] text-forest cursor-pointer"
            value={seg.style}
            onChange={(e) => update(index, "style", e.target.value)}
          >
            {STYLE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <button
            className="p-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors"
            type="button"
            onClick={() => remove(index)}
            title="Remover parte"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      ))}

      {/* Preview */}
      {segments.length > 0 && (
        <div className="mt-1 rounded-lg border border-[#cfe7d1] bg-forest/5 px-3 py-2 text-sm">
          <span className="text-[10px] uppercase tracking-widest text-forest/50 block mb-1">Preview</span>
          <span className="text-forest font-medium">
            {segments.map((seg, i) => {
              const cls = STYLE_CLASS_MAP[seg.style];
              return cls
                ? <span key={i} className={cls}>{seg.text || "…"}</span>
                : <span key={i}>{seg.text || "…"}</span>;
            })}
          </span>
        </div>
      )}

      <button
        className="self-start mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
        type="button"
        onClick={addPart}
      >
        <span className="material-symbols-outlined text-sm">add</span>
        Adicionar parte
      </button>
    </div>
  );
};
