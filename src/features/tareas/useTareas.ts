import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { PASO, reindexar } from '../../lib/orden';
import type { DatosTarea, Estado, Tarea } from '../../lib/tipos';
import { agruparPorEstado, fusionar, insertarOActualizar, quitar, reemplazar } from './estado';

export type NuevaTarea = Partial<Omit<DatosTarea, 'titulo'>> & { titulo: string };

/**
 * Carga las tareas del usuario, las mantiene sincronizadas con Realtime
 * (otros dispositivos) y expone las operaciones CRUD con actualización optimista.
 */
export function useTareas(userId: string) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copia síncrona para leer el estado más reciente dentro de callbacks async.
  const ref = useRef<Tarea[]>([]);
  const guardar = useCallback((actualizador: (previo: Tarea[]) => Tarea[]) => {
    ref.current = actualizador(ref.current);
    setTareas(ref.current);
  }, []);

  useEffect(() => {
    let activo = true;
    ref.current = [];
    setTareas([]);
    setCargando(true);

    // 1) Nos suscribimos primero para no perder cambios mientras carga la lista.
    const canal = supabase
      .channel(`tasks:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (!activo) return;
          if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id?: string }).id;
            if (id) guardar((p) => quitar(p, id));
          } else {
            guardar((p) => insertarOActualizar(p, payload.new as Tarea));
          }
        },
      )
      .subscribe();

    // 2) Carga inicial.
    (async () => {
      const { data, error: err } = await supabase.from('tasks').select('*').order('orden');
      if (!activo) return;
      if (err) setError('No se pudieron cargar tus tareas. Comprueba tu conexión.');
      else guardar((p) => fusionar(p, data as Tarea[]));
      setCargando(false);
    })();

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [userId, guardar]);

  /** Orden que deja una tarea al final de la columna indicada. */
  const ordenAlFinal = useCallback((estado: Estado, ignorarId?: string): number => {
    const columna = ref.current.filter((t) => t.estado === estado && t.id !== ignorarId);
    if (columna.length === 0) return PASO;
    return Math.max(...columna.map((t) => t.orden)) + PASO;
  }, []);

  const crear = useCallback(
    async (datos: NuevaTarea): Promise<boolean> => {
      setError(null);
      const estado = datos.estado ?? 'pendiente';
      const { data, error: err } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          titulo: datos.titulo.trim(),
          descripcion: datos.descripcion ?? null,
          fecha: datos.fecha ?? null,
          hora: datos.fecha ? (datos.hora ?? null) : null,
          prioridad: datos.prioridad ?? 'media',
          estado,
          orden: ordenAlFinal(estado),
          origen: 'texto',
        })
        .select('*')
        .single();
      if (err || !data) {
        setError('No se pudo crear la tarea.');
        return false;
      }
      guardar((p) => insertarOActualizar(p, data as Tarea));
      return true;
    },
    [userId, ordenAlFinal, guardar],
  );

  /** Escribe cambios en una tarea con actualización optimista y vuelta atrás si falla. */
  const aplicar = useCallback(
    async (id: string, cambios: Partial<Tarea>, mensajeError: string): Promise<boolean> => {
      const anterior = ref.current.find((t) => t.id === id);
      if (!anterior) return false;
      setError(null);
      guardar((p) => reemplazar(p, { ...anterior, ...cambios }));
      const { error: err } = await supabase.from('tasks').update(cambios).eq('id', id);
      if (err) {
        guardar((p) => reemplazar(p, anterior));
        setError(mensajeError);
        return false;
      }
      return true;
    },
    [guardar],
  );

  const actualizar = useCallback(
    async (id: string, cambios: Partial<DatosTarea>): Promise<boolean> => {
      const actual = ref.current.find((t) => t.id === id);
      if (!actual) return false;
      const final: Partial<Tarea> = { ...cambios };
      if (cambios.titulo !== undefined) final.titulo = cambios.titulo.trim();
      // Sin fecha no puede haber hora (lo exige la base de datos).
      if (cambios.fecha === null) final.hora = null;
      // Si cambia de columna desde el formulario, va al final de la nueva.
      if (cambios.estado && cambios.estado !== actual.estado) {
        final.orden = ordenAlFinal(cambios.estado, id);
      }
      return aplicar(id, final, 'No se pudieron guardar los cambios.');
    },
    [aplicar, ordenAlFinal],
  );

  /** Mueve una tarea a una columna y posición (usado al arrastrar). */
  const mover = useCallback(
    (id: string, estado: Estado, orden: number) => aplicar(id, { estado, orden }, 'No se pudo mover la tarea.'),
    [aplicar],
  );

  /** Reasigna órdenes limpios a toda una columna cuando los vecinos están demasiado juntos. */
  const reordenarColumna = useCallback(
    async (idsEnOrden: string[]): Promise<boolean> => {
      const nuevos = reindexar(idsEnOrden.length);
      const resultados = await Promise.all(
        idsEnOrden.map((id, i) => aplicar(id, { orden: nuevos[i] }, 'No se pudo reordenar la columna.')),
      );
      return resultados.every(Boolean);
    },
    [aplicar],
  );

  const eliminar = useCallback(
    async (id: string): Promise<boolean> => {
      const anterior = ref.current.find((t) => t.id === id);
      if (!anterior) return false;
      setError(null);
      guardar((p) => quitar(p, id));
      const { error: err } = await supabase.from('tasks').delete().eq('id', id);
      if (err) {
        guardar((p) => reemplazar(p, anterior));
        setError('No se pudo eliminar la tarea.');
        return false;
      }
      return true;
    },
    [guardar],
  );

  const columnas = useMemo(() => agruparPorEstado(tareas), [tareas]);

  return {
    tareas,
    columnas,
    cargando,
    error,
    limpiarError: () => setError(null),
    crear,
    actualizar,
    mover,
    reordenarColumna,
    eliminar,
  };
}
