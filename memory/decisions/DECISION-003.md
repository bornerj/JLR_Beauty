Status: ACTIVE
Data: 2026-02-28
Contexto: O PLAN-0007 define uma galeria de slots de midia para imagens do site, mas a secao de produtos ja usa imagens vindas do cadastro de produtos e nao deve ser sobrescrita por esse mecanismo.
Decision: O catalogo de slots de midia deve cobrir apenas imagens institucionais do site. Ficam fora do escopo o logo e todas as imagens do catalogo de produtos.
Consequencias: Evita conflito entre a galeria institucional e o fluxo existente de cadastro de produtos; reduz risco de regressao na vitrine/detalhe de produtos; exige validacao de escopo para impedir que `mediaSlots` controle imagens derivadas de produtos.
