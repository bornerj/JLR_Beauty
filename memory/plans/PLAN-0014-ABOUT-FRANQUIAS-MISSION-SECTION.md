# PLAN-0014 — About em Franquias + Nova Seção Mission

**Status:** EM ANDAMENTO
**Criado:** 2026-06-13
**Autor:** Claude Sonnet 4.6
**Aprovado por:** Jeiel Borner

---

## Objetivo

1. Adicionar `HomeAboutSection` à página Franquias com toggle admin
2. Criar nova seção `MissionSection` (Missão / Visão / Valores) para as 3 páginas
3. Integrar `MissionSection` ao sistema de pageTexts (PLAN-0012) sob `page: "global"`
4. Adicionar slot de mídia `mission_center_img_01` para a foto central

---

## Design da MissionSection

Layout 3 colunas full-width, sem padding externo:

| Coluna | Cor de fundo | Conteúdo |
|--------|-------------|---------|
| Esquerda | `bg-primary` (teal) | MISSÃO (título + ícone + parágrafo) + VISÃO (título + ícone + parágrafo) |
| Centro | — | Foto `mission_center_img_01` (object-cover full-height) |
| Direita | `bg-white` | VALORES: + 5 bullet items |

Ícones material-symbols-outlined: `gps_fixed` (missão), `insights` (visão)
Decoração: ✦ canto inferior direito da imagem

---

## Arquivos Modificados

### Backend
- `apps/api/src/modules/pageTexts/catalog.ts` — extend `page` type + 10 entries `global.mission.*`
- `apps/api/src/modules/mediaSlots/service.ts` — add `mission_center_img_01`
- `apps/api/src/routes/admin.ts` — update `DEFAULT_PUBLIC_SECTION_TOGGLES`

### Frontend
- `apps/web/src/modules/public-site/sectionToggles.ts` — about:franquias + mission:all
- `apps/web/src/modules/public-site/sections/MissionSection.tsx` — NEW
- `apps/web/src/modules/public-site/sections/index.ts` — export MissionSection
- `apps/web/src/components/pages/HomeContent.tsx` — add MissionSection
- `apps/web/src/components/pages/FranquiasContent.tsx` — add HomeAboutSection + MissionSection
- `apps/web/src/components/pages/AssinaturasContent.tsx` — add MissionSection
- `apps/web/src/modules/admin-page-texts/components/AdminPageTextsView.tsx` — tab global

---

## pageTexts Keys (page: "global", section: "mission")

```
global.mission.missao_title    → "MISSÃO"
global.mission.missao_text     → [paragraph]
global.mission.visao_title     → "VISÃO"
global.mission.visao_text      → [paragraph]
global.mission.valores_title   → "VALORES:"
global.mission.valores_item_1  → "Cuidar com empatia."
global.mission.valores_item_2  → "Valorizar a essência de cada pessoa."
global.mission.valores_item_3  → "Acreditar que beleza é bem-estar."
global.mission.valores_item_4  → "Inovar sempre, com amor e propósito."
global.mission.valores_item_5  → "Trabalhar com ética, respeito e paixão."
```

---

## Toggles Padrão (mission = false em todas as páginas, about = false em franquias)

| Página | Seção | Default |
|--------|-------|---------|
| home | mission | false |
| franquias | about | false |
| franquias | mission | false |
| assinaturas | mission | false |

---

## Git Record

**Branch:** main
**Commits:**
- PENDING

---

## Conclusão

**Status final:** PENDENTE
**Testado em browser:** NÃO
