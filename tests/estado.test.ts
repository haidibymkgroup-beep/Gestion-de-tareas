import { describe, expect, it } from 'vitest';
import { agruparPorEstado, fusionar, insertarOActualizar, quitar, reemplazar } from '../src/features/tareas/estado';
import type { Tarea } from '../src/lib/tipos';

function tarea(parcial: Partial<Tarea> & { id: string }): Tarea {
  return {
    user_id: 'u1',
    titulo: `Tarea ${parcial.id}`,
    descripcion: null,
    fecha: null,
    hora: null,
    prioridad: 'media',
    estado: 'pendiente',
    orden: 0,
    origen: 'texto',
    capture_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    completed_at: null,
    ...parcial,
  };
}

describe('insertarOActualizar', () => {
  it('añade una tarea nueva', () => {
    expect(insertarOActualizar([], tarea({ id: 'a' }))).toHaveLength(1);
  });
  it('reemplaza una tarea existente más antigua', () => {
    const lista = [tarea({ id: 'a', titulo: 'viejo' })];
    const r = insertarOActualizar(lista, tarea({ id: 'a', titulo: 'nuevo', updated_at: '2025-02-01T00:00:00Z' }));
    expect(r).toHaveLength(1);
    expect(r[0].titulo).toBe('nuevo');
  });
  it('ignora una versión más antigua que la que ya tenemos', () => {
    const lista = [tarea({ id: 'a', titulo: 'reciente', updated_at: '2025-03-01T00:00:00Z' })];
    const r = insertarOActualizar(lista, tarea({ id: 'a', titulo: 'atrasado', updated_at: '2025-02-01T00:00:00Z' }));
    expect(r[0].titulo).toBe('reciente');
  });
  it('no modifica la lista original', () => {
    const lista = [tarea({ id: 'a' })];
    insertarOActualizar(lista, tarea({ id: 'b' }));
    expect(lista).toHaveLength(1);
  });
});

describe('reemplazar y quitar', () => {
  it('reemplazar fuerza la versión indicada aunque sea más antigua', () => {
    const lista = [tarea({ id: 'a', titulo: 'optimista', updated_at: '2025-03-01T00:00:00Z' })];
    const r = reemplazar(lista, tarea({ id: 'a', titulo: 'original', updated_at: '2025-01-01T00:00:00Z' }));
    expect(r[0].titulo).toBe('original');
  });
  it('reemplazar añade si no existe (deshacer un borrado)', () => {
    expect(reemplazar([], tarea({ id: 'a' }))).toHaveLength(1);
  });
  it('quitar elimina por id', () => {
    const r = quitar([tarea({ id: 'a' }), tarea({ id: 'b' })], 'a');
    expect(r.map((t) => t.id)).toEqual(['b']);
  });
});

describe('fusionar', () => {
  it('combina la carga inicial con cambios que ya llegaron por Realtime', () => {
    const enMemoria = [tarea({ id: 'a', titulo: 'de realtime', updated_at: '2025-05-01T00:00:00Z' })];
    const cargadas = [
      tarea({ id: 'a', titulo: 'de la carga', updated_at: '2025-04-01T00:00:00Z' }),
      tarea({ id: 'b' }),
    ];
    const r = fusionar(enMemoria, cargadas);
    expect(r).toHaveLength(2);
    expect(r.find((t) => t.id === 'a')?.titulo).toBe('de realtime');
  });
});

describe('agruparPorEstado', () => {
  it('separa por columna y ordena por `orden`', () => {
    const r = agruparPorEstado([
      tarea({ id: 'a', estado: 'pendiente', orden: 2048 }),
      tarea({ id: 'b', estado: 'pendiente', orden: 1024 }),
      tarea({ id: 'c', estado: 'hecha', orden: 1 }),
      tarea({ id: 'd', estado: 'en_curso', orden: 5 }),
    ]);
    expect(r.pendiente.map((t) => t.id)).toEqual(['b', 'a']);
    expect(r.en_curso.map((t) => t.id)).toEqual(['d']);
    expect(r.hecha.map((t) => t.id)).toEqual(['c']);
  });
  it('desempata por fecha de creación', () => {
    const r = agruparPorEstado([
      tarea({ id: 'tarde', orden: 1, created_at: '2025-01-02T00:00:00Z' }),
      tarea({ id: 'pronto', orden: 1, created_at: '2025-01-01T00:00:00Z' }),
    ]);
    expect(r.pendiente.map((t) => t.id)).toEqual(['pronto', 'tarde']);
  });
  it('devuelve las tres columnas aunque estén vacías', () => {
    expect(agruparPorEstado([])).toEqual({ pendiente: [], en_curso: [], hecha: [] });
  });
});
