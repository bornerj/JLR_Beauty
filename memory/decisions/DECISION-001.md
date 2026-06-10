Status: ACTIVE
Data: 2026-02-27
Contexto: Definicao de estrategia de branding global para o plano PLAN-0006.
Decision: Adotar branding unico para todas as unidades, com persistencia em `settings.public.branding` no formato `{ fullName, shortName, logoUrl }`, sendo `logoUrl` a URL hospedada no servidor/CDN.
Consequencias: Reduz hardcode e custo de rebranding; centraliza manutencao em uma tela admin unica; exige runtime/cache para refletir mudancas com consistencia entre frontend e backend.

