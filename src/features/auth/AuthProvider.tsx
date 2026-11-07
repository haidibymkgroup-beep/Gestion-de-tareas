import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface ContextoAuth {
  sesion: Session | null;
  usuario: User | null;
  /** true mientras se comprueba si ya hay una sesión guardada. */
  cargando: boolean;
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Session | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    // Sesión inicial (también procesa el token del enlace mágico / OAuth en la URL).
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      setSesion(data.session);
      setCargando(false);
    });

    // Cambios posteriores: login, logout, refresco de token.
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => {
      if (!activo) return;
      setSesion(nueva);
      setCargando(false);
    });

    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const valor = useMemo<ContextoAuth>(
    () => ({
      sesion,
      usuario: sesion?.user ?? null,
      cargando,
      cerrarSesion: async () => {
        await supabase.auth.signOut();
      },
    }),
    [sesion, cargando],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useAuth(): ContextoAuth {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
