import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ESTADOS, ETIQUETA_ESTADO, type DatosTarea, type Estado, type Tarea } from '../../lib/tipos';
import { necesitaReindexar, ordenEntre } from '../../lib/orden';
import { usePerfil } from '../ajustes/PerfilProvider';
import { useTareas } from '../tareas/useTareas';
import { TareaDialogo } from '../tareas/TareaDialogo';
import { Columna } from './Columna';
import { TarjetaVisual } from './Tarjeta';
import { BarraRapida } from './BarraRapida';

type IdsPorColumna = Record<Estado, string[]>;

type Dialogo = { tipo: 'nueva'; estado: Estado } | { tipo: 'editar'; id: string };

const esEstado = (id: UniqueIdentifier): id is Estado => (ESTADOS as readonly string[]).includes(String(id));

/** Devuelve la columna que contiene a `id` (o la propia columna si `id` es un estado). */
function columnaDe(id: UniqueIdentifier, ids: IdsPorColumna): Estado | undefined {
  if (esEstado(id)) return id;
  return ESTADOS.find((e) => ids[e].includes(String(id)));
}

export function Tablero({ userId }: { userId: string }) {
  const { zona } = usePerfil();
  const { tareas, columnas, cargando, error, limpiarError, crear, actualizar, mover, reordenarColumna, eliminar } =
    useTareas(userId);

  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

  // Mientras se arrastra, mantenemos una copia local de qué ids hay en cada columna.
  // Al soltar, se guarda en la base de datos y se descarta la copia.
  const [provisional, setProvisional] = useState<IdsPorColumna | null>(null);
  const [activaId, setActivaId] = useState<string | null>(null);

  const porId = useMemo(() => new Map(tareas.map((t) => [t.id, t])), [tareas]);

  const idsReales = useMemo<IdsPorColumna>(
    () => ({
      pendiente: columnas.pendiente.map((t) => t.id),
      en_curso: columnas.en_curso.map((t) => t.id),
      hecha: columnas.hecha.map((t) => t.id),
    }),
    [columnas],
  );

  const ids = provisional ?? idsReales;

  // Un clic abre el detalle; hay que mover 6 px para que empiece un arrastre.
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const nombreDe = (id: UniqueIdentifier): string =>
    esEstado(id) ? `la columna ${ETIQUETA_ESTADO[id]}` : `la tarea «${porId.get(String(id))?.titulo ?? ''}»`;

  // Mensajes para lectores de pantalla durante el arrastre (en español).
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Has levantado ${nombreDe(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${nombreDe(active.id)} está sobre ${nombreDe(over.id)}.` : ''),
    onDragEnd: ({ active, over }) =>
      over ? `Has soltado ${nombreDe(active.id)} sobre ${nombreDe(over.id)}.` : `Has soltado ${nombreDe(active.id)} fuera.`,
    onDragCancel: ({ active }) => `Se ha cancelado el movimiento de ${nombreDe(active.id)}.`,
  };

  function alEmpezar({ active }: DragStartEvent) {
    setActivaId(String(active.id));
    setProvisional(idsReales);
  }

  // Al pasar por encima de otra columna, movemos la tarjeta a ella (solo en la copia local).
  function alPasarPor({ active, over }: DragOverEvent) {
    if (!over || !provisional) return;
    const origen = columnaDe(active.id, provisional);
    const destino = columnaDe(over.id, provisional);
    if (!origen || !destino || origen === destino) return;

    setProvisional((previo) => {
      if (!previo) return previo;
      const lista = previo[destino];
      let indice: number;
      if (esEstado(over.id)) {
        indice = lista.length; // sobre la columna vacía o su fondo: al final
      } else {
        const indiceOver = lista.indexOf(String(over.id));
        const debajo =
          active.rect.current.translated !== null &&
          active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
        indice = indiceOver + (debajo ? 1 : 0);
      }
      return {
        ...previo,
        [origen]: previo[origen].filter((id) => id !== String(active.id)),
        [destino]: [...lista.slice(0, indice), String(active.id), ...lista.slice(indice)],
      };
    });
  }

  function alSoltar({ active, over }: DragEndEvent) {
    const idActiva = String(active.id);
    let final = provisional;

    // Reordenar dentro de la misma columna.
    if (final && over) {
      const origen = columnaDe(active.id, final);
      const destino = columnaDe(over.id, final);
      if (origen && destino && origen === destino && !esEstado(over.id)) {
        const desde = final[origen].indexOf(idActiva);
        const hasta = final[destino].indexOf(String(over.id));
        if (desde !== -1 && hasta !== -1 && desde !== hasta) {
          final = { ...final, [origen]: arrayMove(final[origen], desde, hasta) };
        }
      }
    }

    if (final) persistir(idActiva, final);
    setProvisional(null);
    setActivaId(null);
  }

  function cancelar() {
    setProvisional(null);
    setActivaId(null);
  }

  /** Calcula el nuevo estado/orden de la tarjeta movida y lo guarda si cambió. */
  function persistir(idActiva: string, final: IdsPorColumna) {
    const tarea = porId.get(idActiva);
    const estado = columnaDe(idActiva, final);
    if (!tarea || !estado) return;

    const lista = final[estado];
    const posicion = lista.indexOf(idActiva);
    const mismoSitio = estado === tarea.estado && lista.join() === idsReales[estado].join();
    if (mismoSitio) return;

    const ordenDe = (id: string | undefined): number | undefined => (id ? porId.get(id)?.orden : undefined);
    const anterior = ordenDe(lista[posicion - 1]);
    const siguiente = ordenDe(lista[posicion + 1]);

    if (necesitaReindexar(anterior, siguiente)) {
      // Los vecinos están pegados: se reasignan órdenes limpios a toda la columna.
      // Se mueve primero de columna (si hace falta) y después se reordena.
      void mover(idActiva, estado, ordenEntre(anterior, siguiente)).then(() => reordenarColumna(lista));
      return;
    }
    void mover(idActiva, estado, ordenEntre(anterior, siguiente));
  }

  async function guardarDialogo(datos: DatosTarea): Promise<boolean> {
    if (!dialogo) return false;
    if (dialogo.tipo === 'nueva') return crear(datos);
    return actualizar(dialogo.id, datos);
  }

  const tareaEditada: Tarea | null = dialogo?.tipo === 'editar' ? (porId.get(dialogo.id) ?? null) : null;
  const tareaActiva = activaId ? porId.get(activaId) : undefined;

  if (cargando) {
    return (
      <p className="estado-carga" role="status">
        Cargando tus tareas…
      </p>
    );
  }

  return (
    <>
      {error && (
        <div className="aviso-error" role="alert">
          <span>{error}</span>
          <button type="button" className="boton-icono" aria-label="Descartar aviso" onClick={limpiarError}>
            ×
          </button>
        </div>
      )}

      <DndContext
        sensors={sensores}
        collisionDetection={closestCorners}
        onDragStart={alEmpezar}
        onDragOver={alPasarPor}
        onDragEnd={alSoltar}
        onDragCancel={cancelar}
        accessibility={{
          announcements: anuncios,
          screenReaderInstructions: {
            draggable:
              'Para mover una tarea, pulsa la barra espaciadora. Usa las flechas para cambiar su posición o de columna y vuelve a pulsar espacio para soltarla. Pulsa Escape para cancelar.',
          },
        }}
      >
        <div className="tablero">
          {ESTADOS.map((estado) => (
            <Columna
              key={estado}
              estado={estado}
              zona={zona}
              tareas={ids[estado].map((id) => porId.get(id)).filter((t): t is Tarea => Boolean(t))}
              onAbrir={(id) => setDialogo({ tipo: 'editar', id })}
              onNueva={(e) => setDialogo({ tipo: 'nueva', estado: e })}
            />
          ))}
        </div>

        <DragOverlay>{tareaActiva ? <TarjetaVisual tarea={tareaActiva} zona={zona} superpuesta /> : null}</DragOverlay>
      </DndContext>

      <BarraRapida onCrear={(titulo) => crear({ titulo })} />

      {dialogo?.tipo === 'nueva' && (
        <TareaDialogo
          tarea={null}
          estadoInicial={dialogo.estado}
          onGuardar={guardarDialogo}
          onCerrar={() => setDialogo(null)}
        />
      )}
      {dialogo?.tipo === 'editar' && tareaEditada && (
        <TareaDialogo
          key={tareaEditada.id}
          tarea={tareaEditada}
          onGuardar={guardarDialogo}
          onEliminar={() => eliminar(tareaEditada.id)}
          onCerrar={() => setDialogo(null)}
        />
      )}
    </>
  );
}
