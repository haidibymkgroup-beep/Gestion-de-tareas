import { describe, expect, it } from 'vitest';
import { ahoraEn, estaVencida, etiquetaFecha, horaCorta, sumarDias, zonaValida } from '../src/lib/fechas';

// 2025-03-14 (viernes) 23:30 UTC.
//  - En Madrid (UTC+1, aún horario de invierno) ya es sábado 15 a las 00:30.
//  - En Ciudad de México (UTC-6) sigue siendo viernes 14 a las 17:30.
const AHORA = new Date('2025-03-14T23:30:00Z');

describe('ahoraEn', () => {
  it('convierte a la zona del usuario, incluso cambiando de día', () => {
    expect(ahoraEn('Europe/Madrid', AHORA)).toEqual({ fecha: '2025-03-15', hora: '00:30' });
    expect(ahoraEn('America/Mexico_City', AHORA)).toEqual({ fecha: '2025-03-14', hora: '17:30' });
    expect(ahoraEn('UTC', AHORA)).toEqual({ fecha: '2025-03-14', hora: '23:30' });
  });
  it('no devuelve "24:00" a medianoche', () => {
    const medianoche = new Date('2025-03-15T00:00:00Z');
    expect(ahoraEn('UTC', medianoche).hora).toBe('00:00');
  });
});

describe('sumarDias', () => {
  it('suma y resta días', () => {
    expect(sumarDias('2025-03-14', 1)).toBe('2025-03-15');
    expect(sumarDias('2025-03-14', -1)).toBe('2025-03-13');
  });
  it('cruza fin de mes y de año', () => {
    expect(sumarDias('2025-12-31', 1)).toBe('2026-01-01');
    expect(sumarDias('2025-03-01', -1)).toBe('2025-02-28');
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29'); // año bisiesto
  });
  it('no se ve afectada por el cambio de hora', () => {
    expect(sumarDias('2025-03-29', 1)).toBe('2025-03-30'); // cambio a horario de verano en Europa
    expect(sumarDias('2025-03-30', 1)).toBe('2025-03-31');
  });
});

describe('horaCorta', () => {
  it('recorta los segundos', () => {
    expect(horaCorta('17:05:00')).toBe('17:05');
    expect(horaCorta(null)).toBeNull();
  });
});

describe('etiquetaFecha', () => {
  it('usa Hoy / Mañana / Ayer según la zona del usuario', () => {
    expect(etiquetaFecha('2025-03-14', null, 'America/Mexico_City', AHORA)).toBe('Hoy');
    expect(etiquetaFecha('2025-03-15', null, 'America/Mexico_City', AHORA)).toBe('Mañana');
    expect(etiquetaFecha('2025-03-13', null, 'America/Mexico_City', AHORA)).toBe('Ayer');
    // Misma fecha pero en Madrid ya es "hoy" el 15.
    expect(etiquetaFecha('2025-03-15', null, 'Europe/Madrid', AHORA)).toBe('Hoy');
  });
  it('añade la hora cuando existe', () => {
    expect(etiquetaFecha('2025-03-15', '17:00:00', 'America/Mexico_City', AHORA)).toBe('Mañana 17:00');
  });
  it('muestra día de la semana y mes para otras fechas', () => {
    expect(etiquetaFecha('2025-03-21', null, 'UTC', AHORA)).toBe('vie 21 mar');
  });
  it('añade el año si es distinto al actual', () => {
    expect(etiquetaFecha('2026-01-02', null, 'UTC', AHORA)).toBe('vie 2 ene 2026');
  });
  it('devuelve null sin fecha', () => {
    expect(etiquetaFecha(null, null, 'UTC', AHORA)).toBeNull();
  });
});

describe('estaVencida', () => {
  it('es falsa sin fecha', () => {
    expect(estaVencida(null, null, 'UTC', AHORA)).toBe(false);
  });
  it('es verdadera para días pasados y falsa para futuros', () => {
    expect(estaVencida('2025-03-13', null, 'UTC', AHORA)).toBe(true);
    expect(estaVencida('2025-03-15', '08:00', 'UTC', AHORA)).toBe(false);
  });
  it('una tarea de hoy sin hora no vence hasta que termina el día', () => {
    expect(estaVencida('2025-03-14', null, 'UTC', AHORA)).toBe(false);
  });
  it('una tarea de hoy con hora vence al pasar esa hora', () => {
    expect(estaVencida('2025-03-14', '23:00:00', 'UTC', AHORA)).toBe(true);
    expect(estaVencida('2025-03-14', '23:45', 'UTC', AHORA)).toBe(false);
  });
  it('depende de la zona horaria', () => {
    // Para Madrid el 14 ya terminó; para México todavía no.
    expect(estaVencida('2025-03-14', null, 'Europe/Madrid', AHORA)).toBe(true);
    expect(estaVencida('2025-03-14', null, 'America/Mexico_City', AHORA)).toBe(false);
  });
});

describe('zonaValida', () => {
  it('acepta zonas IANA y rechaza el resto', () => {
    expect(zonaValida('Europe/Madrid')).toBe(true);
    expect(zonaValida('Marte/Olympus')).toBe(false);
    expect(zonaValida('')).toBe(false);
  });
});
