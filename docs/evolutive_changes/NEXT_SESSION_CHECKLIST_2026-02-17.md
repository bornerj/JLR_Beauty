# Next Session Checklist (2026-02-17)

Objetivo da proxima sessao: fechar os ultimos pontos de limpeza e homologacao apos migracao 100% React.

## 1. Limpeza fisica de legado (bloqueada por permissao nesta sessao)
1. Apagar arquivos:
   - `cms/apply_cmskey.php`
   - `cms/gen_cmskey.php`
   - `cms/report_missing_keys.php`
   - `data/content.json`
   - `data/content.backup.20260124-043538.json`
   - `data/missing_keys.json`
   - `data/report_missing_keys.json`
2. Validar que nada referencia esses arquivos:
   - `rg -n "cms/|content.json|dcmsky" -S`

## 2. Settings (status apos troca)
1. Confirmar no ambiente que o model Prisma `Setting` esta ativo e lendo/escrevendo via `/api/settings`.
2. Opcional (saneamento): migrar a tabela fisica de `ContentEntry` para `Setting` (atualmente ha compatibilidade por `@@map("ContentEntry")`).

## 3. Homologacao funcional final
1. Admin Dashboard:
   - KPIs carregando
   - grid de leads carregando
2. Admin Pessoas:
   - incluir cliente
   - validar altura dinamica da grid
3. WhatsApp Contatos:
   - carregar saudacoes
   - salvar e recarregar settings
4. Rodar validacoes:
   - `apps/web`: `npm run lint && npm run build`
   - `apps/api`: `npm run prisma:generate && npm run build && npm test`

## 4. Encerramento
1. Atualizar `memory/MODIFICATION_LOG.md` com o que foi feito.
2. Atualizar `docs/evolutive_changes/REACT_MIGRATION_FINAL_SUMMARY.md` para status final definitivo (sem pendencias).

