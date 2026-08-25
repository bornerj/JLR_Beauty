# PLAN-0035 — Correções da Auditoria do Code Archaeologist (Admin V2)

Status: DONE — 2026-08-24
Data de abertura: 2026-08-24
Data de fechamento: 2026-08-24
Origem: usuário pediu para rodar o agente `code-archaeologist` sobre
`apps/web/src/admin-v2/` inteiro (116 arquivos, 17k linhas), validando bugs/
inconsistências. Executado via 4 subagentes em paralelo (skill `code-review-checklist`).
Relatório consolidado com 1 crítico + 6 médios + 7 baixos apresentado ao usuário.

## STAR

**Situation**: achado #1 (crítico — rastreio/notas de fulfillment descartados) já
corrigido e registrado (`ERR-0075`), ponto-a-ponto, sem plano formal (fix simples,
2 arquivos). Usuário pediu "ajuste os outros" — os 12 achados restantes (exceto
#7/#14, ver "Out") tocam ~15 arquivos em 4 módulos diferentes do Admin V2, o que
ultrapassa o gatilho de scope drift (>3 arquivos) do kernel — formalizado aqui como
plano curto, mesmo padrão do `PLAN-0032` (ocorrências tratadas uma a uma, cada uma
validada).

**Task**: corrigir os 12 achados médios/baixos do relatório, um de cada vez,
mantendo build/lint/tsc limpos. Registrar bugs reais corrigidos em `DEBUG-HISTORY.md`.

**Action**: ver checklist abaixo — cada achado é independente, sem dependência entre
si (arquivos diferentes ou, quando no mesmo arquivo, mudanças que não colidem).

**Result**: os 12 achados corrigidos, validados (`tsc -b`+`build`+`lint`), registrados
em memória.

## Escopo

**In:** achados #2, #3, #4, #5, #6, #8, #9, #10, #11, #12, #13 do relatório de
2026-08-24 (ver texto completo na conversa — não replicado aqui por completo,
resumido no checklist).

**Out:**
- achado #7/#14 (erro de lint `react-hooks/set-state-in-effect` em 11 arquivos dos
  dashboards de inteligência + proposta de hook compartilhado `useAdminV2Fetch`) —
  é um refactor maior (extrai hook, toca 11 arquivos de telas usadas pra decisão de
  negócio), risco de regressão sutil maior que os outros achados, que são todos
  locais/contidos. Fica pra decisão separada do usuário, não incluído neste plano.

## Checklist de Execução

- [x] #2 — `ServiceFormModal.tsx` (`commissionPercent`): `Number.isFinite`
      adicionado antes da faixa 0-100 (`ERR-0076`)
- [x] #8 — `ServiceFormModal.tsx`/`ProductFormModal.tsx` (`cost`/`costPrice`):
      mesma validação `Number.isFinite` (`ERR-0076`)
- [x] #3 + #11 — `BrandingSettingsView.tsx` (`revertLogo`): não salva mais o
      formulário inteiro — só atualiza estado local + exige "Salvar" manual,
      mesmo padrão de `MediaGalleryView.tsx` (`ERR-0077`)
- [x] #4 — `WhatsappIntegrationsView.tsx`: estado de sucesso/erro estruturado
      (`{ kind, text }`), não mais `message.includes("sucesso")` (`ERR-0078`)
- [x] #5 — `TestsView.tsx`: falha de `DELETE` pós-`POST` bem-sucedido agora avisa
      explicitamente sobre registro órfão, com o id (`ERR-0079`)
- [x] #6 — `OrdersBoardView.tsx`: `movingOrderId` virou `Set<number>`
      (`movingOrderIds`), corrige a condição de corrida (`ERR-0080`)
- [x] #9 — `shared/api.ts` (`updateBranding`): lança erro se `payload.branding`
      vier ausente, mesmo comportamento de `fetchBranding` (`ERR-0081`)
- [x] #10 — `BrandingSettingsView.tsx`: 3 chamadas `logger.error` alinhadas pra
      `warn`, igual às telas irmãs do módulo Sistema (parte do `ERR-0077`)
- [x] #12 — `OrdersListView.tsx` (`handleBulkAdvance`): backend ganhou
      `reasonCode` estável, frontend conta por `reasonCode === "payment_required"`
      em vez de substring match (`ERR-0082`)
- [x] #13 — `GargalosView.tsx`/`InsightsView.tsx`: bloco JSX duplicado extraído
      pra `shared/KnownImpactBanner.tsx` (cleanup, não é bug — sem ERR-XXXX)

## Git Record of Delivery
- [x] Step 1 (Pre-commit review) — 2026-08-24: 8 arquivos modificados +
      1 novo (`shared/KnownImpactBanner.tsx`). Validações: `apps/api` `tsc -b`
      limpo + `npm run test` 134/134 PASS; `apps/web` `tsc -b` limpo,
      `npm run build` PASS (216 módulos), `eslint` sem erro novo nos 12 arquivos
      tocados (5 erros pré-existentes de `react-hooks/set-state-in-effect`,
      já mapeados no achado #7, fora de escopo deste plano).
- [ ] Step 2 (Commit authorization): pendente
- [ ] Step 3 (Commit confirmation): pendente
- [ ] Step 4 (Push authorization e resultado): pendente
- Push status: PENDING
