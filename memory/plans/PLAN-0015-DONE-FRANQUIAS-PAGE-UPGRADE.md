# PLAN-0015 — Franquias Page Upgrade
# 13 novas seções + media slots + page texts + section toggles

**Status:** DONE
**Criado em:** 2026-06-16
**Fechado em:** 2026-06-16
**Agente:** frontend-architect

---

## Objetivo

Expandir a página de Franquias com 13 novas seções editoriais, todas integradas ao sistema
de section toggles, page texts editáveis e media slots — seguindo os padrões já estabelecidos
no projeto.

> Escopo expandido durante a sessão: o plano inicial previa 5 seções; a usuária adicionou
> 7 seções extras (p17–p23) + layout completamente diferente para Fran01/02/03 (modelo
> financeiro 3-col em vez de espelho do Vision).

---

## Ordem de Seções Final (FranquiasContent.tsx)

```
hero            (existente)
about           (existente)
vision          (existente)
founder         (NOVA)
benefits        (NOVA)
mission         (existente)
models          (existente)
fran01          (NOVA — layout 3-col: conceito + investimento + métricas)
fran02          (NOVA)
fran03          (NOVA)
gestao_app      (NOVA)
fluxo_caixa     (NOVA)
marketing_crm   (NOVA)
expansao        (NOVA)
perfil          (NOVA)
suporte         (NOVA)
etapas          (NOVA — snake 10 passos)
contact         (existente)
```

---

## Componentes Criados (13)

| Arquivo | Layout |
|---------|--------|
| `FranquiasFounderSection.tsx` | 2-col: foto esq, texto dir |
| `FranquiasBenefitsSection.tsx` | grid 3×3: ícone + texto por célula |
| `FranquiasModelDetailSection.tsx` | base component 3-col reutilizável |
| `FranquiasFran01Section.tsx` | wrapper → ModelDetail (Master) |
| `FranquiasFran02Section.tsx` | wrapper → ModelDetail (Prime) |
| `FranquiasFran03Section.tsx` | wrapper → ModelDetail (Essencial I) |
| `FranquiasGestaoAppSection.tsx` | 2-col: features esq, mockup app dir |
| `FranquiasFluxoCaixaSection.tsx` | 2-col: features + dividers esq, teal stripe dir |
| `FranquiasMarketingCrmSection.tsx` | 2-col: lista + sub-bullets esq, foto dir |
| `FranquiasExpansaoSection.tsx` | 2-col: mapa esq, texto/quotes dir |
| `FranquiasPerfilFranqueadoSection.tsx` | 2-col: foto esq, numbered list dir |
| `FranquiasSuporteFranqueadoraSection.tsx` | 2-col: 3 grupos esq, foto dir |
| `FranquiasEtapasAberturaSection.tsx` | full-width snake 10 passos + CTA |

---

## Totais Reais de Mudanças

| Tipo | Quantidade |
|------|-----------|
| Arquivos criados | 13 componentes TSX |
| Arquivos modificados | 7 (catalog.ts, service.ts, admin.ts, mediaSlots.ts, sectionToggles.ts, sections/index.ts, FranquiasContent.tsx) |
| Novos page text keys | ~145 campos |
| Novos media slots | ~26 slots |
| Novos section toggles | 13 |

---

## Validação

- TypeScript: PASS (zero erros)
- Build: PASS (vite build 11.22s)
- Commit: `f31d986` — feat: franquias page upgrade — PLAN-0015
- Push: origin/main atualizado

---

## Git Record

**Commit:** `f31d986`
**Push:** aprovado pelo usuário em 2026-06-16
**Arquivos:** 20 arquivos, 1428 inserções
