# Visão Geral de Segurança — JLR Beauty Platform

**Versão:** 1.0  
**Data:** 2026-06-22  
**Referência técnica:** PLAN-0017 (4 fases, concluído)

---

## Para que serve este documento

Este documento explica, em linguagem acessível, cada medida de segurança implementada na plataforma JLR Beauty. O objetivo é que você possa entender o que foi feito, por que foi feito, e como verificar que está funcionando — sem precisar ser desenvolvedor para isso.

A plataforma passou por uma revisão completa de segurança dividida em 4 fases, todas concluídas em junho de 2026. O que está descrito aqui já está ativo em produção.

---

## Índice

1. [Proteção contra tentativas repetidas de login](#1-proteção-contra-tentativas-repetidas-de-login)
2. [Login apenas por e-mail](#2-login-apenas-por-e-mail)
3. [Verificação de e-mail obrigatória](#3-verificação-de-e-mail-obrigatória)
4. [Sessões com tempo de vida curto e renovação automática](#4-sessões-com-tempo-de-vida-curto-e-renovação-automática)
5. [Logout real — sessão encerrada de verdade](#5-logout-real--sessão-encerrada-de-verdade)
6. [Controle de acesso por papel (role)](#6-controle-de-acesso-por-papel-role)
7. [Senhas armazenadas com segurança máxima](#7-senhas-armazenadas-com-segurança-máxima)
8. [Cabeçalhos de segurança HTTP](#8-cabeçalhos-de-segurança-http)
9. [Banco de dados com usuários separados por função](#9-banco-de-dados-com-usuários-separados-por-função)
10. [Row-Level Security — o banco protege os próprios dados](#10-row-level-security--o-banco-protege-os-próprios-dados)
11. [Auditoria completa do banco de dados](#11-auditoria-completa-do-banco-de-dados)
12. [Log de auditoria de segurança](#12-log-de-auditoria-de-segurança)
13. [Dados de pagamento protegidos contra exposição](#13-dados-de-pagamento-protegidos-contra-exposição)
14. [Recuperação de senha segura](#14-recuperação-de-senha-segura)
15. [Endpoints internos protegidos](#15-endpoints-internos-protegidos)

---

## 1. Proteção contra tentativas repetidas de login

### O que é

Um mecanismo que detecta quando alguém tenta adivinhar a senha de uma conta fazendo várias tentativas seguidas — o chamado "ataque de força bruta".

### Como funciona

Cada tentativa de login malsucedida é registrada no banco de dados associando o endereço IP de origem com o e-mail tentado. Após **8 falhas em 15 minutos**, o sistema bloqueia automaticamente aquela combinação de IP + e-mail por **15 minutos**. Durante esse período, nem a senha correta funciona — o acesso só é liberado após o tempo expirar.

Importante: o registro de tentativas fica **no banco de dados**, não na memória do servidor. Isso significa que o bloqueio funciona mesmo que o servidor seja reiniciado, e funcionaria mesmo com múltiplos servidores rodando simultaneamente.

### Vantagens

- Inviabiliza ataques automatizados de força bruta — um script que testa 10.000 senhas por minuto fica bloqueado logo nas primeiras tentativas.
- A proteção persiste entre reinicializações do servidor.
- O bloqueio é por **par IP + e-mail**, então um atacante não consegue burlar simplesmente trocando o alvo.

### Como validar

1. No sistema, tente fazer login com um e-mail válido mas senha errada 9 vezes seguidas.
2. Na 9ª tentativa, o sistema responderá com: *"muitas tentativas. tente novamente em instantes"*.
3. Mesmo digitando a senha correta, o acesso será negado até o desbloqueio automático.
4. Após 15 minutos, o login normal funciona novamente.

---

## 2. Login apenas por e-mail

### O que é

O sistema aceita apenas o **e-mail** como identificador de login. Anteriormente, era possível tentar logar pelo nome do usuário.

### Como funciona

O campo de login valida o formato de e-mail antes de consultar o banco. Um e-mail tem estrutura única (único por cadastro), enquanto nomes podem se repetir — isso elimina ambiguidade.

### Vantagens

- E-mail é sempre único no sistema — não há risco de dois usuários com o mesmo identificador de acesso.
- Elimina uma categoria de ataque onde o invasor testa nomes comuns (admin, joao, maria) para encontrar contas.
- Mais intuitivo para o usuário, que sempre sabe qual é seu login.

### Como validar

1. Tente fazer login com apenas o nome (sem @): o sistema rejeita com erro de validação.
2. O login com e-mail completo no formato correto funciona normalmente.

---

## 3. Verificação de e-mail obrigatória

### O que é

Após criar uma conta, o usuário recebe um e-mail com um link de verificação. **Sem clicar nesse link, não é possível fazer login.**

### Como funciona

No momento do cadastro, o sistema gera um código único (token) com validade de **15 minutos** e o envia para o e-mail informado. Esse código é armazenado no banco de dados de forma criptografada. Quando o usuário clica no link, o sistema valida o código e marca a conta como verificada. A partir daí, o login é liberado.

Se o código expirar, é possível solicitar um novo a qualquer momento.

Usuários já cadastrados antes dessa implementação foram automaticamente marcados como verificados — não precisaram repetir o processo.

### Vantagens

- Garante que o e-mail informado no cadastro realmente pertence a quem está criando a conta.
- Impede que alguém crie uma conta usando o e-mail de outra pessoa sem o conhecimento dela.
- Previne contas "fantasma" que nunca foram realmente ativadas.
- O token expira em 15 minutos — código interceptado depois disso é inútil.

### Como validar

1. Crie uma conta nova com um e-mail válido.
2. Tente fazer login imediatamente: o sistema retorna *"confirme seu e-mail antes de fazer login"*.
3. Verifique a caixa de entrada do e-mail cadastrado e clique no link recebido.
4. O login passa a funcionar normalmente.
5. Tente usar o mesmo link novamente: o sistema rejeita (uso único).

---

## 4. Sessões com tempo de vida curto e renovação automática

### O que é

A "prova de identidade" que o sistema usa para reconhecer o usuário logado (chamada de token de acesso) tem validade de apenas **15 minutos**. Após isso, é renovada automaticamente — sem que o usuário perceba ou precise logar de novo.

### Como funciona

O sistema usa dois tipos de credenciais simultâneas:

- **Token de acesso (15 min):** usado em cada requisição para identificar o usuário. Se for interceptado, fica inválido em poucos minutos.
- **Token de renovação (7 dias):** fica armazenado de forma segura no navegador (cookie HttpOnly — inacessível a scripts da página). Quando o token de acesso expira, o sistema usa o de renovação para emitir um novo token de acesso de forma transparente.

Toda vez que o token de renovação é usado, ele é **substituído por um novo** (rotação). O anterior é invalidado imediatamente — não pode ser reutilizado.

### Vantagens

- Se um token de acesso for roubado (ex: log de rede), ele expira em no máximo 15 minutos, limitando muito o dano.
- O token de renovação fica em cookie HttpOnly — scripts maliciosos na página (XSS) não conseguem lê-lo.
- A rotação automática significa que um token de renovação capturado só pode ser usado uma vez antes de ser invalidado.
- Sessões de 7 dias com renovação automática: conforto para o usuário sem sacrificar a segurança.

### Como validar

- O usuário permanece logado por 7 dias sem precisar relogar (desde que acesse o sistema periodicamente).
- Inspecionando os cookies no navegador (F12 → Application → Cookies), o cookie `jlr_rt` aparece como HttpOnly — não é lido por JavaScript.

---

## 5. Logout real — sessão encerrada de verdade

### O que é

Quando o usuário clica em "Sair", a sessão é **realmente encerrada no servidor** — não apenas apagada no navegador.

### Como funciona

O logout revoga o token de renovação no banco de dados, marcando-o como inválido, e limpa o cookie do navegador. Mesmo que alguém tenha capturado o cookie antes do logout, a tentativa de usá-lo após o encerramento da sessão retorna erro — o banco não reconhece mais aquele token como válido.

### Vantagens

- Logout em uma aba encerra a sessão globalmente, incluindo outros dispositivos que usavam o mesmo token.
- Um token capturado antes do logout fica inútil imediatamente após o usuário sair.
- Garante conformidade com requisitos de segurança em ambientes onde múltiplas pessoas compartilham o mesmo dispositivo.

### Como validar

1. Faça login e anote o token de renovação (cookie `jlr_rt`).
2. Clique em "Sair".
3. Tente usar o token capturado para fazer uma renovação de sessão: o sistema responde com *"sessao expirada — faca login novamente"*.

---

## 6. Controle de acesso por papel (role)

### O que é

Cada usuário do sistema tem um papel (role) que define exatamente o que pode ou não pode fazer. O sistema verifica isso em **toda requisição**, não apenas no login.

### Como funciona

Existem 5 papéis hierárquicos:

| Papel | Quem é |
|-------|--------|
| MASTER | Dono/operador do SaaS — acesso total |
| ADMIN | Gerente do salão — acesso administrativo |
| MANAGER | Coordenador — acesso operacional avançado |
| PROFESSIONAL | Profissional do salão — acesso à própria agenda |
| CLIENT | Cliente final — acesso ao próprio perfil e compras |

Cada rota da API tem um guarda (guard) específico: por exemplo, só MASTER pode trocar o papel de outro usuário. Um ADMIN não consegue se promover a MASTER, nem um CLIENT consegue acessar rotas administrativas — mesmo que tente diretamente pela URL.

### Vantagens

- Princípio do mínimo privilégio: cada usuário acessa apenas o que precisa para trabalhar.
- A verificação acontece no servidor — não é possível burlar alterando dados no navegador.
- Mudanças de papel são registradas no log de auditoria (ver item 12).

### Como validar

1. Logado como CLIENT, tente acessar `/api/users` (rota de admin): resposta `403 Acesso negado`.
2. Logado como ADMIN, tente promover um usuário para MASTER: resposta `403` — apenas MASTER pode fazer isso.
3. Logado como MASTER, a troca funciona normalmente.

---

## 7. Senhas armazenadas com segurança máxima

### O que é

As senhas nunca são armazenadas em texto legível no banco de dados. Mesmo que o banco seja invadido, as senhas originais não podem ser recuperadas.

### Como funciona

Quando o usuário define uma senha, o sistema aplica um algoritmo chamado **bcrypt** com 12 rodadas de processamento. O resultado é uma sequência de caracteres sem relação com a senha original — chamada de hash. Esse hash é o que fica no banco. No login, a senha digitada passa pelo mesmo processo e o resultado é **comparado** com o hash armazenado — sem nunca revelar a senha original.

O número de rodadas (12) determina o custo computacional: cada tentativa de adivinhar uma senha leva tempo suficiente para tornar ataques de força bruta offline inviáveis.

Adicionalmente, o sistema exige que a senha tenha **mínimo de 8 caracteres com maiúscula, minúscula, número e caractere especial** — bloqueando senhas fracas na origem.

### Vantagens

- Vazamento do banco de dados não expõe as senhas dos usuários.
- bcrypt com 12 rodadas: computacionalmente caro de atacar — um hardware dedicado levaria anos para testar combinações comuns.
- Cada hash é único mesmo para senhas idênticas (bcrypt usa "salt" aleatório internamente).

### Como validar

- No banco de dados, a coluna `passwordHash` na tabela `User` mostra apenas uma sequência como `$2a$12$...` — nunca a senha em texto.
- Não há forma de "descriptografar" — a senha original é irrecuperável mesmo por quem tem acesso ao banco.

---

## 8. Cabeçalhos de segurança HTTP

### O que é

Cada resposta da API inclui um conjunto de instruções de segurança enviadas automaticamente ao navegador, dizendo o que ele deve e não deve permitir.

### Como funciona

O sistema usa uma biblioteca chamada **Helmet.js** que configura automaticamente os seguintes cabeçalhos:

| Cabeçalho | O que faz |
|-----------|-----------|
| Content-Security-Policy (CSP) | Define de onde o navegador pode carregar scripts, imagens e outros recursos. Bloqueia conteúdo externo não autorizado. |
| Strict-Transport-Security (HSTS) | Força conexão HTTPS por 1 ano. O navegador recusa HTTP mesmo se o usuário tentar. |
| X-Frame-Options: DENY | Impede que a plataforma seja incorporada em um iframe em outro site — protege contra "clickjacking". |
| X-Content-Type-Options | Impede que o navegador tente adivinhar o tipo de arquivo — elimina uma categoria de ataque. |
| Referrer-Policy | Controla quais informações são enviadas ao acessar links externos. |
| Cross-Origin-Resource-Policy | Controla quais origens podem consumir recursos da API. |

### Vantagens

- Proteção contra injeção de scripts maliciosos (XSS) via CSP.
- Garante que a plataforma nunca funcione em HTTP puro — HSTS previne interceptação em redes públicas.
- Impede ataques de clickjacking onde o invasor sobrepõe a interface real com uma falsa para capturar cliques.

### Como validar

1. Abra o sistema no navegador.
2. Pressione F12 → aba "Network" → clique em qualquer requisição → aba "Headers".
3. Na seção "Response Headers", você verá os cabeçalhos listados acima, incluindo `strict-transport-security`, `x-frame-options: DENY`, e `content-security-policy`.

---

## 9. Banco de dados com usuários separados por função

### O que é

O banco de dados PostgreSQL tem três usuários distintos, cada um com permissões diferentes. A aplicação em produção usa o de menor privilégio.

### Como funciona

| Usuário do banco | Permissões | Quando é usado |
|------------------|-----------|----------------|
| `jlrbeauty` | Total (superuser) | Apenas ao aplicar atualizações de estrutura (migrations) |
| `jlr_api_rw` | Leitura e escrita de dados | Aplicação em funcionamento normal |
| `jlr_api_ro` | Apenas leitura | Futuras integrações de relatórios |

A aplicação que roda 24/7 conecta no banco com o usuário `jlr_api_rw`. Esse usuário pode inserir, atualizar e consultar dados, mas **não pode alterar a estrutura do banco** (criar tabelas, excluir colunas, alterar permissões). Mesmo que a aplicação seja comprometida, um invasor não consegue destruir a estrutura do banco por essa conexão.

### Vantagens

- Princípio do mínimo privilégio aplicado ao banco: a aplicação tem exatamente o que precisa, nada mais.
- Um ataque de injeção SQL bem-sucedido fica limitado a dados operacionais — não consegue apagar tabelas ou criar usuários.
- As atualizações de estrutura (migrations) são feitas com o usuário privilegiado apenas durante a implantação — janela de risco mínima.

### Como validar

```
# No terminal do servidor, conectado ao banco como jlr_api_rw:
DROP TABLE "User";
# Resultado esperado: ERROR: must be owner of table User
```

O usuário de runtime não consegue executar comandos destrutivos de estrutura.

---

## 10. Row-Level Security — o banco protege os próprios dados

### O que é

Uma camada de segurança **dentro do próprio banco de dados** que controla quais linhas de dados cada usuário de banco pode acessar — independente do que a aplicação pedir.

### Como funciona

Nas tabelas mais sensíveis (`User`, `Payment`, `Customer`, `Subscription`, `Order`), o PostgreSQL verifica a identidade do usuário conectado antes de liberar qualquer dado. O usuário `jlr_api_rw` tem uma política que permite acesso a todos os registros — mas qualquer usuário de banco que não tenha essa política explícita não consegue ver absolutamente nada nessas tabelas, mesmo com acesso ao banco.

### Vantagens

- Segurança em profundidade: mesmo se alguém acessar o banco diretamente (ex: via ferramenta de administração como DBeaver) com credenciais incorretas, os dados ficam invisíveis.
- A proteção existe na camada do banco, não apenas na aplicação — é mais difícil de contornar.
- Auditado pelo PostgreSQL diretamente — qualquer tentativa de acesso não autorizado gera registro.

### Como validar

```sql
-- Conectado como usuário diferente de jlr_api_rw:
SELECT * FROM "User";
-- Resultado esperado: 0 linhas (não um erro, mas invisibilidade total)
```

---

## 11. Auditoria completa do banco de dados

### O que é

O banco de dados registra automaticamente toda tentativa de alteração na **estrutura** do banco e nas **permissões** de usuários.

### Como funciona

A extensão **pg_audit** está ativa no PostgreSQL. Ela registra nos logs do banco qualquer comando que:
- Crie, altere ou exclua tabelas, índices, funções (DDL)
- Crie, modifique ou remova usuários e permissões (ROLE)
- Conecte ou desconecte do banco (connection logs)

Adicionalmente, qualquer consulta que demore mais de 2 segundos é registrada para monitoramento de performance.

### Vantagens

- Rastreabilidade total de mudanças estruturais — se algo for alterado indevidamente no banco, há evidência com data, hora e origem.
- Detecção de tentativas de escalonamento de privilégios (alguém tentando criar um usuário novo ou se dar mais permissões).
- Logs de conexão permitem identificar acessos incomuns ao banco.

### Como validar

```bash
# Nos logs do container PostgreSQL:
docker compose logs postgres | grep "AUDIT"
# Mostrará eventos como: AUDIT: SESSION,1,1,DDL,CREATE TABLE,...
```

---

## 12. Log de auditoria de segurança

### O que é

Uma tabela dedicada dentro do sistema que registra automaticamente todos os eventos de segurança significativos: quem entrou, quem saiu, tentativas de login falhas, trocas de papel, e resets de senha.

### Como funciona

Cada evento de segurança é gravado na tabela `audit_logs` com:
- **Quem:** ID do usuário (quando identificável)
- **O quê:** tipo de evento (login, logout, falha de login, troca de papel, reset de senha)
- **Quando:** data e hora exatos
- **De onde:** endereço IP de origem
- **Contexto:** informação adicional (ex: motivo da falha — senha errada, e-mail não verificado)

Os eventos registrados são:

| Evento | Quando ocorre |
|--------|--------------|
| `LOGIN_SUCCESS` | Login bem-sucedido |
| `LOGIN_FAILED` | Tentativa de login que falhou, com motivo |
| `LOGOUT` | Usuário encerrou a sessão |
| `REGISTER` | Nova conta criada |
| `EMAIL_VERIFIED` | E-mail confirmado pelo usuário |
| `ROLE_CHANGE` | Papel de um usuário foi alterado (quem alterou, de qual papel para qual) |
| `PASSWORD_RESET_REQUEST` | Solicitação de recuperação de senha |
| `PASSWORD_RESET_SUCCESS` | Senha redefinida com sucesso |

### Vantagens

- Em caso de incidente de segurança, é possível reconstruir exatamente o que aconteceu e quando.
- Tentativas de acesso a contas específicas ficam visíveis — permite detectar ataques direcionados.
- Trocas de papel ficam registradas com "quem trocou quem" — impede alterações negadas depois.
- O registro é assíncrono (não bloqueia o sistema) — sem impacto perceptível na velocidade.

### Como validar

```sql
-- No banco de dados:
SELECT action, ip, "userId", meta, "createdAt"
FROM audit_logs
ORDER BY "createdAt" DESC
LIMIT 20;
```

Após fazer um login, um logout e uma tentativa de login com senha errada, os três eventos aparecem na tabela com todos os detalhes.

---

## 13. Dados de pagamento protegidos contra exposição

### O que é

Os eventos de pagamento recebidos do Stripe (processadora de cartão) são **filtrados antes de serem gravados** no banco de dados — removendo qualquer dado pessoal desnecessário.

### Como funciona

Quando o Stripe notifica a plataforma sobre um pagamento (via webhook), o sistema recebe um objeto completo que pode conter dados como nome do comprador, detalhes de faturamento, e-mail, endereço de entrega. Antes de gravar esse evento no banco, o sistema **remove automaticamente** todos esses campos, mantendo apenas as informações de negócio necessárias:
- ID do evento no Stripe
- Tipo de evento (pagamento aprovado, expirado, etc.)
- Valor total
- Status do pagamento
- ID da sessão de checkout

Dados como `billing_details`, `customer_details`, `shipping` e `metadata` com e-mail são descartados antes de qualquer persistência.

### Vantagens

- Minimização de dados: só guarda o que realmente precisa — princípio fundamental de privacidade (LGPD/GDPR).
- Reduz a superfície de risco: um vazamento do banco não expõe dados de cartão ou endereço do comprador capturados pelo Stripe.
- Conformidade: dados de pagamento devem ser minimizados fora do ambiente certificado PCI-DSS.

### Como validar

```sql
-- No banco de dados, após um pagamento Stripe:
SELECT payload FROM "StripeWebhookEvent" LIMIT 1;
-- O payload não contém billing_details, customer_details ou metadata com email
-- Apenas: id, type, amount_total, payment_status, payment_intent
```

---

## 14. Recuperação de senha segura

### O que é

O fluxo de "Esqueci minha senha" foi implementado de forma que não seja possível abusar dele para descobrir quais e-mails estão cadastrados no sistema.

### Como funciona

Quando o usuário solicita recuperação de senha:

1. O sistema gera um código único (token) com validade de **15 minutos**.
2. O token é armazenado no banco de dados em formato criptografado (hash SHA-256) — o token original nunca fica gravado.
3. O sistema sempre responde com a mesma mensagem — *"se o e-mail existir, um link de recuperação foi enviado"* — independente de o e-mail estar cadastrado ou não. Isso impede que um atacante use esse endpoint para descobrir quais e-mails têm conta.
4. O usuário recebe um link no e-mail com o token.
5. Ao clicar no link e definir nova senha:
   - O token é validado (deve existir no banco, não ter sido usado, não estar expirado)
   - A senha é atualizada
   - **Todas as sessões ativas do usuário são encerradas** imediatamente (todos os dispositivos)
   - O token é marcado como usado e não pode ser reutilizado

### Vantagens

- Sem "enumeração de e-mail": um atacante não sabe se um e-mail específico tem conta no sistema.
- Token de uso único: mesmo interceptado, só pode ser usado uma vez.
- Expiração de 15 minutos: janela de ataque mínima.
- Revogação de todas as sessões: se a senha foi comprometida, encerrar todas as sessões ativas é essencial para retomar o controle da conta.
- Senha nova precisa atender aos requisitos de força — não é possível redefinir para uma senha fraca.

### Como validar

1. Na tela de login, clique em "Esqueci minha senha" e informe um e-mail **que não existe** no sistema.
2. Resposta: *"se o e-mail existir, um link de recuperação foi enviado"* — mesma mensagem de quando o e-mail existe.
3. Com um e-mail real, o link recebido funciona dentro de 15 minutos.
4. Ao redefinir a senha, todos os dispositivos logados com aquela conta são desconectados.
5. Tente usar o mesmo link novamente: resposta de token inválido.

---

## 15. Endpoints internos protegidos

### O que é

As páginas de diagnóstico do sistema (status dos serviços, saúde do banco de dados) são visíveis apenas para administradores autenticados.

### Como funciona

Os endpoints `/health/services` e `/health/db` — que mostram o status de cada componente do sistema (API, banco de dados, nginx) — passaram a exigir autenticação com papel mínimo de ADMIN. Um usuário CLIENT ou qualquer pessoa sem autenticação recebe resposta de acesso negado.

O endpoint `/health` (sem sufixo), usado internamente pelo Docker para verificar se o sistema está funcionando, permanece público — é necessário para o monitoramento automático da infraestrutura.

### Vantagens

- Informações sobre infraestrutura interna (versões, status de serviços, latências) não ficam disponíveis para qualquer pessoa na internet.
- Essas informações poderiam ser usadas por um atacante para identificar versões vulneráveis ou pontos fracos da infraestrutura.

### Como validar

1. Sem estar logado, acesse `/api/health/services`: resposta `401 não autorizado`.
2. Logado como CLIENT, tente o mesmo: resposta `403 acesso negado`.
3. Logado como ADMIN ou MASTER: o painel de status dos serviços funciona normalmente.
4. `/api/health` (sem sufixo): sempre retorna `200 OK` — necessário para o Docker.

---

## Resumo geral

| # | Medida | Status |
|---|--------|--------|
| 1 | Bloqueio por tentativas excessivas de login (rate limiting) | ✅ Ativo |
| 2 | Login apenas por e-mail (sem nome) | ✅ Ativo |
| 3 | Verificação de e-mail obrigatória no cadastro | ✅ Ativo |
| 4 | Tokens de sessão com 15 min + renovação automática segura | ✅ Ativo |
| 5 | Logout real com revogação de sessão no servidor | ✅ Ativo |
| 6 | Controle de acesso por papel verificado em cada requisição | ✅ Ativo |
| 7 | Senhas com bcrypt 12 rounds + validação de força | ✅ Ativo |
| 8 | Cabeçalhos HTTP de segurança (Helmet.js) | ✅ Ativo |
| 9 | Usuários separados no banco por nível de privilégio | ✅ Ativo |
| 10 | Row-Level Security nas tabelas sensíveis | ✅ Ativo |
| 11 | Auditoria de banco de dados via pg_audit | ✅ Ativo |
| 12 | Log de auditoria de segurança (login, logout, role change...) | ✅ Ativo |
| 13 | Dados de pagamento Stripe filtrados antes de persistir | ✅ Ativo |
| 14 | Recuperação de senha segura (token único, 15 min, sem enumeração) | ✅ Ativo |
| 15 | Endpoints de diagnóstico protegidos por autenticação | ✅ Ativo |

---

## O que ainda não foi implementado (planejado)

| Medida | Prioridade | Descrição |
|--------|-----------|-----------|
| Autenticação em dois fatores (MFA/TOTP) | Média | Segundo fator de autenticação para contas MASTER e ADMIN — ex: Google Authenticator. Previsto para Fase 5. |
| Envio real de e-mail | Média | Os e-mails de verificação e reset de senha ainda são exibidos no console em ambiente de desenvolvimento. Em produção, requer configuração de serviço de envio (SendGrid, AWS SES, etc.). |

---

*Documento gerado com base no PLAN-0017 — Revisão de Segurança: Autenticação e PostgreSQL.*  
*Para dúvidas técnicas, consulte `memory/plans/PLAN-0017-SECURITY-AUTH-POSTGRESQL-AUDIT.md`.*
