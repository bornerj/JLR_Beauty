# PLAN-0040 — Iridium Ignitor (I²): programa de setup/ignição reutilizável, estilo checklist de aviação

**Status:** 🔵 EM EXECUÇÃO — plano aprovado pelo usuário em 2026-10-03 (D1–D7). **Onda 1 (design) entregue; Onda 2 (núcleo) entregue em 2026-10-04** — repo `Iridium-Ignitor`, 55 testes passando, R-IGN implementado e validado por teste de mutação. Próxima: Onda 3 (API + cockpit de leitura). Absorve o escopo do `PLAN-0019` (TLS) como um dos módulos do Ignitor.
**Natureza:** projeto **novo e independente** do JLR Beauty. Este plano mora aqui só porque é a sessão/governança em curso; o código vive em repositório próprio (decisão D1).
**Agentes/skills aplicados:** `@project-planner` (brainstorming, plan-writing) para este plano; `@frontend-specialist` (frontend-design, ui-ux-pro-max) para a interface; na execução: `@devops-engineer` (fullstack-docker-deploy, server-management), `@security-auditor` + `@penetration-tester`, `@backend-specialist`, `@test-engineer`.

---

## 1. Ideia (nas palavras do usuário, consolidada)

Um **único lugar** onde se define tudo que uma publicação em VPS exige (domínio, proxy, TLS, segredos, banco, backup, endurecimento do servidor, monitoramento, integrações, release). Ao abrir, funciona como **checklist de aviação**: item a item, cada um mostrando **padrão (default) × valor configurado × valor real detectado**, com defaults já preenchidos e utilizáveis. Depois de definido, scripts Python **aplicam** (SETAR) tudo, de forma idempotente. Fica **fora da aplicação**, serve para **outros projetos**, tem interface moderna inspirada em um painel de cabine (`docs/config/hud_plane.png` — Garmin G1000, página AUX–SYSTEM SETUP). Nome na tela: **Iridium Ignitor · I²**.

**Interpretação assumida de "confrontada com o valor do banco":** cada campo exibe três valores — `DEFAULT` (catálogo), `CONFIGURADO` (perfil salvo) e `REAL` (o que a sonda encontra no servidor agora) — e marca divergência (*drift*). Se você quis dizer outra coisa, ajustar na Onda 0.

---

## 2. STAR

**Situation:** o JLR Beauty roda só em LAN, sem domínio/TLS (`PLAN-0019` bloqueado). Para ir a VPS faltam: TLS, segredos de produção novos, backup agendado + offsite, endurecimento do host, CORS/URLs reais, monitoramento, CI/rollback e um ensaio completo (levantamento da sessão de 2026-10-03). Cada item hoje é manual e espalhado em `.env`, `sfk.toml`, `DEPLOY_VPS.md`, memória. Ambiente: Python 3.14, PyYAML presente; FastAPI/ruamel **ausentes**.
**Task:** (1) catálogo de itens reutilizável; (2) armazenamento de perfil por projeto; (3) motor de checklist com defaults, validação e sondas; (4) UI "cockpit"; (5) ações de aplicação idempotentes (dry-run primeiro); (6) primeiro uso real: publicar o JLR Beauty.
**Restrições:** segredos nunca em claro em git/log/UI; sem instalar dependência sem aprovação; sem `shell=True`; padrão = dry-run; commit/push com dupla aprovação; sem mexer em `apps/*` do JLR.
**Result:** `ignitor` roda numa VPS limpa, conduz o checklist até **GO**, aplica e verifica; o mesmo programa atende um segundo projeto só trocando o *manifesto*.

---

## 3. Decisões de desenho (recomendação → confirmar na aprovação)

