import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { usePerfil } from './PerfilProvider';
import { zonaDelNavegador, zonaValida } from '../../lib/fechas';

export function AjustesPage() {
  const { usuario, cerrarSesion } = useAuth();
  const { perfil, cargando, actualizar, error } = usePerfil();

  const [nombre, setNombre] = useState<string | null>(null);
  const [zona, setZona] = useState<string | null>(null);
  const [errorZona, setErrorZona] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Lista de zonas IANA para el autocompletado (si el navegador la ofrece).
  const zonas = useMemo<string[]>(() => {
    const fn = (Intl as unknown as { supportedValuesOf?: (clave: string) => string[] }).supportedValuesOf;
    return fn ? fn('timeZone') : [];
  }, []);

  if (cargando || !perfil) {
    return (
      <main className="pagina">
        <p className="estado-carga" role="status">
          Cargando ajustes…
        </p>
      </main>
    );
  }

  const nombreActual = nombre ?? perfil.nombre ?? '';
  const zonaActual = zona ?? perfil.zona_horaria;

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardado(false);
    if (!zonaValida(zonaActual)) {
      setErrorZona('Zona horaria no válida. Elige una de la lista (por ejemplo, Europe/Madrid).');
      return;
    }
    setErrorZona(null);
    setGuardando(true);
    const ok = await actualizar({ nombre: nombreActual.trim() || null, zona_horaria: zonaActual });
    setGuardando(false);
    setGuardado(ok);
  }

  return (
    <main className="pagina">
      <Link to="/" className="enlace-volver">
        ← Volver al tablero
      </Link>
      <h1>Ajustes</h1>

      <form className="formulario tarjeta-ajustes" onSubmit={guardar}>
        <h2>Cuenta</h2>
        <p className="texto-suave">{usuario?.email}</p>

        <label className="campo">
          <span>Nombre</span>
          <input type="text" value={nombreActual} maxLength={80} onChange={(e) => setNombre(e.target.value)} />
        </label>

        <label className="campo">
          <span>Zona horaria</span>
          <input
            type="text"
            list="lista-zonas"
            value={zonaActual}
            aria-invalid={errorZona ? true : undefined}
            aria-describedby="ayuda-zona"
            onChange={(e) => setZona(e.target.value)}
          />
          <datalist id="lista-zonas">
            {zonas.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
          <small id="ayuda-zona" className="texto-suave">
            Se usa para entender «mañana a las 5» y para enviar tus recordatorios a la hora correcta.
          </small>
          {errorZona && (
            <small className="error-campo" role="alert">
              {errorZona}
            </small>
          )}
        </label>
        <button type="button" className="enlace" onClick={() => setZona(zonaDelNavegador())}>
          Usar la zona de este dispositivo ({zonaDelNavegador()})
        </button>

        {error && (
          <p className="mensaje mensaje-error" role="alert">
            {error}
          </p>
        )}
        {guardado && (
          <p className="mensaje mensaje-ok" role="status">
            Cambios guardados.
          </p>
        )}

        <button type="submit" className="boton boton-primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>

      <button type="button" className="boton boton-secundario" onClick={() => void cerrarSesion()}>
        Cerrar sesión
      </button>
    </main>
  );
}
