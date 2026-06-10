# Modifications Log

## 2026-02-06

### Contexto
- Meta: finalizar a migracao das paginas estaticas para React/Vite.
- Problema observado: tela branca ao acompanhar mudancas.
- Estado atual (antes desta rodada):
  - React/Vite em `apps/web` com rotas SPA.
  - Conteudo das paginas ainda em HTML estatico (importado via `?raw`).
  - Arquivos HTML estaticos na raiz: `admin.html`, `checkout.html`, `franquias.html` (e `index.html` removido).

### Plano (registrado antes de modificar)
1. Converter HTMLs estaticos (`apps/web/src/legacy/*.html`) para componentes React JSX.
2. Atualizar rotas/layouts/paginas para usar componentes React em vez de `dangerouslySetInnerHTML`.
3. Remover HTMLs estaticos legacy e os arquivos HTML da raiz que nao serao mais usados.
4. Rodar testes/build e registrar resultado aqui.

### Progresso
- [ ] Passo 1: Converter HTMLs estaticos para React JSX.
- [ ] Passo 2: Atualizar rotas/layouts/paginas para componentes React.
- [ ] Passo 3: Remover HTMLs estaticos legacy e HTMLs da raiz.
- [ ] Passo 4: Rodar testes/build e registrar resultado.
