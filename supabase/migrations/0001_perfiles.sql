-- Fase 1 · Migración 0001: perfiles de usuario
-- Un perfil por usuario de auth.users, con sus preferencias.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  nombre text,
  -- Zona horaria IANA (p. ej. 'Europe/Madrid'). Se usa para interpretar
  -- fechas relativas y programar recordatorios.
  zona_horaria text not null default 'UTC',
  idioma text not null default 'es',
  -- Ajustes de notificaciones (se usan en la Fase 3).
  resumen_diario_activo boolean not null default false,
  resumen_hora time not null default '08:00',
  hora_recordatorio_defecto time not null default '09:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil y preferencias de cada usuario.';

-- Función genérica para mantener updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Crea el perfil automáticamente cuando alguien se registra.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, nombre)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Seguridad a nivel de fila: cada usuario solo ve y edita su propio perfil.
alter table public.profiles enable row level security;

create policy "perfil_select_propio" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "perfil_update_propio" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No hay política de insert/delete: el perfil lo crea el trigger y se borra en cascada.