| # | Tema | Recomendação | Alternativa |
|---|---|---|---|
| D1 | **Onde vive** | Repo próprio `/srv/projects/GitHub/Iridium-Ignitor` (código, catálogo, UI). **Workspace** de dados separado `~/.iridium-ignitor/` (`chmod 700`): perfis, segredos, histórico. O app-alvo só recebe os artefatos gerados (.env, compose, conf do proxy). | Pasta dentro do JLR (descartada: não reutilizável) |
| D2 | **Formato dos dados** | **YAML** para catálogo (somente leitura, versionado) e para perfil (só valores). **Segredos em arquivo à parte** (`secrets.env`, 600, fora do git); o perfil guarda apenas referência (`generate:hex24`). **Histórico/auditoria em JSONL** append-only (sem valores secretos). **Sem SQLite no v1.** | SQLite só se o histórico/consulta crescer (v2) |
| D3 | **Backend** | Python ≥3.11; FastAPI + pydantic (validação do catálogo/perfil) + ruamel.yaml (preserva comentários), em **venv isolado**, versões fixadas. **Precisa de aprovação** para instalar. | stdlib `http.server` + PyYAML (zero dependência, menos validação) |
| D4 | **Interface** | Web local em HTML/CSS/JS **sem build** (vanilla + web components), servida pelo próprio Python em `127.0.0.1`; acesso remoto por **túnel SSH**. Fontes empacotadas (B612 Mono, desenhada p/ cockpits, licença livre) — funciona offline. | TUI (Textual): descartada, não entrega o visual de cabine |
| D5 | **Proxy** | v1 suporta **Traefik** e **nginx+certbot** (JLR já usa nginx); Caddy depois. Escolha é um item do checklist. | — |
| D6 | **Onde roda** | v1 roda **no próprio servidor-alvo** (local). v2: remoto via SSH. | — |
| D7 | **Reuso** | Catálogo em **packs** (`core`, `docker-app`, `postgres`, `traefik`, `nginx`, `backup`, `hardening`, `monitoring`, `integrations/*`) + **manifesto por projeto** (`ignitor.yaml`: quais packs, serviços, variáveis de ambiente). JLR = pack `jlr-beauty` derivado do `sfk.toml`. | — |

### Formatos avaliados (pedido do usuário)
| Formato | Veredito |
|---|---|
| **YAML** | ✅ Escolhido: legível, comentários, listas/aninhamento (catálogo). Cuidados: tipagem implícita ("no"→false) mitigada por **validação de esquema estrita** e `ruamel` round-trip. |
| **TOML** | ✅ Bom para config plana; ruim para listas longas de itens com metadados. Pode ser usado no manifesto simples. |
| **JSON** | ❌ Sem comentários; ruim para edição humana. Usado só na API. |
| **TOON** | ❌ Otimizado para economia de tokens em LLM, ecossistema pequeno, não pensado para edição humana nem escrita/merge. |
| **SQLite** | ⏸ Desnecessário agora (poucos milhares de valores, 1 usuário). Reavaliar para histórico/multiusuário. |

---

## 4. O checklist (catálogo v1) — "Pre-flight → Go-live"

Cada item tem: `id`, rótulo, tipo, **default**, validador, **sonda** (como achar o valor REAL), severidade (**GO/NO-GO** bloqueante ou *caution*), dependências, ação de aplicação e texto de ajuda. Estados: `UNSET · DEFAULT · SET · VERIFIED · DRIFT · FAIL`.

| Fase | Itens (exemplos) |
|---|---|
| 0 Identidade | nome/slug, ambiente (prod/staging), responsável |
| 1 Domínio & DNS | domínio, www, registros A/AAAA apontando para o IP (sonda `dig`) |
| 2 Proxy | Traefik / nginx; redirect 80→443; limites de requisição |
| 3 TLS | ligado/desligado, ACME (HTTP/DNS) ou certificado próprio, e-mail, HSTS, CA de teste, dias para expirar (sonda) |
| 4 Segredos | JWT, senhas do banco/roles, usuário master — gerar/rotacionar, nunca reaproveitar de dev |
| 5 Banco | engine/versão, diretório de dados, roles, restore de dump ou seed, `ALTER ROLE` na troca |
| 6 Armazenamento | layout `/srv`, uploads, permissões |
| 7 App | `NODE_ENV`, CORS/URLs com o domínio real, cookies `Secure` (`TLS_ENABLED`) |
| 8 Integrações | Mercado Pago (teste/produção + webhook), Brevo, Z-API |
| 9 Endurecimento do host | firewall (22/80/443), SSH só chave/sem root, fail2ban, updates automáticos, usuário de deploy, limite de logs do Docker |
| 10 Backup | agenda (cron/systemd timer), retenção, **offsite** (rclone/restic/S3/SFTP), teste de restore periódico |
| 11 Monitoramento | uptime, disco/memória, containers, canal de alerta |
| 12 Release | tags de imagem, rollback, CI mínimo |
| 13 Go-live | smoke tests, fluxo de compra real, aceite final |

