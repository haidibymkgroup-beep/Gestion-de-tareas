// Utilidades de fecha/hora para mostrar tareas en la zona horaria del usuario.
//
// Las tareas guardan fecha ('YYYY-MM-DD') y hora ('HH:mm[:ss]') "locales", sin zona.
// Para saber si es hoy, mañana o está vencida comparamos contra la hora actual
// expresada en la zona horaria del perfil.

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Zona horaria del navegador (IANA). */
export function zonaDelNavegador(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

/** Comprueba que sea una zona IANA válida. */
export function zonaValida(zona: string): boolean {
  try {
    new Intl.DateTimeFormat('es', { timeZone: zona });
    return true;
  } catch {
    return false;
  }
}

/** Fecha y hora actuales en la zona dada: { fecha: 'YYYY-MM-DD', hora: 'HH:mm' }. */
export function ahoraEn(zona: string, ahora: Date = new Date()): { fecha: string; hora: string } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(ahora);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? '00';
  return {
    fecha: `${valor('year')}-${valor('month')}-${valor('day')}`,
    hora: `${valor('hour')}:${valor('minute')}`,
  };
}

/** Suma días a una fecha 'YYYY-MM-DD' (aritmética en UTC para evitar saltos de horario). */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/** Recorta 'HH:mm:ss' a 'HH:mm'. */
export function horaCorta(hora: string | null): string | null {
  return hora ? hora.slice(0, 5) : null;
}

/** Texto legible para la fecha/hora de una tarea: "Hoy 17:00", "Mañana", "vie 14 nov". */
export function etiquetaFecha(
  fecha: string | null,
  hora: string | null,
  zona: string,
  ahora: Date = new Date(),
): string | null {
  if (!fecha) return null;
  const hoy = ahoraEn(zona, ahora).fecha;
  let texto: string;
  if (fecha === hoy) texto = 'Hoy';
  else if (fecha === sumarDias(hoy, 1)) texto = 'Mañana';
  else if (fecha === sumarDias(hoy, -1)) texto = 'Ayer';
  else {
    const [a, m, d] = fecha.split('-').map(Number);
    const dia = DIAS_CORTOS[new Date(Date.UTC(a, m - 1, d)).getUTCDay()];
    texto = `${dia} ${d} ${MESES_CORTOS[m - 1]}`;
    if (a !== Number(hoy.slice(0, 4))) texto += ` ${a}`;
  }
  const h = horaCorta(hora);
  return h ? `${texto} ${h}` : texto;
}

/** true si la fecha/hora de la tarea ya pasó (una tarea sin hora vence al terminar el día). */
export function estaVencida(
  fecha: string | null,
  hora: string | null,
  zona: string,
  ahora: Date = new Date(),
): boolean {
  if (!fecha) return false;
  const actual = ahoraEn(zona, ahora);
  if (fecha < actual.fecha) return true;
  if (fecha > actual.fecha) return false;
  const h = horaCorta(hora);
  return h !== null && h < actual.hora;
}
