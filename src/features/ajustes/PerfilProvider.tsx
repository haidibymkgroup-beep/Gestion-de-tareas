import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import type { Perfil } from '../../lib/tipos';
import { zonaDelNavegador } from '../../lib/fechas';
import { useAuth } from '../auth/AuthProvider';

interface ContextoPerfil {
  perfil: Perfil | null;
  cargando: boolean;
  error: string | null;
  /** Zona horaria efectiva (la del perfil, o la del navegador mientras carga). */
  zona: string;
  actualizar: (cambios: Partial<Pick<Perfil, 'nombre' | 'zona_horaria'>>) => Promise<boolean>;
}

const Contexto = createContext<ContextoPerfil | null>(null);

export function PerfilProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = usuario?.id;

  useEffect(() => {
    if (!userId) {
      setPerfil(null);
      setCargando(false);
      return;
    }
    let activo = true;
    setCargando(true);

    (async () => {
      const { data, error: err } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!activo) return;
      if (err) {
        setError('No se pudo cargar tu perfil.');
        setCargando(false);
        return;
      }
      let actual = data as Perfil | null;

      // La primera vez, la zona del perfil es 'UTC' (valor por defecto de la base de
      // datos): la sustituimos por la del dispositivo para que "mañana a las 5" se
      // interprete bien desde el primer día.
      const navegador = zonaDelNavegador();
      if (actual && actual.zona_horaria === 'UTC' && navegador !== 'UTC') {
        const { data: nuevo } = await supabase
          .from('profiles')
          .update({ zona_horaria: navegador })
          .eq('id', userId)
          .select('*')
          .single();
        if (nuevo) actual = nuevo as Perfil;
      }
      if (!activo) return;
      setPerfil(actual);
      setCargando(false);
    })();

    return () => {
      activo = false;
    };
  }, [userId]);

  const actualizar = useCallback<ContextoPerfil['actualizar']>(
    async (cambios) => {
      if (!userId) return false;
      setError(null);
      const { data, error: err } = await supabase
        .from('profiles')
        .update(cambios)
        .eq('id', userId)
        .select('*')
        .single();
      if (err) {
        setError('No se pudieron guardar los cambios.');
        return false;
      }
      setPerfil(data as Perfil);
      return true;
    },
    [userId],
  );

  const valor = useMemo<ContextoPerfil>(
    () => ({
      perfil,
      cargando,
      error,
      zona: perfil?.zona_horaria ?? zonaDelNavegador(),
      actualizar,
    }),
    [perfil, cargando, error, actualizar],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePerfil(): ContextoPerfil {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('usePerfil debe usarse dentro de <PerfilProvider>');
  return ctx;
}
