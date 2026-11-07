import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ETIQUETA_ESTADO, type Estado, type Tarea } from '../../lib/tipos';
import { TarjetaOrdenable } from './Tarjeta';

interface Props {
  estado: Estado;
  /** Tareas en el orden en que se muestran (puede ser provisional durante un arrastre). */
  tareas: Tarea[];
  zona: string;
  onAbrir: (id: string) => void;
  onNueva: (estado: Estado) => void;
}

export function Columna({ estado, tareas, zona, onAbrir, onNueva }: Props) {
  // La propia columna es una zona donde soltar, para poder dejar tarjetas en columnas vacías.
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  const idTitulo = `columna-${estado}`;

  return (
    <section className="columna" aria-labelledby={idTitulo} data-estado={estado} data-sobre={isOver || undefined}>
      <header className="columna-cabecera">
        <h2 id={idTitulo}>
          {ETIQUETA_ESTADO[estado]} <span className="contador" aria-label={`${tareas.length} tareas`}>{tareas.length}</span>
        </h2>
        <button
          type="button"
          className="boton-icono"
          aria-label={`Añadir tarea en ${ETIQUETA_ESTADO[estado]}`}
          onClick={() => onNueva(estado)}
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </header>

      <SortableContext items={tareas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="columna-lista">
          {tareas.map((t) => (
            <TarjetaOrdenable key={t.id} tarea={t} zona={zona} onAbrir={() => onAbrir(t.id)} />
          ))}
          {tareas.length === 0 && <p className="columna-vacia">Sin tareas</p>}
        </div>
      </SortableContext>
    </section>
  );
}
