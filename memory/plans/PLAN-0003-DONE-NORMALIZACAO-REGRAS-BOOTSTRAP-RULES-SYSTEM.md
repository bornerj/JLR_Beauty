# Plano de Trabalho: Normalizacao de Regras (bootstrap/rules/system)

Status: DONE
Data: 2026-02-26
Solicitacao: separar responsabilidades entre `kernel/BOOTSTRAP.md`, `kernel/RULES.md` e `kernel/SYSTEM.md` para uso padrao em todos os projetos.

## Escopo
- `kernel/BOOTSTRAP.md`: somente rotina de inicio de sessao.
- `kernel/RULES.md`: somente fluxo de trabalho e memoria operacional.
- `kernel/SYSTEM.md`: somente regras tecnicas e organizacionais de engenharia.
- Preservar regras existentes, movendo para o arquivo correto quando necessario.

## Execucao Detalhada
- [x] Diagnosticar sobreposicoes e conflitos entre os tres arquivos.
- [x] Definir mapeamento final de responsabilidade por arquivo.
- [x] Reescrever `kernel/BOOTSTRAP.md` com foco exclusivo em bootstrap de sessao.
- [x] Reescrever `kernel/RULES.md` removendo regras tecnicas e consolidando workflow/memoria.
- [x] Reescrever `kernel/SYSTEM.md` removendo workflow e consolidando regras tecnicas/organizacionais.
- [x] Registrar INICIO e FIM no `memory/MODIFICATION_LOG.md`.
- [x] Finalizar plano como `DONE`.

## Checkpoint de Continuidade
- Ultimo passo concluido: encerramento registrado no `memory/MODIFICATION_LOG.md` e plano finalizado.
- Proximo passo planejado: aplicar o padrao normalizado nos proximos projetos.
