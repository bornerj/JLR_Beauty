# RELATÓRIO DE GOVERNANÇA LINGUÍSTICA

Projeto: JLR_AI_Studio
Data: 2026-02-26
Arquivos analisados: 12

Observação de escopo: auditoria direcionada a textos visíveis ao usuário em frontend, chatbot e mensagens de erro (amostra prioritária).

---

## 1. Erros Gramaticais

Arquivo: `apps/api/src/modules/chatbot/flow/conciergeFlow.ts`
Linha: 243 (amostras também em 252, 261, 526, 527, 528, 1056, 2130 e recorrências)
Texto original: "Qual unidade voce prefere?"
Problema: ausência recorrente de acentuação em textos exibidos no fluxo WhatsApp (`voce`, `periodo`, `Nao`, `sessao`, `possivel`).
Sugestão: padronizar para PT-BR com acentuação ("você", "período", "Não", "sessão", "possível").

---

Arquivo: `apps/web/src/modules/public-site/index.behavior.ts`
Linha: 1442
Texto original: "Esse periodo acabou de ficar sem vagas. Quer entrar em lista de espera?"
Problema: "periodo" sem acento, enquanto o mesmo fluxo usa "período" corretamente em `apps/web/src/modules/public-site/index.behavior.ts:1407`.
Sugestão: "Esse período acabou de ficar sem vagas. Quer entrar em lista de espera?"

---

Arquivo: `apps/web/src/modules/public-site/index.behavior.ts`
Linha: 1449
Texto original: "Escolher outro periodo"
Problema: ausência de acento em "período".
Sugestão: "Escolher outro período"

---

Arquivo: `apps/web/src/pages/DbConsole.tsx`
Linha: 80
Texto original: "Sessao expirada. Faca login novamente."
Problema: ausência de acentuação ("Sessão", "Faça").
Sugestão: "Sessão expirada. Faça login novamente."

---

Arquivo: `apps/web/src/modules/admin-discount-coupons/components/AdminDiscountCouponsView.tsx`
Linha: 92
Texto original: "Sessao expirada. Faça login novamente."
Problema: frase com acentuação parcial (mistura de "Sessao" sem acento e "Faça" com acento).
Sugestão: "Sessão expirada. Faça login novamente."

---

Arquivo: `apps/web/src/modules/admin-services/components/AdminServicesView.tsx`
Linha: 9 (amostras também em 234 e `apps/web/src/modules/admin-services/behavior.ts:124`)
Texto original: "Cadastro e Consulta de Servicos"
Problema: ausência de acentuação em termos de interface ("Serviços", "serviço").
Sugestão: padronizar "Serviços"/"serviço" em títulos, botões e mensagens relacionadas.

---

Arquivo: `apps/web/src/modules/admin-schedule/components/AdminScheduleView.tsx`
Linha: 136 (amostras também em `apps/web/src/modules/admin-schedule/behavior.ts:535`, 560, 562)
Texto original: "Salvar vinculos"
Problema: ausência de acentuação recorrente ("vínculos", "serviços").
Sugestão: padronizar "Salvar vínculos" e demais mensagens do módulo com acentuação correta.

---

Arquivo: `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
Linha: 82 (amostras também em 95 e 109)
Texto original: "Sabado"
Problema: ausência de acentuação em conteúdo visível (`Sabado`, `conteudos`, `Politica`).
Sugestão: "Sábado", "conteúdos", "Política".

---

## 2. Terminologia Inconsistente

Arquivo: `apps/web/src/components/pages/HomeContent.tsx`
Linha: 90 (amostra também em 130)
Texto original: placeholder "Email"
Problema: coexistência de padrões "Email", "Endereço de Email" e "e-mail" no produto.
Sugestão: definir padrão único de marca/UX (recomendação: "E-mail" para rótulos e placeholders).

---

Arquivo: `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
Linha: 97
Texto original: "Endereço de Email"
Problema: terminologia divergente de outros módulos (`e-mail` em `apps/api/src/modules/chatbot/flow/conciergeFlow.ts:525` e `apps/api/src/modules/chatbot/flow/conciergeFlow.ts:551`).
Sugestão: "Endereço de e-mail" (ou "E-mail"), alinhado ao padrão escolhido.

---

Arquivo: `apps/web/src/lib/auth.ts`
Linha: 36
Texto original: "Email já cadastrado"
Problema: inconsistente com uso de "e-mail" em outros fluxos.
Sugestão: "E-mail já cadastrado" (se esse for o padrão adotado).

---

## 3. Riscos Jurídicos

Resultado: Nenhum `RISCO_JURIDICO_ALTO` identificado na amostra auditada (não foram encontrados claims absolutos como "100% seguro", "garantimos", "nunca falha" em textos de interface revisados).

Observação: existe referência informativa de segurança/pagamento em checkout; recomenda-se revisão jurídica posterior apenas se houver claim técnico/comercial sensível em produção.

---

## 4. Pontos LGPD

Arquivo: `apps/web/src/modules/footer/components/PublicSiteFooter.tsx`
Linha: 96 (formulário; link de privacidade em 109)
Texto original: formulário de captura de e-mail ("Entre na Lista de Convidados" / "Assinar")
Problema: coleta de dado pessoal (e-mail) sem aviso explícito de finalidade, base de consentimento ou referência imediata à política no próprio formulário.
Sugestão: incluir microcopy próximo ao botão (ex.: finalidade + link para política) e checkbox/consentimento quando aplicável.

---

Arquivo: `apps/web/src/modules/public-site/index.behavior.ts`
Linha: 1277 (fluxo envia dados em 1315-1322)
Texto original: coleta de nome, telefone (WhatsApp) e observação para fila de espera
Problema: coleta de dados sem aviso contextual sobre uso/compartilhamento com a unidade e sem referência à política de privacidade no fluxo.
Sugestão: inserir mensagem curta antes do envio explicando finalidade do uso dos dados e link para política.

---

Arquivo: `apps/web/src/modules/public-site/index.behavior.ts`
Linha: 1703 (fluxo de contato; confirmação em 1720-1729)
Texto original: coleta de nome completo e telefone para concluir agendamento
Problema: ausência de aviso de privacidade/consentimento contextual no momento da coleta.
Sugestão: adicionar texto de transparência (uso para contato e confirmação de agendamento) e link para política.

