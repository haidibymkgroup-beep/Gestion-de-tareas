import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthProvider';
import { traducirErrorAuth } from './errores';

type Metodo = 'enlace' | 'password';

export function LoginPage() {
  const { usuario, cargando } = useAuth();
  const [metodo, setMetodo] = useState<Metodo>('enlace');
  const [creandoCuenta, setCreandoCuenta] = useState(false);
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!cargando && usuario) return <Navigate to="/" replace />;

  const redirigirA = window.location.origin;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    setEnviando(true);
    try {
      if (metodo === 'enlace') {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: correo.trim(),
          options: { emailRedirectTo: redirigirA },
        });
        if (err) throw err;
        setAviso(`Te hemos enviado un enlace a ${correo.trim()}. Ábrelo en este dispositivo para entrar.`);
      } else if (creandoCuenta) {
        const { data, error: err } = await supabase.auth.signUp({
          email: correo.trim(),
          password,
          options: { emailRedirectTo: redirigirA },
        });
        if (err) throw err;
        // Si el proyecto exige confirmar el correo no hay sesión todavía.
        if (!data.session) setAviso('Cuenta creada. Revisa tu correo para confirmarla y después inicia sesión.');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: correo.trim(), password });
        if (err) throw err;
      }
    } catch (err) {
      setError(traducirErrorAuth(err as { message?: string; code?: string; status?: number }));
    } finally {
      setEnviando(false);
    }
  }

  async function entrarConGoogle() {
    setError(null);
    setAviso(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirigirA },
    });
    if (err) setError(traducirErrorAuth(err));
  }

  const etiquetaBoton =
    metodo === 'enlace' ? 'Enviarme un enlace' : creandoCuenta ? 'Crear cuenta' : 'Iniciar sesión';

  return (
    <main className="login">
      <div className="login-caja">
        <img className="login-logo" src="/logo.svg" alt="" width="56" height="56" />
        <h1>Gestión de Tareas</h1>
        <p className="texto-suave">Habla o escribe, y tus tareas se organizan solas.</p>

        <button type="button" className="boton boton-secundario boton-ancho" onClick={entrarConGoogle}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.4z" />
            <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A12 12 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.6 14.7a7.2 7.2 0 0 1 0-4.6v-3H1.8a12 12 0 0 0 0 10.6l3.8-3z" />
            <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A12 12 0 0 0 1.8 7.1l3.8 3C6.5 6.8 9 4.8 12 4.8z" />
          </svg>
          Continuar con Google
        </button>

        <div className="separador" role="separator">
          <span>o con tu correo</span>
        </div>

        <div className="pestanas" role="group" aria-label="Método de acceso">
          <button
            type="button"
            className="pestana"
            aria-pressed={metodo === 'enlace'}
            onClick={() => setMetodo('enlace')}
          >
            Enlace por correo
          </button>
          <button
            type="button"
            className="pestana"
            aria-pressed={metodo === 'password'}
            onClick={() => setMetodo('password')}
          >
            Contraseña
          </button>
        </div>

        <form onSubmit={enviar} className="formulario">
          <label className="campo">
            <span>Correo electrónico</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
            />
          </label>

          {metodo === 'password' && (
            <label className="campo">
              <span>Contraseña</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={creandoCuenta ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
          )}

          {error && (
            <p className="mensaje mensaje-error" role="alert">
              {error}
            </p>
          )}
          {aviso && (
            <p className="mensaje mensaje-ok" role="status">
              {aviso}
            </p>
          )}

          <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando}>
            {enviando ? 'Un momento…' : etiquetaBoton}
          </button>
        </form>

        {metodo === 'password' && (
          <button type="button" className="enlace" onClick={() => setCreandoCuenta((v) => !v)}>
            {creandoCuenta ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Créala'}
          </button>
        )}
      </div>
    </main>
  );
}
