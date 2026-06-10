# ALTERAÇÕES APLICADAS (GOVERNANÇA LINGUÍSTICA)

Projeto: JLR_AI_Studio
Data: 2026-02-26
Base: `REVISAO_ENTERPRISE_01.MD`

## Escopo aplicado

- Correções de acentuação e clareza em textos visíveis (frontend/admin/chatbot).
- Padronização terminológica pontual de `Email` para `E-mail` nos pontos auditados.
- Ajustes básicos de transparência LGPD em formulários de coleta (newsletter e concierge).

## Arquivos alterados

- `apps/api/src/modules/chatbot/flow/conciergeFlow.ts`
- `apps/web/src/components/pages/HomeContent.tsx`
- `apps/web/src/lib/auth.ts`
- `apps/web/src/pages/DbConsole.tsx`
- `apps/web/src/modules/admin-discount-coupons/components/AdminDiscountCouponsView.tsx`
- `apps/web/src/modules/admin-services/components/AdminServicesView.tsx`
- `apps/web/src/modules/admin-services/behavior.ts`
- `apps/web/src/modules/admin-schedule/components/AdminScheduleView.tsx`
- `apps/web/src/modules/admin-schedule/behavior.ts`
- `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
- `apps/web/src/modules/public-site/index.behavior.ts`

## Aplicado por categoria

### 1. Correção linguística

- WhatsApp concierge: prompts/mensagens com acentuação corrigida (`você`, `sessão`, `serviço`, `período`, `horário`, `não`, `possível`, etc.).
- Admin e DB Console: mensagens de sessão expirada e labels/botões com acentuação padronizada.
- Footer e concierge web: correções em `Sábado`, `Política`, `conteúdos`, `Observação`, `Solicitação`.

### 2. Terminologia

- Auth modal (`HomeContent`): placeholders `Email` -> `E-mail`.
- Footer newsletter: `Endereço de Email` -> `Endereço de e-mail`.
- Normalização de mensagem em `apps/web/src/lib/auth.ts`: `Email já cadastrado` -> `E-mail já cadastrado`.

### 3. LGPD (básico)

- `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`: adicionada microcopy de consentimento/transparência com referência à política.
- `apps/web/src/modules/public-site/index.behavior.ts`: adicionados avisos curtos de uso de dados nos formulários do concierge (fila de espera e confirmação de agendamento).

## Revalidação executada

- `npm run lint` em `apps/web` ✅
- `npm run build` em `apps/web` ✅
- `npm run build` em `apps/api` ✅
- `npm test` em `apps/api` ✅

## Observações

- Não houve alteração de estrutura de código, regras de negócio ou schema de banco.
- Não foram aplicadas correções em lote para todos os módulos do projeto; o escopo foi restrito aos pontos auditados e aprovados.
