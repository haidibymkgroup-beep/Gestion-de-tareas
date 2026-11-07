// Orden fraccionario para el tablero Kanban.
//
// Cada tarea tiene un número `orden`; dentro de una columna se muestran de menor
// a mayor. Para colocar una tarjeta entre otras dos se usa el punto medio, de modo
// que solo se actualiza UNA fila al arrastrar (no toda la columna).

/** Separación entre tarjetas al añadir al principio o al final. */
export const PASO = 1024;

/** Si dos vecinos están más cerca que esto, hay que reindexar la columna. */
export const SEPARACION_MINIMA = 1e-6;

/**
 * Calcula el `orden` para una tarjeta que se coloca entre `anterior` y `siguiente`.
 * Cualquiera de los dos puede ser undefined (extremo de la columna).
 */
export function ordenEntre(anterior?: number, siguiente?: number): number {
  if (anterior === undefined && siguiente === undefined) return 0;
  if (anterior === undefined) return (siguiente as number) - PASO;
  if (siguiente === undefined) return anterior + PASO;
  return (anterior + siguiente) / 2;
}

/** true si no queda espacio numérico fiable entre los dos vecinos. */
export function necesitaReindexar(anterior?: number, siguiente?: number): boolean {
  if (anterior === undefined || siguiente === undefined) return false;
  return Math.abs(siguiente - anterior) < SEPARACION_MINIMA;
}

/** Devuelve órdenes limpios y equiespaciados: PASO, 2·PASO, 3·PASO... */
export function reindexar(cantidad: number): number[] {
  return Array.from({ length: cantidad }, (_, i) => (i + 1) * PASO);
}
