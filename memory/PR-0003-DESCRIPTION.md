# PR-0003 — Iridium Ignitor (I²): plano, mockup e núcleo (Ondas 1-2) + fechamento do PLAN-0039

## Título
`docs: PLAN-0040 Iridium Ignitor — plano, design e mockup; fecha PLAN-0039`

## Objetivo
Registrar no JLR Beauty a decisão e o andamento do **Iridium Ignitor**, programa de setup reutilizável (checklist de aviação:
padrão × configurado × real) que vive em repositório próprio (`/srv/projects/GitHub/Iridium-Ignitor`) e servirá para publicar o JLR Beauty em VPS.

## O que foi feito
- `PLAN-0040` (novo): ideia, decisões D1–D7, catálogo de 14 fases, segurança do Ignitor, requisito **R-IGN** (controle contra reexecução destrutiva), Design Commitment e ondas. Onda 1 (design) e Onda 2 (núcleo) entregues.
- Mockup navegável aprovado (`docs/config/ignitor-mockup-v1.html`) e referência visual (`docs/config/hud_plane.png`).
- `PLAN-0039` renomeado `-DONE-` com Git Record preenchido (rotação das senhas das roles, `3ace59b`).
- Memória: `MODIFICATION_LOG`, `progress.md`.
- No repo novo (commit próprio): núcleo Python (modelos, catálogo, cofre de segredos, motor de estados, sondas, R-IGN, CLI), pack `core` e 55 testes.

## Áreas afetadas
`memory/`, `docs/config/`. **Nenhuma mudança em `apps/*`, `docker-compose.yml` ou no servidor em execução.**

## Validações
Ignitor: `pytest` 55 passed; teste de mutação nas 5 barreiras do R-IGN; demo real da CLI em workspace temporário. JLR: só documentação/memória.

## Riscos/observações
- O Ignitor ainda não aplica nada em servidor (ações reais nas Ondas 5-7).
- O mockup existe em duas cópias (JLR `docs/config/` e Ignitor `ui/mockup/`); a do Ignitor é a fonte quando a UI for implementada.
- O repositório do Ignitor ainda não tem memória SFK própria (decisão futura).
