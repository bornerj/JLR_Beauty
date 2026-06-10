# React Migration Guide (Index + Admin SPAs, alvo Express + Prisma + MySQL)

Objetivo: migrar o projeto para React mantendo a UI e o Tailwind atuais, com duas SPAs:
- `index.html` -> SPA publica
- `admin.html` -> SPA administrativa

## Estrutura sugerida
- `src/app/App.jsx` (entry do site publico)
- `src/app/layouts/PublicLayout.jsx` (top-nav + footer)
- `src/app/views/Home.jsx` (conteudo do `index.html`)
- `src/admin/AdminApp.jsx` (entry do admin)
- `src/admin/layouts/AdminLayout.jsx` (top-nav + sidebar + shell)
- `src/admin/components/AdminSidebar.jsx`
- `src/admin/views/DashboardView.jsx`
- `src/admin/views/MetasView.jsx`
- `src/admin/views/PerformanceView.jsx`

## Regras de migracao
- Manter classes Tailwind como estao (sem refatorar agora).
- Importar `tailwind.css` no entry principal do app React.
- Nao usar `dcmsky`: conteudo textual/imagens deve ser tratado por props/estado/API React.
- Dados dinamicos devem vir do backend Node/Express (Prisma + MySQL).

## Integração com API (Express + Prisma + MySQL)
- Definir `VITE_API_URL` (ou equivalente) para apontar o backend.
- Criar um `src/shared/api/client.js` com `fetch`/`axios` e usar nos views.
- Manter o HTML e classes atuais; trocar apenas os trechos que virarao dados reais.

## SPA publica (index)
```jsx
// src/app/App.jsx
import PublicLayout from "./layouts/PublicLayout";
import Home from "./views/Home";

export default function App() {
  return (
    <PublicLayout>
      <Home />
    </PublicLayout>
  );
}
```

```jsx
// src/app/layouts/PublicLayout.jsx
export default function PublicLayout({ children }) {
  return (
    <div className="bg-background-light dark:bg-background-dark font-body text-forest dark:text-white antialiased selection:bg-primary selection:text-forest">
      {/* colar nav de index.html */}
      <main>{children}</main>
      {/* colar footer de index.html */}
    </div>
  );
}
```

```jsx
// src/app/views/Home.jsx
export default function Home() {
  return (
    <>
      {/* colar o conteudo principal de index.html */}
    </>
  );
}
```

## SPA admin
```jsx
// src/admin/AdminApp.jsx
import { useState } from "react";
import AdminLayout from "./layouts/AdminLayout";
import DashboardView from "./views/DashboardView";
import MetasView from "./views/MetasView";
import PerformanceView from "./views/PerformanceView";

const VIEW_MAP = {
  dashboard: DashboardView,
  metas: MetasView,
  performance: PerformanceView,
};

export default function AdminApp() {
  const [activeView, setActiveView] = useState("dashboard");
  const View = VIEW_MAP[activeView] ?? DashboardView;

  return (
    <AdminLayout activeView={activeView} onChangeView={setActiveView}>
      <View />
    </AdminLayout>
  );
}
```

```jsx
// src/admin/layouts/AdminLayout.jsx
import AdminSidebar from "../components/AdminSidebar";

export default function AdminLayout({ activeView, onChangeView, children }) {
  return (
    <>
      {/* colar nav global */}
      <div className="flex flex-col lg:flex-row min-h-screen w-full relative pt-24">
        <AdminSidebar activeView={activeView} onChangeView={onChangeView} />
        <main className="flex-1 lg:ml-80 h-full overflow-y-auto bg-cream relative">
          <div className="spa-views">{children}</div>
        </main>
      </div>
    </>
  );
}
```

```jsx
// src/admin/components/AdminSidebar.jsx
export default function AdminSidebar({ activeView, onChangeView }) {
  const isActive = (view) => view === activeView;

  return (
    <aside className="w-full lg:w-80 flex-shrink-0 bg-white dark:bg-[#0c1a0e] border-b lg:border-b-0 lg:border-r border-[#cfe7d1]/50 p-6 lg:p-10 flex flex-col justify-between relative z-10 shadow-sm lg:shadow-none lg:fixed lg:top-24 lg:h-[calc(100%-6rem)] lg:overflow-y-auto">
      {/* colar estrutura atual da sidebar (admin.html) */}
      <button
        type="button"
        className={`sidebar-item group ${isActive("dashboard") ? "sidebar-item--active" : "sidebar-item--inactive"}`}
        onClick={() => onChangeView("dashboard")}
      >
        <span className="material-symbols-outlined text-primary text-xl">dashboard</span>
        <div className="flex flex-col">
          <span className="text-forest-dark dark:text-white text-base font-semibold leading-none">Painel</span>
          {isActive("dashboard") && <span className="text-primary text-xs mt-1 font-medium">Ativo</span>}
        </div>
      </button>
    </aside>
  );
}
```

```jsx
// src/admin/views/DashboardView.jsx
export default function DashboardView() {
  return (
    <section className="view-panel">
      {/* colar conteudo de dashboard em admin.html */}
    </section>
  );
}
```

```jsx
// src/admin/views/MetasView.jsx
export default function MetasView() {
  return (
    <section className="view-panel">
      {/* colar conteudo metas em admin.html (view metas) */}
    </section>
  );
}
```

```jsx
// src/admin/views/PerformanceView.jsx
export default function PerformanceView() {
  return (
    <section className="view-panel">
      {/* colar conteudo performance em admin.html (view performance) */}
    </section>
  );
}
```

## Observacoes finais
- Os arquivos `produto_det.html`, `profis_metas.html`, `profis_perform.html` foram incorporados e removidos.
- Se precisar de rotas reais, trocar `activeView` por React Router.
