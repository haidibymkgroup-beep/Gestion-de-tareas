// Tipos del dominio. Reflejan las tablas de supabase/migrations.

export type Estado = 'pendiente' | 'en_curso' | 'hecha';
export type Prioridad = 'alta' | 'media' | 'baja';
export type Origen = 'voz' | 'texto';

export const ESTADOS: readonly Estado[] = ['pendiente', 'en_curso', 'hecha'];
export const PRIORIDADES: readonly Prioridad[] = ['alta', 'media', 'baja'];

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  pendiente: 'Pendiente',
  en_curso: 'En curso',
  hecha: 'Hecha',
};

export const ETIQUETA_PRIORIDAD: Record<Prioridad, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};

export interface Tarea {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string | null;
  /** Fecha local 'YYYY-MM-DD' (sin zona). */
  fecha: string | null;
  /** Hora local 'HH:mm:ss' (sin zona). */
  hora: string | null;
  prioridad: Prioridad;
  estado: Estado;
  orden: number;
  origen: Origen;
  capture_id: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

/** Campos que el usuario puede editar en una tarea. */
export interface DatosTarea {
  titulo: string;
  descripcion: string | null;
  fecha: string | null;
  hora: string | null;
  prioridad: Prioridad;
  estado: Estado;
}

export interface Perfil {
  id: string;
  email: string | null;
  nombre: string | null;
  zona_horaria: string;
  idioma: string;
  resumen_diario_activo: boolean;
  resumen_hora: string;
  hora_recordatorio_defecto: string;
}
