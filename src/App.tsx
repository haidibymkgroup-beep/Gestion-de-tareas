import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthProvider';
import { LoginPage } from './features/auth/LoginPage';
import { PerfilProvider } from './features/ajustes/PerfilProvider';
import { AjustesPage } from './features/ajustes/AjustesPage';
import { Tablero } from './features/tablero/Tablero';
import { Cabecera } from './components/Cabecera';
import type { ReactNode } from 'react';

/** Solo deja pasar a usuarios con sesión; el resto va al login. */
function Protegida({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useAuth();
  if (cargando) {
    return (
      <p className="estado-carga" role="status">
        Cargando…
      </p>
    );
  }
  if (!usuario) return <Navigate to="/login" replace />;
  return <PerfilProvider>{children}</PerfilProvider>;
}

function PaginaTablero() {
  const { usuario } = useAuth();
  if (!usuario) return null;
  return (
    <div className="app">
      <Cabecera />
      <main className="contenido-tablero">
        <h1 className="solo-lectores">Tablero de tareas</h1>
        <Tablero userId={usuario.id} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <Protegida>
                <PaginaTablero />
              </Protegida>
            }
          />
          <Route
            path="/ajustes"
            element={
              <Protegida>
                <div className="app">
                  <Cabecera />
                  <AjustesPage />
                </div>
              </Protegida>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
