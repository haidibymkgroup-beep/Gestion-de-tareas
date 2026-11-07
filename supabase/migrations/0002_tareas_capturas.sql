-- Fase 1 · Migración 0002: capturas y tareas
-- "captures" guarda cada entrada del usuario (audio o texto) y lo que devolvió la IA.
-- Se usa a partir de la Fase 2, pero se crea ahora para que tasks.capture_id sea una FK real.

create type public.tipo_captura as enum ('audio', 'texto');
create type public.estado_proceso as enum ('pendiente', 'procesando', 'completado', 'error');
create type public.prioridad as enum ('alta', 'media', 'baja');
create type public.estado_tarea as enum ('pendiente', 'en_curso', 'hecha');
create type public.origen_tarea as enum ('voz', 'texto');

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tipo public.tipo_captura not null,
  audio_url text,
  transcripcion text,
  resultado_ia jsonb,
  estado_proceso public.estado_proceso not null default 'pendiente',
  duracion integer check (duracion is null or duracion between 0 and 120), -- segundos
  created_at timestamptz not null default now()
);

create index captures_user_created_idx on public.captures (user_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null check (char_length(btrim(titulo)) between 1 and 200),
  descripcion text check (descripcion is null or char_length(descripcion) <= 2000),
  fecha date,
  hora time,
  prioridad public.prioridad not null default 'media',
  estado public.estado_tarea not null default 'pendiente',
  -- Posición dentro de su columna. Es un número decimal para poder insertar
  -- entre dos tarjetas sin reescribir toda la columna (ver src/lib/orden.ts).
  orden double precision not null default 0,
  origen public.origen_tarea not null default 'texto',
  capture_id uuid references public.captures (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Una hora sin fecha no tiene sentido.
  constraint hora_requiere_fecha check (hora is null or fecha is not null)
);

create index tasks_user_estado_orden_idx on public.tasks (user_id, estado, orden);
create index tasks_user_fecha_idx on public.tasks (user_id, fecha) where fecha is not null;

-- Mantiene updated_at y completed_at de forma coherente con el estado.
create or replace function public.tasks_before_write()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.estado = 'hecha' then
    if tg_op = 'INSERT' or old.estado is distinct from 'hecha' then
      new.completed_at = now();
    end if;
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

-- RLS: cada usuario solo accede a lo suyo.
alter table public.captures enable row level security;
alter table public.tasks enable row level security;

create policy "captures_select_propias" on public.captures
  for select to authenticated using (user_id = (select auth.uid()));
create policy "captures_insert_propias" on public.captures
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "captures_update_propias" on public.captures
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "captures_delete_propias" on public.captures
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "tasks_select_propias" on public.tasks
  for select to authenticated using (user_id = (select auth.uid()));
create policy "tasks_insert_propias" on public.tasks
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "tasks_update_propias" on public.tasks
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "tasks_delete_propias" on public.tasks
  for delete to authenticated using (user_id = (select auth.uid()));

-- Realtime: sincronización entre dispositivos.
-- REPLICA IDENTITY FULL hace que los eventos DELETE incluyan user_id y se puedan filtrar.
alter table public.tasks replica identity full;
alter publication supabase_realtime add table public.tasks;
