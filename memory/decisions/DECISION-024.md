# DECISION-024 — Alvo de produção (VPS + Traefik + Kamal); servidor atual é só UAT; hardening proporcional

Status: ACTIVE
Date: 2026-10-07

## Contexto

Registrada a pedido do usuário porque não constava em lugar nenhum e orientou mal o hardening do servidor:
1. O servidor Ubuntu atual (`DECISION-022`) é **ambiente de desenvolvimento/UAT do usuário**, não produção.
   As restrições dele servem a um objetivo: impedir que alguém de **fora** o alcance e prejudique o usuário.
2. A **produção** será uma **VPS com Traefik** na borda; o **nginx do projeto deixa de ver a internet** e passa
   a servir apenas a rede interna, falando só com o Traefik (e vice-versa).
3. Antes da VPS, o usuário montará uma **VM simulada com Multipass** com carga simulada, usando **Kamal**, e depois
   aplicará o Kamal na VPS.
4. Barreira demais entre o notebook do usuário e o servidor de UAT atrapalha e não representa o ambiente final.

## Decisão

1. **Hardening do servidor de UAT é proporcional**: firewall (`ufw` negando entrada, `22/80` só da LAN dev
   `10.10.10.0/24` + Tailscale), SSH só por chave sem root, atualizações automáticas, `.env` 600. **Não** instalar
   fail2ban nem apertar SSH além disso aqui (acesso só por LAN/Tailscale; custo > benefício).
2. **Porta 80 publicada pelo Docker em todas as interfaces é risco aceito no UAT** (confirmado em 2026-10-07: o site
   abre pelo Wi-Fi `192.168.0.14`, o Docker contorna o `ufw`). Não restringir por IP no compose agora.
3. **O hardening "de verdade" é o de produção** e deve ser desenhado para Traefik + Kamal (ver
   `docs/config/HARDENING_VPS.md`, seção "Produção"): TLS no Traefik (Let's Encrypt automático), nginx sem porta
   publicada, firewall da VPS, SSH por chave, backups.
4. **Pré-requisito técnico da migração (obrigatório):** atrás do Traefik o nginx deixa de ver o IP real do cliente.
   Sem tratar isso, o `limit_req` (por IP) e o rate limit/AuditLog da API enxergariam **todos os usuários como um
   único IP** (travando todos juntos). Tratar na migração com `ngx_http_realip_module` no nginx
   (`set_real_ip_from <rede do Traefik>`, `real_ip_header X-Forwarded-For`, `real_ip_recursive on`) e Traefik
   sobrescrevendo (não confiando em) o `X-Forwarded-For` vindo da internet. Validar com o mesmo teste de
   `X-Forwarded-For` forjado do `ERR-0098`.

## Consequências

- O `PLAN-0019` (TLS) deixa de ser "certbot no nginx": o TLS passa a ser do Traefik. Domínio continua sendo pré-requisito.
- O que o `PLAN-0042` fez no nginx (`X-Forwarded-For $remote_addr`, `limit_req`) permanece correto **no UAT** e
  precisa do ajuste de IP real acima ao entrar o Traefik.
- Kamal: a versão determina o proxy (Kamal 1.x usa Traefik; Kamal 2 usa o `kamal-proxy`); a exigência de IP real
  é a mesma nos dois casos.
- Este servidor continua sendo referência de comportamento da aplicação, não de topologia de rede.

## Documentos relacionados
- `docs/deploy/DEPLOY_KAMAL_NGINX_VM_E_VPS.md` — roteiro de deploy (ensaio na VM e VPS) e decisões pendentes D1–D5. **Nota D1:** o Kamal 2.x usa `kamal-proxy` no lugar do Traefik (Traefik só como acessório); confirmar a versão antes de assumir Traefik.
- `docs/config/HARDENING_VPS.md` — hardening do host e seção de produção.
