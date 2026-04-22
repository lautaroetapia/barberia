-- =====================================================
-- SCRIPT COMPLETO PARA SUPABASE - BARBERÍA (VERSIÓN CORREGIDA)
-- =====================================================

-- Extensión para generar UUIDs
create extension if not exists pgcrypto;

-- -----------------------------------------------------
-- 1. TABLAS
-- -----------------------------------------------------

-- Perfiles de usuario
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Barberías
create table if not exists barbershops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),
  name text not null,
  address text,
  phone text,
  logo_url text,
  verified boolean default false,
  business_hours jsonb,
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- Barberos
create table if not exists barbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  barbershop_id uuid references barbershops(id),
  specialty text,
  color_hex text,
  avatar_url text,
  status text default 'active',
  created_at timestamp with time zone default now()
);

-- Servicios
create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id),
  name text not null,
  description text,
  price numeric not null,
  duration_minutes integer not null,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Citas / Turnos
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id),
  client_id uuid references profiles(id),
  barber_id uuid references barbers(id),
  service_id uuid references services(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text default 'confirmed',
  notes text,
  cancelled_by uuid references profiles(id),
  cancelled_at timestamp with time zone
);

-- Favoritos: Barberos
create table if not exists favorite_barbers (
  user_id uuid references profiles(id),
  barber_id uuid references barbers(id),
  barber_name text,
  barber_role text,
  barber_branch text,
  barber_image text,
  shop_id uuid references barbershops(id),
  primary key (user_id, barber_id)
);

-- Favoritos: Barberías
create table if not exists favorite_shops (
  user_id uuid references profiles(id),
  shop_id uuid references barbershops(id),
  shop_name text,
  shop_address text,
  primary key (user_id, shop_id)
);

-- Notas de clientes
create table if not exists client_notes (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id),
  author_id uuid references profiles(id),
  client_id uuid references profiles(id),
  note text,
  created_at timestamp with time zone default now()
);

-- Pausas / Descansos de barbero
create table if not exists barber_breaks (
  id uuid primary key default gen_random_uuid(),
  barber_id uuid references barbers(id),
  barbershop_id uuid references barbershops(id),
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null
);

-- Invitaciones a barberos
create table if not exists barber_invitations (
  id uuid primary key default gen_random_uuid(),
  barbershop_id uuid references barbershops(id),
  manual_code text,
  expires_at timestamp with time zone,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Solicitudes para unirse a una barbería
create table if not exists join_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  barbershop_id uuid not null references barbershops(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (user_id, barbershop_id)
);

-- Preferencias de franjas horarias del dueño por fecha
create table if not exists owner_shift_preferences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  date_key text not null,
  morning_enabled boolean not null default false,
  afternoon_enabled boolean not null default false,
  night_enabled boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (owner_id, date_key)
);

-- -----------------------------------------------------
-- 2. AJUSTES DE COLUMNAS Y RESTRICCIONES
-- -----------------------------------------------------

-- Añadir columnas si no existen (seguridad adicional)
alter table if exists barber_invitations
  add column if not exists created_at timestamp with time zone default now();

alter table if exists join_requests
  add column if not exists created_at timestamp with time zone default now();

alter table if exists join_requests
  add column if not exists updated_at timestamp with time zone default now();

alter table if exists owner_shift_preferences
  add column if not exists created_at timestamp with time zone default now();

alter table if exists owner_shift_preferences
  add column if not exists updated_at timestamp with time zone default now();

alter table if exists profiles
  add column if not exists notifications_enabled boolean default false;

alter table if exists profiles
  add column if not exists push_token text;

