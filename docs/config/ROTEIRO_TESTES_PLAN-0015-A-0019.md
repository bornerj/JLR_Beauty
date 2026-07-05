# Roteiro de Testes Manuais — PLAN-0015 a PLAN-0019

> Cobre as entregas de: Página de Franquias (13 novas seções), fine-tuning visual de Franquias,
> Navegação Unificada, galeria "Sobre" da Home, Autenticação/Segurança (PLAN-0017) e Hardening
> Adicional Pós-Incidente (PLAN-0018). PLAN-0019 (TLS/HTTPS) está bloqueado — ver nota ao final.

**Como usar:** execute os testes na ordem. Para cada um, marque o checkbox quando o resultado
observado bater com o "Resultado Esperado". Um bloco só é considerado **DONE** quando **todos**
os testes daquele bloco passarem.

---

## Bloco A — PLAN-0015: Página de Franquias (13 novas seções)

### Teste 1 — Página de Franquias carrega sem erros
- **Como testar:** Acesse `/franquias`. Abra o console do navegador (F12).
- **Resultado esperado:** Página carrega completamente, sem erros vermelhos no console, sem seções quebradas ou vazias.
- **DONE quando:** Console limpo (sem erros de JS) e todas as seções abaixo renderizam conteúdo.

### Teste 2 — Ordem e presença das seções
- **Como testar:** Role a página de Franquias de cima a baixo.
- **Resultado esperado:** As seções aparecem nesta ordem: Hero → Sobre → Visão → **Founder** (nova) → **Benefícios** (nova) → Missão → Modelos → **Fran01/Master** (nova) → **Fran02/Prime** (nova) → **Fran03/Essencial** (nova) → **Gestão App** (nova) → **Fluxo de Caixa** (nova) → **Marketing & CRM** (nova) → **Expansão** (nova) → **Perfil do Franqueado** (nova) → **Suporte à Franqueadora** (nova) → **Etapas de Abertura** (nova) → Contato.
- **DONE quando:** Todas as 13 seções novas estão presentes e na ordem acima, cada uma com texto e imagem/mídia visíveis (nenhuma em branco).

### Teste 3 — Seção Founder (fundador)
- **Como testar:** Localize a seção do fundador (logo após "Visão").
- **Resultado esperado:** Layout 2 colunas (foto à esquerda, texto à direita); há uma citação (quote) em um círculo verde/dourado sobreposto à foto.
- **DONE quando:** Foto, texto e o círculo de citação aparecem corretamente, sem sobreposição quebrada.

### Teste 4 — Seção Benefícios
- **Como testar:** Localize a seção de benefícios (grid).
- **Resultado esperado:** Grid 3×3 (9 células) com ícone + texto em cada célula, todas preenchidas.
- **DONE quando:** As 9 células aparecem completas, sem ícones quebrados/faltando.

### Teste 5 — Seções dos modelos de franquia (Fran01/02/03)
- **Como testar:** Role até as seções de detalhe dos modelos (após "Nossos Modelos").
- **Resultado esperado:** 3 seções em layout de 3 colunas cada, com conceito + investimento + métricas visíveis.
- **DONE quando:** As 3 seções (Master, Prime, Essencial) mostram valores de investimento e métricas preenchidos (não "undefined" ou vazio).

### Teste 6 — Seção Gestão App
- **Como testar:** Localize a seção "Gestão App".
- **Resultado esperado:** Layout 2 colunas — lista de features à esquerda, mockup de app à direita.
- **DONE quando:** Mockup carrega (imagem não quebrada) e lista de features está completa.

### Teste 7 — Seção Fluxo de Caixa
- **Como testar:** Localize a seção "Fluxo de Caixa".
- **Resultado esperado:** Layout 2 colunas — features/divisores à esquerda, faixa (stripe) em tom verde-água à direita.
- **DONE quando:** Ambas as colunas renderizam corretamente, sem quebra de layout.

### Teste 8 — Seção Marketing & CRM
- **Como testar:** Localize a seção "Marketing & CRM".
- **Resultado esperado:** Lista com sub-itens (bullets aninhados) à esquerda, foto à direita.
- **DONE quando:** Lista e sub-bullets aparecem formatados corretamente; foto carrega.