**Modo voo (checklist):** o operador percorre os itens em ordem; o sistema exibe default × configurado × real; confirma (ENT), ajusta ou marca *deferido*. Só entra em **GO** quando nenhum NO-GO restar.

---

## 5. Interface — direção "Cabine de vidro" (briefing para `@frontend-specialist`)

- **Referência:** `hud_plane.png` (G1000 AUX–SYSTEM SETUP): fundo preto, caixas de contorno fino com título em ciano, rótulos brancos, valores editáveis em ciano, ON/OFF em verde, faixa de softkeys na base, coluna de instrumentos à esquerda, bezel com botões laterais. **Não copiar** — reinterpretar com identidade própria: **"Iridium" = prata metálica** no bezel e no logotipo **I²**.
- **Layout:** (a) barra superior com `IRIDIUM IGNITOR · I²`, projeto, ambiente, UTC; (b) **coluna esquerda de "instrumentos"**: medidor de prontidão (% itens GO), contadores NO-GO / CAUTION / DRIFT, dias de validade do TLS, disco; (c) **área central em caixas** por fase (como DATE/TIME, DISPLAY UNITS…) com linhas `RÓTULO ........ VALOR` e, por linha, mini-coluna `DEF` / `REAL`; (d) **faixa de softkeys F1–F10** (PREV, NEXT, PLAN, APPLY, VERIFY, DEFAULT, …); (e) **anunciador** de alertas (estilo CAS: branco/âmbar/vermelho com texto, não só cor).
- **Interação:** teclado primeiro (setas, ENT para editar, ESC, F-keys); mouse/toque também; segredos mascarados com "revelar uma vez"; confirmação digitada para ações destrutivas; **sem animações decorativas** (respeita `prefers-reduced-motion`).
- **Estética:** pixel-nítido, bordas retas 1px, tipografia mono (B612 Mono) + sans condensada p/ rótulos; paleta de **semântica de aviação** (verde=OK, âmbar=atenção, vermelho=falha, ciano=editável, branco=rótulo) sobre preto; **sem** vidro/blur, **sem** gradiente de malha, **sem** roxo. O ciano aqui é decisão deliberada de fidelidade à referência do usuário (exceção justificada à regra geral do agente).
- **Acessibilidade:** contraste ≥ 7:1 nos textos, estado sempre com texto+ícone, foco visível, responsivo ≥ 1280px (tablet em modo paisagem), degradação para lista em telas menores.
- **Entrega de design (Onda 1):** *Design Commitment* + mockup HTML estático navegável da página "Checklist → TLS" e da "Visão geral", aprovado pelo usuário **antes** de qualquer implementação (mesmo rito do `PLAN-0037`).

---

## 6. Segurança do próprio Ignitor (ele mexe em firewall, segredos e SSH)

- UI só em `127.0.0.1`; acesso remoto via túnel SSH; token de sessão + proteção CSRF; sem CORS aberto.
- Segredos: gerados com `secrets`, gravados com `umask 077`, **nunca** retornados pela API nem escritos em log/histórico/memória; mascarados na UI.
- Execução: `subprocess` com lista de argumentos (sem `shell=True`); entradas validadas contra o catálogo; **dry-run por padrão** (`plan` mostra o diff); antes de sobrescrever arquivo, snapshot com rollback.
- Privilégios: roda como usuário comum; ações que exigem `sudo` listam o comando exato e pedem confirmação explícita; ações de firewall/SSH exigem checagem anti-lockout (não fechar a própria sessão).
- Revisão obrigatória por `@security-auditor` + `@penetration-tester` antes do primeiro uso em servidor real.

## 6b. Requisito R-IGN — controle contra reexecução (adicionado em 2026-10-03)

> Pedido do usuário: depois do setup feito, o Ignitor **não pode rodar sem controle e apagar tudo de novo**; deve avisar que os dados já foram gravados e confirmar se é isso mesmo que a pessoa quer.

