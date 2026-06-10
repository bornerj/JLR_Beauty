import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import RequireAdmin from "./RequireAdmin";
import AdminPage from "../pages/Admin";
import AssinaturasPage from "../pages/Assinaturas";
import DbConsolePage from "../pages/DbConsole";
import FranquiasPage from "../pages/Franquias";
import HomePage from "../pages/Home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="index.html" element={<Navigate to="/" replace />} />
        <Route path="assinaturas.html" element={<Navigate to="/assinaturas" replace />} />
        <Route path="franquias.html" element={<Navigate to="/franquias" replace />} />
        <Route path="checkout.html" element={<Navigate to="/?checkout=1" replace />} />
        <Route path="admin.html" element={<Navigate to="/admin" replace />} />
        <Route path="db-console.html" element={<Navigate to="/db-console" replace />} />
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="assinaturas" element={<AssinaturasPage />} />
          <Route path="franquias" element={<FranquiasPage />} />
          <Route path="checkout" element={<Navigate to="/?checkout=1" replace />} />
        </Route>
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route
          path="db-console"
          element={
            <RequireAdmin>
              <DbConsolePage />
            </RequireAdmin>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