### Teste 9 — Seção Expansão
- **Como testar:** Localize a seção "Expansão".
- **Resultado esperado:** Mapa à esquerda, texto com citações (quotes) à direita.
- **DONE quando:** Mapa/imagem carrega; citações aparecem com formatação diferenciada do texto normal.

### Teste 10 — Seção Perfil do Franqueado
- **Como testar:** Localize a seção "Perfil do Franqueado".
- **Resultado esperado:** Foto à esquerda, lista numerada à direita.
- **DONE quando:** Lista numerada completa e legível; foto carrega.

### Teste 11 — Seção Suporte da Franqueadora
- **Como testar:** Localize a seção "Suporte à Franqueadora".
- **Resultado esperado:** 3 grupos de conteúdo à esquerda, foto à direita.
- **DONE quando:** Os 3 grupos aparecem com título + conteúdo; foto carrega.

### Teste 12 — Seção Etapas de Abertura
- **Como testar:** Localize a última seção antes do Contato ("Etapas de Abertura").
- **Resultado esperado:** Layout "snake" (cobra) com 10 passos numerados, largura total da página, e um botão de CTA ao final.
- **DONE quando:** Os 10 passos aparecem na ordem correta e o botão de CTA está clicável.

### Teste 13 — Admin: seções de Franquias aparecem no editor de texto
- **Como testar:** Logue como admin, acesse o editor de Page Texts, filtre pela página "Franquias".
- **Resultado esperado:** Os ~145 novos campos de texto das 13 seções aparecem listados e editáveis.
- **DONE quando:** É possível editar um texto de qualquer uma das 13 novas seções e ver a mudança refletida em `/franquias` após salvar.

### Teste 14 — Admin: toggles de seção funcionam
- **Como testar:** No painel admin, acesse os "Section Toggles" da página Franquias. Desative uma das 13 novas seções (ex.: Benefícios).
- **Resultado esperado:** A seção desaparece de `/franquias` ao recarregar a página.
- **DONE quando:** Reativar o toggle faz a seção reaparecer corretamente, sem quebrar o layout das seções vizinhas.

**Bloco A é DONE quando:** Testes 1 a 14 passam.

---

## Bloco B — Fine-Tuning Visual de Franquias (ajustes pós-PLAN-0015)

### Teste 15 — Alternância de fundo (bg A/B)
- **Como testar:** Role a página `/franquias` de ponta a ponta observando a cor de fundo de cada seção.
- **Resultado esperado:** As 13 seções alternam entre dois tons de fundo (padrão A/B), sem duas seções consecutivas com o mesmo fundo.
- **DONE quando:** A alternância é visualmente consistente do topo ao final da página.

### Teste 16 — Imagens sem corte forçado (object-contain)
- **Como testar:** Observe as imagens das seções "Expansão", "Perfil do Franqueado" e "Suporte à Franqueadora".
- **Resultado esperado:** As imagens aparecem inteiras, sem corte/zoom excessivo (não devem parecer "cropadas" de forma agressiva).
- **DONE quando:** As 3 imagens mostram a cena completa, proporcionalmente, sem esticar ou distorcer.

### Teste 17 — Cards dos modelos de franquia (seção "Nossos Modelos")
- **Como testar:** Localize a seção "Nossos Modelos" (antes das seções Fran01/02/03).
- **Resultado esperado:**
  1. Ordem dos cards: **Essencial I → Prime → Master** (da esquerda para a direita)
  2. Nenhum overlay escuro sobre as fotos dos cards
  3. Nome e subtítulo do modelo aparecem **abaixo** da imagem (não sobrepostos)
  4. Cada card tem um botão que navega para a seção de detalhe correspondente (ex.: botão do card "Master" leva para `/franquias#fran01`)
- **DONE quando:** Os 4 itens acima são confirmados clicando em cada um dos 3 botões e verificando que a página rola para a seção correta.

**Bloco B é DONE quando:** Testes 15 a 17 passam.

---

## Bloco C — PLAN-0016: Navegação Unificada