Especificação completa no repo: `Iridium-Ignitor/docs/SAFETY.md`. Resumo: estado do projeto `NAO-IGNITADO → IGNITANDO → IGNITADO` (trava em `~/.iridium-ignitor/state/`); depois de IGNITADO só `status/check/verify/plan` rodam livremente; `amend` altera apenas itens mudados e nunca toca em dados; `reignite` exige faixa de aviso com data/usuário, lista do que seria perdido, **snapshot automático**, confirmação digitada em duas etapas (nome do projeto + `REIGNITAR`) e espera de 10 s; ações **DESTRUTIVAS** só isoladas e recusam destino não vazio sem backup verificado; segredos existentes nunca são regerados em silêncio. Na UI: lâmpada IGNITADO, tecla APPLY travada, modal próprio de confirmação. Tem testes obrigatórios (Onda 2) e critério de aceite próprio.

---

## 7. Ondas

### Onda 0 — Aprovações e decisões (usuário)
- [x] D1–D7 aprovados em 2026-10-03. Repo `/srv/projects/GitHub/Iridium-Ignitor` criado e venv com dependências fixadas (`requirements.lock`) aprovados e feitos em 2026-10-03.
- [ ] Confirmar interpretação de "valor do banco" (default × configurado × real).
- [ ] Informar o que já se sabe para os defaults: VPS (provedor/tamanho/SO), domínio, proxy preferido, repo público/privado, Mercado Pago produção quando — **pode ficar em branco**, entram como default editável.

### Onda 1 — Design (UI/UX) — `@frontend-specialist` + `ui-ux-pro-max`
- [x] Design Commitment, tokens, anatomia dos componentes — ver seção 10.
- [x] Mockup HTML navegável (`docs/config/ignitor-mockup-v1.html`, também publicado como artefato privado); usuário: "o mockup está legal"; 1 bug de contraste (hover sobre linha selecionada) corrigido na v2. **Critério atendido.**

### Onda 2 — Núcleo (sem UI) ✅ entregue 2026-10-04
- [x] Esquema pydantic (`models.py`), loader de packs + validação de dependências/ciclos (`catalog.py`), store de perfil com ruamel (preserva comentários) e cofre de segredos modo 600 (`store.py`).
- [x] Motor de estados `GO/PEND/NOGO/UNSET/DEFER/DRIFT` (`engine.py`); sondas somente-leitura com lista de binários permitidos, sem shell, com substituição `{ITEM-ID}` (`probes.py`); CLI `init|status|check|set|default|defer|undefer|provide|plan|apply|history`.
- [x] Testes: 55 (modelos, catálogo, armazenamento, motor, sondas, CLI, R-IGN). Pack `core` com 11 itens (identidade, domínio, TLS, segredos).
- [x] **R-IGN** (`safety.py`, `runner.py`): estados IGNITADO/INCOMPLETO com pid, classes de ação, recusa em destino de dados não vazio, snapshot antes de MUTANTE/DESTRUTIVA, barreira (nome + `REIGNITAR`/`DESTRUIR`), cooldown, `history.jsonl` sem segredos. Validado por **teste de mutação** (5 barreiras desligadas uma a uma; cada uma derruba testes).
- Achados corrigidos no caminho: `dig` sem resposta lido como sucesso; sonda dependente rodava sem o valor de que dependia; `destroy` sem `--item` passava (agora exige item explícito); lacuna de teste da barreira DESTRUTIVA; cooldown real de 10 s não era injetável.
- **Limitações assumidas (ondas seguintes):** snapshot de banco (dump) entra com o pack de banco (hook) na Onda 6; botão de cancelar do cooldown e modal de confirmação na UI (Ondas 3-4); ações reais (proxy, TLS, firewall…) nas Ondas 5-7.

### Onda 3 — API + UI de leitura ✅ entregue 2026-10-04
- [x] API local FastAPI só em 127.0.0.1: token de sessão (cookie HttpOnly/SameSite=Strict), CSRF nas escritas, validação do Host, sem CORS, CSP restritiva, docs/openapi desligados. Cockpit (HTML/CSS/JS sem build, sem `innerHTML`) fiel ao mockup, com dados reais das sondas.

