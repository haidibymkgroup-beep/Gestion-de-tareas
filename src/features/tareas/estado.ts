// Funciones puras para manipular la lista de tareas en memoria.
// Se separan del hook para poder probarlas sin Supabase.

import { ESTADOS, type Estado, type Tarea } from '../../lib/tipos';

/** Inserta o reemplaza una tarea, sin pisar una versión más reciente que ya tengamos. */
export function insertarOActualizar(lista: Tarea[], nueva: Tarea): Tarea[] {
  const indice = lista.findIndex((t) => t.id === nueva.id);
  if (indice === -1) return [...lista, nueva];
  const actual = lista[indice];
  if (actual.updated_at > nueva.updated_at) return lista; // ya tenemos algo más nuevo
  const copia = lista.slice();
  copia[indice] = nueva;
  return copia;
}

/** Como insertarOActualizar pero sin comparar fechas (para deshacer cambios optimistas). */
export function reemplazar(lista: Tarea[], tarea: Tarea): Tarea[] {
  const existe = lista.some((t) => t.id === tarea.id);
  return existe ? lista.map((t) => (t.id === tarea.id ? tarea : t)) : [...lista, tarea];
}

export function quitar(lista: Tarea[], id: string): Tarea[] {
  return lista.filter((t) => t.id !== id);
}

/** Fusiona el resultado de la carga inicial con los cambios que ya llegaron por Realtime. */
export function fusionar(actual: Tarea[], cargadas: Tarea[]): Tarea[] {
  return cargadas.reduce((acc, t) => insertarOActualizar(acc, t), actual);
}

/** Agrupa por estado y ordena cada columna por `orden` (y por fecha de creación si empatan). */
export function agruparPorEstado(lista: Tarea[]): Record<Estado, Tarea[]> {
  const grupos: Record<Estado, Tarea[]> = { pendiente: [], en_curso: [], hecha: [] };
  for (const t of lista) grupos[t.estado].push(t);
  for (const e of ESTADOS) {
    grupos[e].sort((a, b) => a.orden - b.orden || a.created_at.localeCompare(b.created_at));
  }
  return grupos;
}
