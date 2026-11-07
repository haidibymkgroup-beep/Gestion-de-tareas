import { useState, type FormEvent } from 'react';
import { Modal } from '../../components/Modal';
import {
  ESTADOS,
  ETIQUETA_ESTADO,
  ETIQUETA_PRIORIDAD,
  PRIORIDADES,
  type DatosTarea,
  type Estado,
  type Prioridad,
  type Tarea,
} from '../../lib/tipos';
import { horaCorta } from '../../lib/fechas';

interface Props {
  /** Tarea a editar; null para crear una nueva. */
  tarea: Tarea | null;
  /** Columna en la que nace una tarea nueva. */
  estadoInicial?: Estado;
  onGuardar: (datos: DatosTarea) => Promise<boolean>;
  onEliminar?: () => Promise<boolean>;
  onCerrar: () => void;
}

/** Formulario para crear una tarea o ver/editar su detalle. */
export function TareaDialogo({ tarea, estadoInicial = 'pendiente', onGuardar, onEliminar, onCerrar }: Props) {
  const [titulo, setTitulo] = useState(tarea?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? '');
  const [fecha, setFecha] = useState(tarea?.fecha ?? '');
  const [hora, setHora] = useState(horaCorta(tarea?.hora ?? null) ?? '');
  const [prioridad, setPrioridad] = useState<Prioridad>(tarea?.prioridad ?? 'media');
  const [estado, setEstado] = useState<Estado>(tarea?.estado ?? estadoInicial);
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrado, setConfirmandoBorrado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorTitulo('Escribe un título para la tarea.');
      return;
    }
    setGuardando(true);
    const ok = await onGuardar({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha: fecha || null,
      hora: fecha && hora ? hora : null,
      prioridad,
      estado,
    });
    setGuardando(false);
    if (ok) onCerrar();
  }

  async function borrar() {
    if (!onEliminar) return;
    setGuardando(true);
    const ok = await onEliminar();
    setGuardando(false);
    if (ok) onCerrar();
  }

  return (
    <Modal titulo={tarea ? 'Detalle de la tarea' : 'Nueva tarea'} onCerrar={onCerrar}>
      <form className="formulario" onSubmit={enviar}>
        <label className="campo">
          <span>Título</span>
          <input
            type="text"
            value={titulo}
            maxLength={200}
            autoFocus={!tarea}
            aria-invalid={errorTitulo ? true : undefined}
            aria-describedby={errorTitulo ? 'error-titulo' : undefined}
            onChange={(e) => {
              setTitulo(e.target.value);
              if (errorTitulo) setErrorTitulo(null);
            }}
          />
          {errorTitulo && (
            <small id="error-titulo" className="error-campo" role="alert">
              {errorTitulo}
            </small>
          )}
        </label>

        <label className="campo">
          <span>Descripción (opcional)</span>
          <textarea rows={3} maxLength={2000} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </label>

        <div className="fila-campos">
          <label className="campo">
            <span>Fecha</span>
            <input
              type="date"
              value={fecha}
              onChange={(e) => {
                setFecha(e.target.value);
                if (!e.target.value) setHora('');
              }}
            />
          </label>
          <label className="campo">
            <span>Hora</span>
            <input type="time" value={hora} disabled={!fecha} onChange={(e) => setHora(e.target.value)} />
          </label>
        </div>

        <div className="fila-campos">
          <label className="campo">
            <span>Prioridad</span>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value as Prioridad)}>
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {ETIQUETA_PRIORIDAD[p]}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span>Estado</span>
            <select value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
              {ESTADOS.map((s) => (
                <option key={s} value={s}>
                  {ETIQUETA_ESTADO[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {confirmandoBorrado ? (
          <div className="confirmacion" role="alertdialog" aria-label="Confirmar eliminación">
            <p>¿Eliminar esta tarea? No se puede deshacer.</p>
            <div className="acciones">
              <button type="button" className="boton boton-peligro" onClick={borrar} disabled={guardando}>
                Sí, eliminar
              </button>
              <button type="button" className="boton boton-secundario" onClick={() => setConfirmandoBorrado(false)}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="acciones acciones-separadas">
            {tarea && onEliminar ? (
              <button type="button" className="boton boton-texto-peligro" onClick={() => setConfirmandoBorrado(true)}>
                Eliminar
              </button>
            ) : (
              <span />
            )}
            <div className="acciones">
              <button type="button" className="boton boton-secundario" onClick={onCerrar}>
                Cancelar
              </button>
              <button type="submit" className="boton boton-primario" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