### Onda 4 — Edição e modo voo ✅ entregue 2026-10-04
- [x] Editor por tipo (ON/OFF, enum, número, texto, segredo por campo password), DEFAULT/DEFERIR, navegação por teclado e teclas de função, PLAN (dry-run) e APPLY em modal com a barreira do R-IGN: faixa vermelha, passos classificados, confirmação digitada, espera de 10 s com CANCELAR, histórico. E2E em Chrome real (20 verificações).

### Onda 5 — Módulos "core" ✅ entregue 2026-10-04
- [x] Packs `core`, `proxy` (Traefik com TLS automático ou manual), `host` (UFW com anti-lockout, SSH com validação `sshd -t` e rollback, fail2ban, atualizações automáticas, limite de logs do Docker preservando `data-root`). Ações com `plan → apply → verify`, idempotentes; `plan` nunca escreve (`DryRunError`).

### Onda 6 — Banco, backup, monitoramento, release ✅ entregue 2026-10-04
- [x] Packs `postgres` (senha por stdin/`PGPASSWORD` herdado, só quando o login não autentica), `backup` (timers systemd: backup, teste de restore semanal, cópia externa via rclone), `monitoring` (healthcheck + alerta por webhook no cofre), `release` (deploy.sh/rollback.sh, `compose up` validando antes). Segredos presos ao banco são **adotados** do `.env` existente (descoberto no dry-run real: sem isso a ignição geraria `POSTGRES_PASSWORD` nova e quebraria o banco).

### Onda 7 — Pack `jlr-beauty` ✅ entregue 2026-10-04
- [x] Pack + preset: 56 itens, 19 tarefas, `.env` de produção completo (URLs pelo domínio, `DATABASE_URL` com segredo codificado, integrações Mercado Pago/Brevo/Z-API), sem sobrescrever linhas do operador. **Dry-run real neste servidor:** 21 passos, nada escrito, `.env`/compose/nginx do JLR com hash idêntico e containers intactos.

### Onda 8 — Segurança, ensaio e entrega ✅ parcial 2026-10-04
- [x] Revisão `@security-auditor`: varredura de padrões perigosos (zero `shell=True`/`eval`/`pickle`/`innerHTML`), ataques manuais ao servidor em execução (401/400/403/404, sem CORS, só loopback), 5 endurecimentos (`$` no `.env` p/ o Compose, `$$` rejeitado em extras, `target_dir` absoluto, id de item validado na API, variável vazia em template = erro de plano).
- [x] Documentação: README, `docs/PACKS.md`, `docs/SAFETY.md` §7.
- [ ] **Ensaio numa VPS limpa** (domínio + DNS + root/sudo) e **compra com cartão real** (fecha a Onda 6 do `PLAN-0036`): não executável sem a VPS e o domínio do usuário.
- [ ] Revisão de segurança por `@penetration-tester` com o Ignitor rodando como root numa VPS real (esta sessão cobriu revisão estática + ataques à API).

> Achados do caminho (todos corrigidos e com teste): `dig` sem resposta lido como sucesso; sonda rodando sem o valor de que depende; `destroy` sem item explícito; `RunLock` falhando sem a pasta `state/`; `[hidden]` ignorado por `all:unset` nos botões; token do `serve` preso em buffer; template renderizando campo vazio em silêncio; `DATABASE_URL` gravada com `${...}` literal (`$$` do YAML); tarefas dependentes de segredo ainda inexistente não eram planejadas; `compose config` do override antes de ele existir; caminhos `/etc` fixos impediam teste (agora `SYSTEM_ROOT`); geração de `POSTGRES_PASSWORD` nova em servidor com banco (adoção).

> Limites conhecidos: snapshot não inclui dump de banco; a idade do backup (`backup.verify`) precisa ser registrada por quem integrar o `backup.sh --verify`; ações privilegiadas exigem root/sudo sem senha; o modo `manual` do proxy não gera TLS; nginx+certbot não foi implementado (só Traefik).

## 8. Riscos
1. **Escopo grande** → mitigado por ondas e por entregar valor cedo (cockpit + sondas antes das ações).
2. **Ferramenta com poder de root** → seção 6; dry-run, anti-lockout, snapshot/rollback, revisão de segurança.
3. **Dependência de infraestrutura externa** (domínio, DNS, VPS) → itens aceitam default/deferido; sondas mostram o real.
4. **YAML e tipagem implícita** → esquema estrito + round-trip.
5. **Deriva entre catálogo e realidade do projeto** → sondas + status DRIFT.
6. **Fidelidade à referência vs. clichês** → direção "instrumento", sem vidro/malha/roxo; aprovação por mockup.