### Teste 18 — Menu idêntico nas 3 páginas
- **Como testar:** Compare o menu de navegação (topo) em `/`, `/assinaturas` e `/franquias`.
- **Resultado esperado:** Estrutura e estilo visual idênticos nas 3 páginas (mesma fonte, cor, espaçamento).
- **DONE quando:** Nenhuma diferença visual perceptível entre os 3 menus, exceto o item ativo/destacado.

### Teste 19 — Dropdown "JLR Beauty"
- **Como testar:** Clique no dropdown "JLR Beauty" no menu (em qualquer página).
- **Resultado esperado:** Aparecem os itens: Tratamentos, Assinaturas, Quem Somos, Depoimentos, e 2 CTAs no rodapé do dropdown.
- **DONE quando:** Todos os links levam para os anchors corretos (`/#services`, `/assinaturas`, `/#about`, `/#testimonials`).

### Teste 20 — Dropdown "Assinaturas" (novo)
- **Como testar:** Clique no dropdown "Assinaturas" no menu.
- **Resultado esperado:** Aparecem: Planos & Benefícios, Quem Somos, Depoimentos, CTA "Ver Planos".
- **DONE quando:** Cada link navega corretamente para `/assinaturas#membership`, `/assinaturas#about`, `/assinaturas#testimonials`.

### Teste 21 — Dropdown "Franquias" (renovado, 7 landmarks)
- **Como testar:** Clique no dropdown "Franquias" no menu.
- **Resultado esperado:** Aparecem 7 itens: Sobre a Marca, Nossos Modelos, Tecnologia & Gestão, Fluxo de Caixa, Perfil do Franqueado, Etapas de Abertura, Seja Parceiro — mais 2 CTAs.
- **DONE quando:** Cada um dos 7 itens navega para o anchor correto em `/franquias` (ex.: `#about`, `#models`, `#gestao-app`, `#fluxo-caixa`, `#perfil-franqueado`, `#etapas-abertura`, `#contact`).

### Teste 22 — Dropdown "Produtos" sem typo
- **Como testar:** Clique no dropdown "Produtos" no menu.
- **Resultado esperado:** O item da coleção aparece escrito corretamente como "**Coleção**" (com "ç" e acento), não "Colecao".
- **DONE quando:** Texto confirmado correto em qualquer uma das 3 páginas.

### Teste 23 — Menu mobile unificado
- **Como testar:** Redimensione a janela (ou acesse via celular) para largura mobile. Abra o menu hambúrguer em `/`, `/assinaturas` e `/franquias`.
- **Resultado esperado:** Menu mobile mostra as mesmas seções agrupadas (Salão / Assinaturas / Franquias / Produtos) nas 3 páginas.
- **DONE quando:** Todos os links do menu mobile funcionam e levam ao destino esperado, nas 3 páginas.

### Teste 24 — MissionSection navegável por anchor
- **Como testar:** Acesse diretamente a URL `/assinaturas#mission` (ou `/franquias#mission`) digitando no navegador.
- **Resultado esperado:** A página rola automaticamente até a seção de Missão/Visão/Valores.
- **DONE quando:** O scroll automático funciona nas duas páginas (Assinaturas e Franquias).

**Bloco C é DONE quando:** Testes 18 a 24 passam.

---

## Bloco D — Home: Galeria "Sobre" (Flowbite Featured Image)

### Teste 25 — Layout da galeria
- **Como testar:** Acesse `/` e role até a seção "Sobre" (About).
- **Resultado esperado:** Galeria no topo, ocupando a largura total do container: 1 imagem em destaque (maior) + uma fileira de 5 miniaturas abaixo dela. Texto (título, CTA, parágrafos, estatísticas) aparece **abaixo** da galeria, dividido em 2 colunas internas.
- **DONE quando:** A imagem de destaque e as 5 miniaturas carregam corretamente, sem quebra de grid (não deve haver miniaturas empilhadas verticalmente).

### Teste 26 — Responsividade da galeria (mobile)
- **Como testar:** Redimensione a janela para largura mobile (ou acesse via celular) na seção "Sobre" da Home.
- **Resultado esperado:** Galeria e texto continuam legíveis e organizados, sem overflow horizontal (sem scroll lateral indesejado).
- **DONE quando:** Nenhum elemento vaza da tela nem fica cortado.

**Bloco D é DONE quando:** Testes 25 e 26 passam.

