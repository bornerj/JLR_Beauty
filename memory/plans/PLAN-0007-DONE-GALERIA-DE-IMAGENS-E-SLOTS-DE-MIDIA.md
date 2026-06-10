# PLAN-0007 - Galeria de Imagens e Slots de Midia

Status: DONE
Data de abertura: 2026-02-28
Contexto: Padronizar referencias de imagens institucionais do site (exceto logo e imagens de produtos), mapear local de uso por pagina/secao, e preparar base tecnica para galeria com troca segura via admin.

## Approach
Implementar um catalogo de slots de midia por pagina/secao/ordem (ex.: `index_hero_img_01`) com fallback para os caminhos atuais. Em seguida, centralizar leitura/escrita via backend + runtime frontend para permitir upload/troca/reversao sem risco de quebrar telas.

## Scope
- In:
  - mapear e padronizar slots para imagens institucionais publicas fixas (nao-logo e nao-produtos);
  - criar persistencia em settings + endpoints admin/public para slots;
  - criar runtime frontend para consumo unificado com fallback;
  - criar tela admin de galeria para upload/associacao/reversao por slot.
- Out:
  - alteracoes no fluxo de logo (ja entregue no PLAN-0006);
  - alteracoes em imagens do catalogo de produtos (origem no cadastro de produtos);
  - limpeza definitiva de arquivos legados nao utilizados nesta primeira etapa.

## Action Items
- [x] Definir catalogo oficial de slots (nome tecnico, pagina, secao, ordem, fallback atual).
- [x] Definir regras de exclusao do catalogo de slots (logo + imagens derivadas do cadastro de produtos).
- [x] Criar schema Zod para `settings.public.mediaSlots` no backend.
- [x] Implementar service/repository de media slots com cache TTL em memoria.
- [x] Expor endpoints admin/public para leitura e atualizacao de slots.
- [x] Criar runtime frontend `media.runtime.ts` (bootstrap unico + snapshot + subscribe).
- [x] Substituir referencias hardcoded nas secoes publicas para consumo por slot com fallback.
- [x] Padronizar caminhos relativos `images/...` para absoluto `/images/...`.
- [x] Criar tela Admin Galeria com upload, vinculacao por slot, preview e acao de reverter.
- [x] Documentar matriz final `slot -> imagem -> local de exibicao` para operacao segura.
- [x] Corrigir UX do modal de edicao (preview contido no box + acao explicita de `Salvar e fechar`).
- [x] Validar com lint/build e checklist funcional de trocas por pagina.

## Validation
- [x] `apps/web npm run lint`
- [x] `apps/web npm run build`
- [x] `apps/web npm run check:menu-targets`
- [x] Teste manual de troca/reversao em `/`, `/franquias`, `/assinaturas` e `/checkout`.

## Checkpoint de Continuidade
- Ultimo passo concluido: validacao manual concluida para troca/reversao de slots nas paginas publicas (`/`, `/franquias`, `/assinaturas`, `/checkout`) com ajustes finais no preview do modal.
- Proximo passo planejado: nenhum; plano encerrado.

## Registro Git da Entrega
- Passo 1 (Revisao pre-commit): arquivos do escopo revisados (`apps/web/src/modules/admin-media-gallery/components/AdminMediaGalleryView.tsx`, `memory/plans/PLAN-0007-DONE-GALERIA-DE-IMAGENS-E-SLOTS-DE-MIDIA.md`, `memory/MODIFICATION_LOG.md`) e validacoes do plano mantidas como concluidas.
- Passo 2 (Autorizacao de commit): confirmacao explicita do usuario em 2026-03-04: "faça e veja se tem pendencias de git e as imlemente".
- Passo 3 (Confirmacao do commit): commit `b47bd81` em `main` com mensagem `fix(web): finalize media gallery UX and close governance plan pendings` (36 arquivos, +4875/-3607).
- Passo 4 (Autorizacao e resultado do push): autorizacao explicita do usuario na mesma solicitacao; push executado com sucesso para `origin/main` (`2c42e72..b47bd81`).
- Status do push: CONCLUIDO