-- Restricciones CHECK (solo si no existen)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'join_requests_status_check'
  ) then
    alter table join_requests
      add constraint join_requests_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'barber_invitations_status_check'
  ) then
    alter table barber_invitations
      add constraint barber_invitations_status_check
      check (status in ('pending', 'expired'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'appointments_status_check'
  ) then
    alter table appointments
      add constraint appointments_status_check
      check (status in ('pending', 'confirmed', 'completed', 'cancelled', 'no_show'));
  end if;
end;
$$;

-- -----------------------------------------------------
-- 3. ÍNDICES
-- -----------------------------------------------------

create index if not exists idx_appointments_barber on appointments(barber_id);
create index if not exists idx_appointments_client on appointments(client_id);
create index if not exists idx_appointments_barber_status_range
  on appointments(barber_id, status, start_time, end_time);
create index if not exists idx_appointments_client_status_end
  on appointments(client_id, status, end_time);
create index if not exists idx_services_barbershop on services(barbershop_id);
create index if not exists idx_barbers_barbershop on barbers(barbershop_id);
create index if not exists idx_join_requests_user on join_requests(user_id);
create index if not exists idx_join_requests_shop_status on join_requests(barbershop_id, status);
create index if not exists idx_join_requests_created_at on join_requests(created_at desc);
create unique index if not exists idx_join_requests_unique_user_shop
  on join_requests(user_id, barbershop_id);
create index if not exists idx_owner_shift_preferences_owner_date
  on owner_shift_preferences(owner_id, date_key);
create index if not exists idx_barber_invitations_shop_status_exp
  on barber_invitations(barbershop_id, status, expires_at);
create index if not exists idx_barber_invitations_code
  on barber_invitations(manual_code);

-- -----------------------------------------------------
-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------

alter table profiles enable row level security;
alter table barbershops enable row level security;
alter table barbers enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table favorite_barbers enable row level security;
alter table favorite_shops enable row level security;
alter table client_notes enable row level security;
alter table barber_breaks enable row level security;
alter table barber_invitations enable row level security;
alter table join_requests enable row level security;
alter table owner_shift_preferences enable row level security;

-- -----------------------------------------------------
-- 5. POLÍTICAS RLS (CON DROP PREVIO PARA EVITAR DUPLICADOS)
-- -----------------------------------------------------

-- 5.1 profiles
drop policy if exists "Public read profiles" on profiles;
create policy "Public read profiles" on profiles for select using (true);

drop policy if exists "User can update own profile" on profiles;
create policy "User can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 5.2 barbershops
drop policy if exists "Public read barbershops" on barbershops;
create policy "Public read barbershops" on barbershops for select using (true);

drop policy if exists "Allow owners to insert their barbershop" on barbershops;
create policy "Allow owners to insert their barbershop"
  on barbershops for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owner can update their barbershop" on barbershops;
create policy "Owner can update their barbershop"
  on barbershops for update
  using (auth.uid() = owner_id);

drop policy if exists "Owner can delete their barbershop" on barbershops;
create policy "Owner can delete their barbershop"
  on barbershops for delete
  using (auth.uid() = owner_id);

-- 5.3 barbers
drop policy if exists "Public read barbers" on barbers;
create policy "Public read barbers" on barbers for select using (true);

drop policy if exists "Owner can manage barbers" on barbers;
create policy "Owner can manage barbers"
  on barbers for all
  using (
    exists (
      select 1 from barbershops
      where id = barbers.barbershop_id
        and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from barbershops
      where id = barbers.barbershop_id
        and owner_id = auth.uid()
    )
  );

-- 5.4 services
drop policy if exists "Public read services" on services;
create policy "Public read services" on services for select using (true);

drop policy if exists "Owner can manage services" on services;
create policy "Owner can manage services"
  on services for all
  using (
    exists (
      select 1 from barbershops
      where id = services.barbershop_id
        and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from barbershops
      where id = services.barbershop_id
        and owner_id = auth.uid()
    )
  );

-- 5.5 appointments
drop policy if exists "Only owner or client can read" on appointments;
create policy "Only owner or client can read" on appointments
  for select using (
    auth.uid() = client_id or
    auth.uid() = (select owner_id from barbershops where id = barbershop_id)
  );

drop policy if exists "Client can create appointment" on appointments;
create policy "Client can create appointment"
  on appointments for insert
  with check (auth.uid() = client_id);

drop policy if exists "Owner can create appointment" on appointments;
create policy "Owner can create appointment"
  on appointments for insert
  with check (
    auth.uid() = (select owner_id from barbershops where id = barbershop_id)
  );

drop policy if exists "Client can update own appointment" on appointments;
create policy "Client can update own appointment"
  on appointments for update
  using (auth.uid() = client_id);

drop policy if exists "Owner can update appointments" on appointments;
create policy "Owner can update appointments"
  on appointments for update
  using (
    auth.uid() = (select owner_id from barbershops where id = barbershop_id)
  );

drop policy if exists "Owner can delete appointments" on appointments;
create policy "Owner can delete appointments"
  on appointments for delete
  using (
    auth.uid() = (select owner_id from barbershops where id = barbershop_id)
  );

-- 5.6 favorite_barbers
drop policy if exists "Users can manage their favorite barbers" on favorite_barbers;
create policy "Users can manage their favorite barbers"
  on favorite_barbers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5.7 favorite_shops
drop policy if exists "Users can manage their favorite shops" on favorite_shops;
create policy "Users can manage their favorite shops"
  on favorite_shops for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5.8 client_notes
drop policy if exists "Owner can manage all notes" on client_notes;
create policy "Owner can manage all notes"
  on client_notes for all
  using (
    exists (
      select 1 from barbershops
      where id = client_notes.barbershop_id
        and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from barbershops
      where id = client_notes.barbershop_id
        and owner_id = auth.uid()
    )
  );

drop policy if exists "Barber can manage own notes" on client_notes;
create policy "Barber can manage own notes"
  on client_notes for all
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

-- 5.9 barber_breaks
drop policy if exists "Owner can manage all breaks" on barber_breaks;
create policy "Owner can manage all breaks"
  on barber_breaks for all
  using (
    exists (
      select 1 from barbershops
      where id = barber_breaks.barbershop_id
        and owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from barbershops
      where id = barber_breaks.barbershop_id
        and owner_id = auth.uid()
    )
  );

drop policy if exists "Barber can manage own breaks" on barber_breaks;
create policy "Barber can manage own breaks"
  on barber_breaks for all
  using (
    auth.uid() = (select user_id from barbers where id = barber_id)
  )
  with check (
    auth.uid() = (select user_id from barbers where id = barber_id)
  );

-- 5.10 barber_invitations
drop policy if exists "Public read valid invitations" on barber_invitations;
create policy "Public read valid invitations"
  on barber_invitations for select
  using (status = 'pending' and expires_at > now());

drop policy if exists "Owner manages invitations" on barber_invitations;
create policy "Owner manages invitations"
  on barber_invitations for all
  to authenticated
  using (
    exists (
      select 1 from barbershops b
      where b.id = barber_invitations.barbershop_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from barbershops b
      where b.id = barber_invitations.barbershop_id
        and b.owner_id = auth.uid()
    )
  );

-- 5.11 join_requests
drop policy if exists "Requester can create join request" on join_requests;
create policy "Requester can create join request"
  on join_requests for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "Requester can read own join requests" on join_requests;
create policy "Requester can read own join requests"
  on join_requests for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Owner can read shop join requests" on join_requests;
create policy "Owner can read shop join requests"
  on join_requests for select
  to authenticated
  using (
    exists (
      select 1 from barbershops b
      where b.id = join_requests.barbershop_id
        and b.owner_id = auth.uid()
    )
  );

drop policy if exists "Owner can update shop join requests" on join_requests;
create policy "Owner can update shop join requests"
  on join_requests for update
  to authenticated
  using (
    exists (
      select 1 from barbershops b
      where b.id = join_requests.barbershop_id
        and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from barbershops b
      where b.id = join_requests.barbershop_id
        and b.owner_id = auth.uid()
    )
  );

-- 5.12 owner_shift_preferences
drop policy if exists "Owner can read own shift preferences" on owner_shift_preferences;
create policy "Owner can read own shift preferences"
  on owner_shift_preferences for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Owner can insert own shift preferences" on owner_shift_preferences;
create policy "Owner can insert own shift preferences"
  on owner_shift_preferences for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Owner can update own shift preferences" on owner_shift_preferences;
create policy "Owner can update own shift preferences"
  on owner_shift_preferences for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owner can delete own shift preferences" on owner_shift_preferences;
create policy "Owner can delete own shift preferences"
  on owner_shift_preferences for delete
  to authenticated
  using (auth.uid() = owner_id);

-- 5.13 storage.objects (bucket avatars)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read avatars" on storage.objects;
create policy "Public can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Authenticated can upload own avatar" on storage.objects;
create policy "Authenticated can upload own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Authenticated can update own avatar" on storage.objects;
create policy "Authenticated can update own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Authenticated can delete own avatar" on storage.objects;
create policy "Authenticated can delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 5.14 appointment guardrails (race-condition + reglas de negocio)
create or replace function public.guard_appointments()
returns trigger
language plpgsql
as $$
declare
  duration_minutes integer;
begin
  if new.end_time <= new.start_time then
    raise exception 'La hora de fin debe ser mayor que la de inicio.';
  end if;

  if (extract(epoch from new.start_time)::bigint / 60) % 30 <> 0 then
    raise exception 'La cita debe iniciar en bloques de 30 minutos.';
  end if;

  duration_minutes := floor(extract(epoch from (new.end_time - new.start_time)) / 60);

  if duration_minutes < 30 or duration_minutes % 30 <> 0 then
    raise exception 'La duración del turno debe ser en múltiplos de 30 minutos.';
  end if;

  if new.status in ('pending', 'confirmed') and new.start_time <= now() then
    raise exception 'No se puede reservar en fecha u hora pasada.';
  end if;

  if new.status in ('pending', 'confirmed') and new.client_id is not null then
    if exists (
      select 1
      from appointments a
      where a.client_id = new.client_id
        and a.status in ('pending', 'confirmed')
        and a.start_time > now()
        and (tg_op = 'INSERT' or a.id <> new.id)
    ) then
      raise exception 'El cliente ya tiene un turno activo. Solo puede tener uno a la vez.';
    end if;
  end if;

  if new.status in ('pending', 'confirmed') and new.barber_id is not null then
    perform pg_advisory_xact_lock(hashtext(new.barber_id::text));

    if exists (
      select 1
      from appointments a
      where a.barber_id = new.barber_id
        and a.status in ('pending', 'confirmed')
        and tstzrange(a.start_time, a.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
        and (tg_op = 'INSERT' or a.id <> new.id)
    ) then
      raise exception 'Este horario ya fue tomado por otro cliente.';
    end if;

    if exists (
      select 1
      from barber_breaks b
      where b.barber_id = new.barber_id
        and tstzrange(b.start_time, b.end_time, '[)') && tstzrange(new.start_time, new.end_time, '[)')
    ) then
      raise exception 'No hay bloques continuos disponibles para esta duración.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_appointments on appointments;
create trigger trg_guard_appointments
  before insert or update on appointments
  for each row
  execute function public.guard_appointments();

-- -----------------------------------------------------
-- 6. TRIGGER PARA CREAR PERFIL AUTOMÁTICO AL REGISTRAR USUARIO
-- -----------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', 'Usuario'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- Eliminar trigger antiguo si existe y recrearlo
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------
-- (OPCIONAL) Reparar usuarios existentes sin perfil
-- Descomenta y ejecuta solo si tienes usuarios previos sin perfil
-- -----------------------------------------------------
/*
insert into public.profiles (id, full_name, avatar_url)
select 
  id,
  coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', email),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================