---

## Bloco E — PLAN-0017: Autenticação e Segurança

### Teste 27 — Cadastro de novo usuário
- **Como testar:** No menu, abra o modal de cadastro. Preencha nome, e-mail e senha válidos (senha forte, mín. 8 caracteres).
- **Resultado esperado:** Cadastro é aceito; mensagem indicando que um e-mail de verificação foi enviado.
- **DONE quando:** Conta é criada e o fluxo não trava nem retorna erro genérico.

### Teste 28 — Login exige e-mail verificado
- **Como testar:** Tente logar imediatamente com a conta criada no Teste 27, antes de verificar o e-mail.
- **Resultado esperado:** Login é **recusado** com mensagem informando que o e-mail precisa ser verificado (não deve autenticar).
- **DONE quando:** Acesso é bloqueado até a verificação ser concluída.

### Teste 29 — Login com credenciais inválidas
- **Como testar:** Tente logar com um e-mail que não existe, e depois com senha errada para um e-mail existente.
- **Resultado esperado:** Ambos os casos retornam mensagem de erro genérica (não deve revelar se o e-mail existe ou não).
- **DONE quando:** A mensagem de erro é a mesma nos dois casos.

### Teste 30 — Bloqueio por tentativas de login (rate limit)
- **Como testar:** Tente logar com senha errada repetidamente (8+ vezes seguidas) para o mesmo e-mail.
- **Resultado esperado:** Após um número de tentativas, o sistema bloqueia novas tentativas temporariamente (mensagem de "muitas tentativas" ou similar).
- **DONE quando:** O bloqueio é acionado e some sozinho após o tempo de espera indicado.

### Teste 31 — Login válido e sessão
- **Como testar:** Logue com um usuário válido e e-mail verificado (ex.: conta master/admin de teste).
- **Resultado esperado:** Login funciona; menu passa a mostrar o usuário autenticado/opções de conta.
- **DONE quando:** Sessão permanece ativa ao navegar entre páginas (Home, Assinaturas, Franquias) sem deslogar.

### Teste 32 — Logout
- **Como testar:** Estando logado, clique em "Sair"/"Logout".
- **Resultado esperado:** Sessão é encerrada; menu volta a mostrar opções de login/cadastro.
- **DONE quando:** Após logout, recarregar a página não mantém o usuário autenticado.

### Teste 33 — Expiração de sessão (token de curta duração)
- **Como testar:** Logue e aguarde 15+ minutos sem interagir, depois tente uma ação que exige autenticação (ex.: acessar área logada).
- **Resultado esperado:** Sessão expira e é renovada automaticamente em segundo plano (refresh token) **ou** solicita novo login, sem erro visível para o usuário em uso normal (navegação contínua).
- **DONE quando:** Não há travamento nem tela de erro — a experiência é transparente enquanto o usuário estiver ativo.

### Teste 34 — Painel Admin exige permissão
- **Como testar:** Sem estar logado (ou logado como CLIENT comum), tente acessar `/admin` diretamente pela URL.
- **Resultado esperado:** Acesso é bloqueado/redirecionado — painel admin não aparece para quem não tem permissão.
- **DONE quando:** Somente contas ADMIN/MASTER conseguem ver o conteúdo de `/admin`.

**Bloco E é DONE quando:** Testes 27 a 34 passam.

---

## Bloco F — PLAN-0018: Hardening Adicional Pós-Incidente

### Teste 35 — Cupom de desconto inválido no checkout
- **Como testar:** Inicie um checkout (adicione item ao carrinho), no campo de cupom digite um código que não existe (ex.: "TESTE123") e aplique.
- **Resultado esperado:** Mensagem de "cupom não encontrado" (sem revelar detalhes internos).
- **DONE quando:** Erro é claro e o checkout continua funcional (não trava em "Aplicando...").

### Teste 36 — Rate limit de validação de cupom
- **Como testar:** No campo de cupom, tente aplicar 6 códigos diferentes (todos inválidos) em menos de 1 minuto.
- **Resultado esperado:** A partir da 6ª tentativa, o sistema responde com mensagem de limite de requisições excedido, em vez de continuar validando.
- **DONE quando:** O bloqueio aparece e some sozinho depois de ~1 minuto, voltando a aceitar tentativas.

