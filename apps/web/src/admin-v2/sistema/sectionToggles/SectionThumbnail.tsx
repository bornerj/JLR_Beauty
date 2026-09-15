import { useState } from "react";
import type { SectionThumbnailArchetype } from "./sectionDisplay";

/**
 * PLAN-0037 — miniatura de uma seção na tela "Seções Telas". Mostra a imagem real (vinda da
 * Galeria de Mídias) quando existe; senão, um wireframe neutro que ainda comunica o "formato"
 * da seção (hero cheio, conteúdo dividido, cards, galeria, CTA) — nunca um `<img>` quebrado.
 */

type Mark = { top: string; left: string; width: string; height: string; opacity?: number; radius?: string };

const ARCHETYPE_MARKS: Record<SectionThumbnailArchetype, Mark[]> = {
  hero: [
    { top: "0%", left: "0%", width: "100%", height: "58%", opacity: 0.22, radius: "0" },
    { top: "68%", left: "20%", width: "60%", height: "12%" },
    { top: "84%", left: "32%", width: "36%", height: "9%", opacity: 0.7 },
  ],
  split: [
    { top: "10%", left: "8%", width: "36%", height: "80%", opacity: 0.55 },
    { top: "28%", left: "52%", width: "40%", height: "12%" },
    { top: "48%", left: "52%", width: "32%", height: "12%", opacity: 0.75 },
    { top: "68%", left: "52%", width: "24%", height: "12%", opacity: 0.55 },
  ],
  cards: [
    { top: "14%", left: "8%", width: "27%", height: "72%", opacity: 0.6 },
    { top: "14%", left: "37.5%", width: "27%", height: "72%", opacity: 0.6 },
    { top: "14%", left: "67%", width: "27%", height: "72%", opacity: 0.6 },
  ],
  gallery: [
    { top: "22%", left: "10%", width: "22%", height: "56%", opacity: 0.65, radius: "999px" },
    { top: "22%", left: "39%", width: "22%", height: "56%", opacity: 0.65, radius: "999px" },
    { top: "22%", left: "68%", width: "22%", height: "56%", opacity: 0.65, radius: "999px" },
  ],
  cta: [{ top: "37%", left: "24%", width: "52%", height: "26%", opacity: 0.85, radius: "999px" }],
};

const TONE_GRADIENT: Record<string, string> = {
  home: "linear-gradient(155deg, rgba(0,150,127,.85), rgba(0,150,127,.32))",
  franquias: "linear-gradient(155deg, rgba(197,160,89,.85), rgba(197,160,89,.32))",
  assinaturas: "linear-gradient(155deg, rgba(13,27,18,.85), rgba(13,27,18,.32))",
};

type Props = {
  archetype: SectionThumbnailArchetype;
  tone: "home" | "franquias" | "assinaturas";
  imageUrl?: string;
  alt: string;
  width: number;
  height: number;
};

export function SectionThumbnail({ archetype, tone, imageUrl, alt, width, height }: Props) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(imageUrl) && !broken;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden rounded-md border border-black/10 dark:border-white/10"
      style={{ width, height, background: showImage ? undefined : TONE_GRADIENT[tone] }}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : (
        ARCHETYPE_MARKS[archetype].map((mark, index) => (
          <span
            key={index}
            className="absolute bg-white"
            style={{
              top: mark.top,
              left: mark.left,
              width: mark.width,
              height: mark.height,
              opacity: mark.opacity ?? 1,
              borderRadius: mark.radius ?? "2px",
            }}
          />
        ))
      )}
    </div>
  );
}
