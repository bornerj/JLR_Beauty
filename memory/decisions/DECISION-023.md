Status: ACTIVE
Date: 2026-10-04

Context:
Para publicar o JLR Beauty em VPS faltavam TLS, segredos de produção, backup agendado + offsite, endurecimento do host, monitoramento,
CORS/URLs reais e rollback — tudo manual e espalhado (`.env`, `sfk.toml`, `DEPLOY_VPS.md`). O usuário pediu um programa único,
reutilizável por outros projetos, fora da aplicação, conduzido como checklist de aviação (padrão × configurado × real) e com controle
para nunca reexecutar às cegas depois do setup (`PLAN-0040`).

Decision:
1. Criar o **Iridium Ignitor (I²)** em repositório próprio (`/srv/projects/GitHub/Iridium-Ignitor`), fora do JLR Beauty. Dados de operação
   em `~/.iridium-ignitor/` (perfis YAML, cofre de segredos modo 600, trava de estado, snapshots, histórico JSONL). Sem banco de dados no v1.
2. Formato **YAML** para catálogo e perfil (comentários, aninhamento; esquema estrito com pydantic). JSON/TOON/SQLite avaliados e descartados.
3. Controle **R-IGN**: depois de ignitado, só `status/plan/verify` rodam livremente; `amend` altera só o que mudou; `reignite` e `destroy`
   exigem barreira (aviso, snapshot, nome do projeto + palavra, espera cancelável, backup recente no destroy). Ações destrutivas nunca em lote.
4. O JLR Beauty passa a ser publicado **pelo Ignitor** (pack/preset `jlr-beauty`). `docs/config/DEPLOY_VPS.md` segue como referência manual.
5. Absorve o escopo do `PLAN-0019` (TLS): Traefik com Let's Encrypt como proxy padrão de produção; o modo `manual` mantém o proxy atual.

Consequences:
- O `.env` de produção, o proxy, o firewall, o SSH, os timers de backup/monitoramento e os scripts de deploy passam a ser **gerados** pelo Ignitor;
  editar esses artefatos à mão é sobrescrito no próximo `amend`/`reignite` (por isso a barreira).
- Em servidor com banco existente, segredos presos ao banco são adotados do `.env` (nunca regerados); JWT e senha master são novos.
- Dependências novas ficam isoladas no venv do Ignitor (fastapi, uvicorn, pydantic, ruamel.yaml); nada muda em `apps/*`.
- Pendências: ensaio em VPS limpa com domínio, teste de compra real, publicar o repo do Ignitor (sem remoto hoje).