### Teste 37 — Checkout completo com cupom válido
- **Como testar:** Peça para o admin criar um cupom de teste ativo (via painel), aplique esse código no checkout.
- **Resultado esperado:** Desconto é calculado e exibido corretamente no total do pedido.
- **DONE quando:** O valor final do pedido reflete o desconto do cupom aplicado.

### Teste 38 — Widget de agendamento (concierge) na Home
- **Como testar:** Na Home, use o widget de agendamento: selecione serviço, unidade, data e horário normalmente.
- **Resultado esperado:** Fluxo completo funciona sem erros, mesmo após múltiplos cliques normais de navegação entre os passos.
- **DONE quando:** É possível completar o fluxo de agendamento até a etapa final sem bloqueio.

### Teste 39 — Rate limit do widget de agendamento
- **Como testar:** No widget de agendamento, navegue entre os passos (voltar/avançar) repetidamente, mais de 10 vezes em menos de 1 minuto.
- **Resultado esperado:** Em algum momento, o sistema responde com limite de requisições excedido temporariamente.
- **DONE quando:** O widget volta ao normal após ~1 minuto sem precisar recarregar a página manualmente.

### Teste 40 — Rastreio de pedido (se a página existir no site)
- **Como testar:** Verifique se existe alguma página/link de "rastrear pedido" no site público.
- **Resultado esperado:** *(Nota: esta funcionalidade tem proteção nova no backend — HMAC — mas ainda não está conectada a nenhuma página do site. Não deve haver link de rastreio público funcional ainda.)*
- **DONE quando:** Confirmado que não há regressão — ou seja, se essa página não existia antes, continua não existindo (comportamento inalterado do ponto de vista do usuário final).

### Teste 41 — Admin: acesso ainda funciona normalmente com as novas proteções
- **Como testar:** Logado como admin, acesse listagem de usuários, pedidos e clientes no painel.
- **Resultado esperado:** Todas as listagens carregam normalmente (RLS e mudanças de banco não afetam o admin).
- **DONE quando:** Nenhuma tela do admin quebra ou demora anormalmente para carregar.

**Bloco F é DONE quando:** Testes 35 a 41 passam.

---

## Bloco G — PLAN-0019: TLS/HTTPS (⏸️ NÃO TESTÁVEL AINDA)

Este plano está **bloqueado** — o servidor de produção ainda não tem domínio configurado, pré-requisito
para emitir certificado TLS (Let's Encrypt). **Não execute testes deste bloco até o domínio estar
configurado e o PLAN-0019 ser retomado.**

Quando aplicável no futuro:

### Teste 42 — Acesso via HTTPS
- **Como testar:** Acesse `https://seudominio.com` diretamente.
- **Resultado esperado:** Site carrega com cadeado de segurança no navegador, sem avisos de certificado inválido.
- **DONE quando:** Não há nenhum aviso de "conexão não segura".

### Teste 43 — Redirecionamento HTTP → HTTPS
- **Como testar:** Acesse `http://seudominio.com` (sem "s") diretamente.
- **Resultado esperado:** Navegador é redirecionado automaticamente para `https://seudominio.com`.
- **DONE quando:** A URL final na barra de endereço sempre mostra `https://`.

---

## Resumo — Critério de DONE Geral

| Bloco | Testes | Status para fechar |
|-------|--------|---------------------|
| A — Página de Franquias (13 seções) | 1–14 | Todos passam |
| B — Fine-tuning visual Franquias | 15–17 | Todos passam |
| C — Navegação Unificada | 18–24 | Todos passam |
| D — Galeria "Sobre" da Home | 25–26 | Todos passam |
| E — Autenticação e Segurança | 27–34 | Todos passam |
| F — Hardening Pós-Incidente | 35–41 | Todos passam |
| G — TLS/HTTPS | 42–43 | Bloqueado — não aplicável ainda |

**O roteiro completo (Blocos A–F) é considerado DONE quando os 41 testes aplicáveis passarem.**
Qualquer teste que falhar deve ser registrado com print/descrição do erro para virar um item em
`memory/logs/DEBUG-HISTORY.md` antes de ser corrigido.