## 9. Critérios de aceite
- Mockup aprovado pelo usuário antes de implementar.
- Checklist percorrível de ponta a ponta com default × configurado × real em todos os itens.
- `plan` (dry-run) mostra o diff exato; `apply` é idempotente (2ª execução = no-op); `verify` confirma.
- Nenhum segredo em log, API, git ou memória.
- **R-IGN:** em projeto IGNITADO, nenhuma escrita roda sem a barreira de confirmação; nenhuma ação apaga destino não vazio; `amend` nunca toca em dados.
- Um 2º projeto de exemplo consegue ser descrito só com um novo manifesto.
- JLR Beauty chega a **GO** numa VPS limpa e a compra com cartão real é validada.

---

## 10. Onda 1 — Entrega de design (`@frontend-specialist` + `ui-ux-pro-max`)

**🎨 DESIGN COMMITMENT: INSTRUMENTO DE CABINE (glass cockpit, reinterpretado)**
- **Escolha topológica:** sem hero e sem grade de cartões. A tela é um *instrumento*: coluna de medidores à esquerda, caixas de campo no centro, anunciadores/ajuda à direita, teclas de função embaixo — a hierarquia vem da posição fixa, como num painel real, não de blocos decorativos.
- **Fator de risco:** densidade alta e tipografia mono em toda a interface; teclado primeiro. Pode parecer "denso demais" para quem espera um SaaS.
- **Conflito de legibilidade assumido:** rótulos pequenos (10–13 px) em troca de ver default × configurado × real na mesma linha. Compensado por contraste alto e estado sempre em texto + símbolo.
- **Clichês descartados:** vidro/blur, gradiente de malha, roxo, cartões arredondados com sombra, hero dividido, ícones de emoji.
- **Exceção justificada:** ciano como cor de "valor editável" — decisão deliberada de fidelidade à referência do usuário (`hud_plane.png`), contrariando a regra geral de evitar ciano.

**Tokens (fonte de verdade: bloco `:root` do mockup)**
| Papel | Valor | Uso |
|---|---|---|
| tela | `#000000` | fundo do display |
| bezel | prata `#aeb6bd` / `#7d868e` | moldura "Iridium" |
| rótulo | `#eef3f6` | texto de rótulo |
| apagado | `#7b858d` | default do catálogo, dicas |
| editável | ciano `#3fd9f2` | valor configurado, título de caixa, cursor |
| GO / PEND / NO-GO | `#35e170` / `#ffb21a` / `#ff4a3d` | só semântica de estado |
| Tipografia | B612 Mono (dados), B612 (texto de ajuda) | desenhadas p/ cockpit; empacotar localmente na implementação |

**Anatomia dos componentes:** caixa com título em "entalhe" (borda 1 px) · linha de campo em 5 colunas `ITEM / DEFAULT / CONFIGURADO / REAL / ESTADO` · cursor = linha inteira em ciano com texto escuro · tecla de função (F1–F10) · medidor em arco (prontidão) e barras (disco/memória/TLS) · anunciador de alerta (etiqueta cheia + texto) · escada de fases com lâmpada de estado · barra superior (marca, página, projeto/ambiente, hora UTC).

**Regras de estado:** `GO ✓` verde · `PEND ▲` âmbar (configurado ≠ real, ainda não aplicado) · `NO-GO ✕` vermelho (bloqueante vazio/errado) · `VAZIO ○` apagado · `DEFER –` apagado. APPLY só habilita com 0 NO-GO.

**Acessibilidade verificada no mockup:** foco visível, teclado completo (↑↓←→ Enter), estado nunca só por cor, `prefers-reduced-motion` respeitado, colapso para uma coluna < 1100 px.

## Git Record of Delivery
- Step 1 (Pre-commit review): _pendente_
- Step 2 (Commit authorization): _pendente_
- Step 3 (Commit confirmation): _pendente_
- Step 4 (Push authorization and result): _pendente_
- Push status: PENDING
