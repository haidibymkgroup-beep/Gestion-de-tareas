import { describe, expect, it } from 'vitest';
import { PASO, necesitaReindexar, ordenEntre, reindexar } from '../src/lib/orden';

describe('ordenEntre', () => {
  it('devuelve 0 en una columna vacía', () => {
    expect(ordenEntre()).toBe(0);
  });
  it('coloca al principio restando un paso', () => {
    expect(ordenEntre(undefined, 1024)).toBe(1024 - PASO);
  });
  it('coloca al final sumando un paso', () => {
    expect(ordenEntre(2048, undefined)).toBe(2048 + PASO);
  });
  it('usa el punto medio entre dos vecinos', () => {
    expect(ordenEntre(1024, 2048)).toBe(1536);
  });
  it('mantiene el orden relativo tras muchas inserciones seguidas', () => {
    let a = 1024;
    const b = 2048;
    for (let i = 0; i < 20; i++) {
      const medio = ordenEntre(a, b);
      expect(medio).toBeGreaterThan(a);
      expect(medio).toBeLessThan(b);
      a = medio;
    }
  });
});

describe('necesitaReindexar', () => {
  it('es falso en los extremos', () => {
    expect(necesitaReindexar(undefined, 5)).toBe(false);
    expect(necesitaReindexar(5, undefined)).toBe(false);
  });
  it('es falso si hay espacio suficiente', () => {
    expect(necesitaReindexar(1, 2)).toBe(false);
  });
  it('es verdadero si los vecinos están pegados', () => {
    expect(necesitaReindexar(1, 1 + 1e-9)).toBe(true);
    expect(necesitaReindexar(3, 3)).toBe(true);
  });
});

describe('reindexar', () => {
  it('genera órdenes equiespaciados y crecientes', () => {
    expect(reindexar(3)).toEqual([PASO, 2 * PASO, 3 * PASO]);
  });
  it('devuelve lista vacía para 0', () => {
    expect(reindexar(0)).toEqual([]);
  });
});
