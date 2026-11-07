import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ETIQUETA_PRIORIDAD, type Tarea } from '../../lib/tipos';
import { estaVencida, etiquetaFecha } from '../../lib/fechas';

interface VisualProps {
  tarea: Tarea;
  zona: string;
  onAbrir?: () => void;
  /** Atributos y listeners del asa de arrastre (vienen de dnd-kit). */
  propsAsa?: HTMLAttributes<HTMLButtonElement>;
  refAsa?: (nodo: HTMLElement | null) => void;
  arrastrando?: boolean;
  superpuesta?: boolean;
}

/** Aspecto de una tarjeta. No sabe nada de arrastrar: solo pinta. */
export const TarjetaVisual = forwardRef<HTMLElement, VisualProps & { style?: CSSProperties }>(
  function TarjetaVisual({ tarea, zona, onAbrir, propsAsa, refAsa, arrastrando, superpuesta, style }, ref) {
    const fecha = etiquetaFecha(tarea.fecha, tarea.hora, zona);
    const vencida = tarea.estado !== 'hecha' && estaVencida(tarea.fecha, tarea.hora, zona);

    return (
      <article
        ref={ref}
        style={style}
        className="tarjeta"
        data-prioridad={tarea.prioridad}
        data-hecha={tarea.estado === 'hecha' || undefined}
        data-arrastrando={arrastrando || undefined}
        data-superpuesta={superpuesta || undefined}
      >
        <button
          type="button"
          ref={refAsa}
          className="tarjeta-asa"
          aria-label={`Mover la tarea «${tarea.titulo}»`}
          {...propsAsa}
        >
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.6" />
            <circle cx="15" cy="6" r="1.6" />
            <circle cx="9" cy="12" r="1.6" />
            <circle cx="15" cy="12" r="1.6" />
            <circle cx="9" cy="18" r="1.6" />
            <circle cx="15" cy="18" r="1.6" />
          </svg>
        </button>

        <button type="button" className="tarjeta-cuerpo" onClick={onAbrir}>
          <span className="tarjeta-titulo">{tarea.titulo}</span>
          <span className="tarjeta-meta">
            {/* La prioridad se indica con color Y con texto (no depende solo del color). */}
            <span className="etiqueta-prioridad" data-prioridad={tarea.prioridad}>
              {ETIQUETA_PRIORIDAD[tarea.prioridad]}
            </span>
            {fecha && (
              <span className="etiqueta-fecha" data-vencida={vencida || undefined}>
                {vencida && <span className="solo-lectores">Vencida: </span>}
                {fecha}
              </span>
            )}
          </span>
        </button>
      </article>
    );
  },
);

interface OrdenableProps {
  tarea: Tarea;
  zona: string;
  onAbrir: () => void;
}

/** Tarjeta que se puede reordenar dentro de una columna y mover entre columnas. */
export function TarjetaOrdenable({ tarea, zona, onAbrir }: OrdenableProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: tarea.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TarjetaVisual
      ref={setNodeRef}
      style={style}
      tarea={tarea}
      zona={zona}
      onAbrir={onAbrir}
      refAsa={setActivatorNodeRef}
      propsAsa={{ ...attributes, ...listeners } as HTMLAttributes<HTMLButtonElement>}
      arrastrando={isDragging}
    />
  );
}
