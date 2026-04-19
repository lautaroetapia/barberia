-- =============================================================================
-- NAVaja Dorada - Esquema completo para Supabase (Corregido)
-- =============================================================================
-- Versión con orden de creación optimizado para evitar errores de dependencia.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONES NECESARIAS
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Nota de alineación frontend v1.3.0:
-- El cliente actualmente usa persistencia local scopeada por usuario para módulos
-- internos (barbería/barberos/invitaciones) mientras avanza la migración total a BD.
-- Este script mantiene el esquema objetivo en Supabase para esa transición.

-- -----------------------------------------------------------------------------
-- FUNCIÓN AUXILIAR: actualizar automáticamente updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- CREACIÓN DE TODAS LAS TABLAS PRIMERO (sin políticas RLS todavía)
-- -----------------------------------------------------------------------------

-- 1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. barbershops
CREATE TABLE IF NOT EXISTS public.barbershops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    logo_url TEXT,
    business_hours JSONB DEFAULT '{"monday":{"open":"09:00","close":"18:00"},"tuesday":{"open":"09:00","close":"18:00"},"wednesday":{"open":"09:00","close":"18:00"},"thursday":{"open":"09:00","close":"18:00"},"friday":{"open":"09:00","close":"18:00"},"saturday":{"open":"10:00","close":"14:00"},"sunday":null}'::JSONB,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'deleted')),
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. services
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. barbers
CREATE TABLE IF NOT EXISTS public.barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    specialty TEXT,
    color_hex TEXT DEFAULT '#D4AF37',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(barbershop_id, user_id)
);

-- 5. barber_invitations
CREATE TABLE IF NOT EXISTS public.barber_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    manual_code TEXT UNIQUE NOT NULL DEFAULT substring(encode(gen_random_bytes(3), 'hex') from 1 for 6),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. join_requests
CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(barbershop_id, user_id)
);

-- 7. appointments
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_end_after_start CHECK (end_time > start_time)
);

-- 8. time_slots_lock
CREATE TABLE IF NOT EXISTS public.time_slots_lock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
    slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
    locked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    UNIQUE(barber_id, slot_start)
);

-- 9. penalties
CREATE TABLE IF NOT EXISTS public.penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    reason TEXT NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 10. client_warnings
CREATE TABLE IF NOT EXISTS public.client_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    no_show_count INTEGER DEFAULT 0,
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(client_id, barbershop_id)
);

-- 11. barber_availability_exceptions
CREATE TABLE IF NOT EXISTS public.barber_availability_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- 12. barber_breaks
CREATE TABLE IF NOT EXISTS public.barber_breaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_break_times CHECK (end_time > start_time)
);

-- 13. client_notes
CREATE TABLE IF NOT EXISTS public.client_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. absence_requests
CREATE TABLE IF NOT EXISTS public.absence_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    CONSTRAINT check_absence_dates CHECK (end_date >= start_date)
);

-- 15. favorite_shops
CREATE TABLE IF NOT EXISTS public.favorite_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    shop_address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, shop_id)
);

-- 16. favorite_barbers
CREATE TABLE IF NOT EXISTS public.favorite_barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barber_id TEXT NOT NULL,
    barber_name TEXT NOT NULL,
    barber_role TEXT NOT NULL,
    barber_branch TEXT NOT NULL,
    barber_image TEXT NOT NULL,
    shop_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, barber_id)
);

-- 17. owner_policies
CREATE TABLE IF NOT EXISTS public.owner_policies (
    owner_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    free_cancellation_hours INTEGER NOT NULL DEFAULT 2,
    no_show_penalty_percent INTEGER NOT NULL DEFAULT 20,
    auto_confirm_appointments BOOLEAN NOT NULL DEFAULT FALSE,
    allow_night_bookings BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 18. owner_shift_preferences
CREATE TABLE IF NOT EXISTS public.owner_shift_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date_key TEXT NOT NULL,
    morning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    afternoon_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    night_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(owner_id, date_key)
);

-- -----------------------------------------------------------------------------
-- AHORA HABILITAMOS RLS Y CREAMOS LAS POLÍTICAS (Todas las tablas ya existen)
-- -----------------------------------------------------------------------------

-- Limpieza idempotente de políticas para permitir re-ejecutar el script
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Owner full access" ON public.barbershops;
DROP POLICY IF EXISTS "Barbers can view their shop" ON public.barbershops;
DROP POLICY IF EXISTS "Clients can view active barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Owner manages services" ON public.services;
DROP POLICY IF EXISTS "Barbers can view services" ON public.services;
DROP POLICY IF EXISTS "Clients can view active services" ON public.services;
DROP POLICY IF EXISTS "Owner manages barbers" ON public.barbers;
DROP POLICY IF EXISTS "Barber can view own profile" ON public.barbers;
DROP POLICY IF EXISTS "Barber can update own profile" ON public.barbers;
DROP POLICY IF EXISTS "Clients can view active barbers" ON public.barbers;
DROP POLICY IF EXISTS "Owner manages invitations" ON public.barber_invitations;
DROP POLICY IF EXISTS "Authenticated can view active invitation candidates" ON public.barber_invitations;
DROP POLICY IF EXISTS "Owner manages join requests" ON public.join_requests;
DROP POLICY IF EXISTS "Barber can create join request" ON public.join_requests;
DROP POLICY IF EXISTS "Barber can view own requests" ON public.join_requests;
DROP POLICY IF EXISTS "Owner manages appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barber sees own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barber can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Client sees own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Client can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Client can cancel own appointments" ON public.appointments;
DROP POLICY IF EXISTS "User can create lock" ON public.time_slots_lock;
DROP POLICY IF EXISTS "User can manage own locks" ON public.time_slots_lock;
DROP POLICY IF EXISTS "Shop staff can view locks" ON public.time_slots_lock;
DROP POLICY IF EXISTS "Owner sees shop penalties" ON public.penalties;
DROP POLICY IF EXISTS "Client sees own penalties" ON public.penalties;
DROP POLICY IF EXISTS "Owner can insert penalties" ON public.penalties;
DROP POLICY IF EXISTS "Owner manages warnings" ON public.client_warnings;
DROP POLICY IF EXISTS "Client sees own warnings" ON public.client_warnings;
DROP POLICY IF EXISTS "Owner manages exceptions" ON public.barber_availability_exceptions;
DROP POLICY IF EXISTS "Barber sees own exceptions" ON public.barber_availability_exceptions;
DROP POLICY IF EXISTS "Barber manages own breaks" ON public.barber_breaks;
DROP POLICY IF EXISTS "Owner sees shop breaks" ON public.barber_breaks;
DROP POLICY IF EXISTS "Staff can manage notes" ON public.client_notes;
DROP POLICY IF EXISTS "Barber manages own requests" ON public.absence_requests;
DROP POLICY IF EXISTS "Owner manages absence requests" ON public.absence_requests;
DROP POLICY IF EXISTS "User manages own favorite shops" ON public.favorite_shops;
DROP POLICY IF EXISTS "User manages own favorite barbers" ON public.favorite_barbers;
DROP POLICY IF EXISTS "Owner manages own policies" ON public.owner_policies;
DROP POLICY IF EXISTS "Owner manages own shift preferences" ON public.owner_shift_preferences;

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Enable insert for authenticated users only" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- barbershops
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner full access" ON public.barbershops USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Barbers can view their shop" ON public.barbershops FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.barbershop_id = barbershops.id AND barbers.user_id = auth.uid() AND barbers.status = 'active')
);
CREATE POLICY "Clients can view active barbershops" ON public.barbershops FOR SELECT USING (status = 'active');

-- services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages services" ON public.services USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = services.barbershop_id AND barbershops.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = services.barbershop_id AND barbershops.owner_id = auth.uid())
);
CREATE POLICY "Barbers can view services" ON public.services FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.barbershop_id = services.barbershop_id AND barbers.user_id = auth.uid() AND barbers.status = 'active')
);
CREATE POLICY "Clients can view active services" ON public.services FOR SELECT USING (
    is_active = TRUE AND EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = services.barbershop_id AND barbershops.status = 'active')
);

-- barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages barbers" ON public.barbers USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = barbers.barbershop_id AND barbershops.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = barbers.barbershop_id AND barbershops.owner_id = auth.uid())
);
CREATE POLICY "Barber can view own profile" ON public.barbers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Barber can update own profile" ON public.barbers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Clients can view active barbers" ON public.barbers FOR SELECT USING (
    status = 'active' AND EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = barbers.barbershop_id AND barbershops.status = 'active')
);

-- barber_invitations
ALTER TABLE public.barber_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages invitations" ON public.barber_invitations USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = barber_invitations.barbershop_id AND barbershops.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = barber_invitations.barbershop_id AND barbershops.owner_id = auth.uid())
);
CREATE POLICY "Authenticated can view active invitation candidates" ON public.barber_invitations FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND status = 'pending'
    AND expires_at > NOW()
);

-- join_requests
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages join requests" ON public.join_requests USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = join_requests.barbershop_id AND barbershops.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = join_requests.barbershop_id AND barbershops.owner_id = auth.uid())
);
CREATE POLICY "Barber can create join request" ON public.join_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Barber can view own requests" ON public.join_requests FOR SELECT USING (user_id = auth.uid());

-- appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages appointments" ON public.appointments USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = appointments.barbershop_id AND barbershops.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = appointments.barbershop_id AND barbershops.owner_id = auth.uid())
);
CREATE POLICY "Barber sees own appointments" ON public.appointments FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = appointments.barber_id AND barbers.user_id = auth.uid() AND barbers.status = 'active')
);
CREATE POLICY "Barber can update own appointments" ON public.appointments FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = appointments.barber_id AND barbers.user_id = auth.uid() AND barbers.status = 'active')
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = appointments.barber_id AND barbers.user_id = auth.uid() AND barbers.status = 'active')
);
CREATE POLICY "Client sees own appointments" ON public.appointments FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Client can create appointments" ON public.appointments FOR INSERT WITH CHECK (
    client_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = appointments.barbershop_id AND barbershops.status = 'active')
    AND EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = appointments.barber_id AND barbers.status = 'active')
    AND EXISTS (SELECT 1 FROM public.services WHERE services.id = appointments.service_id AND services.is_active = TRUE)
);
CREATE POLICY "Client can cancel own appointments" ON public.appointments FOR UPDATE USING (
    client_id = auth.uid() AND status = 'confirmed' AND start_time > (NOW() + INTERVAL '2 hours')
) WITH CHECK (
    client_id = auth.uid() AND status = 'cancelled'
);

-- time_slots_lock
ALTER TABLE public.time_slots_lock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User can create lock" ON public.time_slots_lock FOR INSERT WITH CHECK (locked_by = auth.uid());
CREATE POLICY "User can manage own locks" ON public.time_slots_lock USING (locked_by = auth.uid());
CREATE POLICY "Shop staff can view locks" ON public.time_slots_lock FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = time_slots_lock.barbershop_id AND barbershops.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = time_slots_lock.barber_id AND barbers.user_id = auth.uid())
);

-- penalties
ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner sees shop penalties" ON public.penalties FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = penalties.barbershop_id AND barbershops.owner_id = auth.uid())
);
CREATE POLICY "Client sees own penalties" ON public.penalties FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Owner can insert penalties" ON public.penalties FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = penalties.barbershop_id AND barbershops.owner_id = auth.uid())
);

-- client_warnings
ALTER TABLE public.client_warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages warnings" ON public.client_warnings USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = client_warnings.barbershop_id AND barbershops.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = client_warnings.barbershop_id AND barbershops.owner_id = auth.uid())
);
CREATE POLICY "Client sees own warnings" ON public.client_warnings FOR SELECT USING (client_id = auth.uid());

-- barber_availability_exceptions
ALTER TABLE public.barber_availability_exceptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages exceptions" ON public.barber_availability_exceptions USING (
    EXISTS (SELECT 1 FROM public.barbers b JOIN public.barbershops bs ON b.barbershop_id = bs.id WHERE b.id = barber_availability_exceptions.barber_id AND bs.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbers b JOIN public.barbershops bs ON b.barbershop_id = bs.id WHERE b.id = barber_availability_exceptions.barber_id AND bs.owner_id = auth.uid())
);
CREATE POLICY "Barber sees own exceptions" ON public.barber_availability_exceptions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = barber_availability_exceptions.barber_id AND barbers.user_id = auth.uid())
);

-- barber_breaks
ALTER TABLE public.barber_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barber manages own breaks" ON public.barber_breaks USING (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = barber_breaks.barber_id AND barbers.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = barber_breaks.barber_id AND barbers.user_id = auth.uid())
);
CREATE POLICY "Owner sees shop breaks" ON public.barber_breaks FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.barbers b JOIN public.barbershops bs ON b.barbershop_id = bs.id WHERE b.id = barber_breaks.barber_id AND bs.owner_id = auth.uid())
);

-- client_notes
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff can manage notes" ON public.client_notes USING (
    EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = client_notes.barbershop_id AND barbershops.owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.barbers WHERE barbers.barbershop_id = client_notes.barbershop_id AND barbers.user_id = auth.uid() AND barbers.status = 'active')
) WITH CHECK (
    (author_id = auth.uid()) AND (
        EXISTS (SELECT 1 FROM public.barbershops WHERE barbershops.id = client_notes.barbershop_id AND barbershops.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM public.barbers WHERE barbers.barbershop_id = client_notes.barbershop_id AND barbers.user_id = auth.uid() AND barbers.status = 'active')
    )
);

-- absence_requests
ALTER TABLE public.absence_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Barber manages own requests" ON public.absence_requests USING (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = absence_requests.barber_id AND barbers.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbers WHERE barbers.id = absence_requests.barber_id AND barbers.user_id = auth.uid())
);
CREATE POLICY "Owner manages absence requests" ON public.absence_requests USING (
    EXISTS (SELECT 1 FROM public.barbers b JOIN public.barbershops bs ON b.barbershop_id = bs.id WHERE b.id = absence_requests.barber_id AND bs.owner_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.barbers b JOIN public.barbershops bs ON b.barbershop_id = bs.id WHERE b.id = absence_requests.barber_id AND bs.owner_id = auth.uid())
);

-- favorite_shops
ALTER TABLE public.favorite_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own favorite shops" ON public.favorite_shops USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- favorite_barbers
ALTER TABLE public.favorite_barbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User manages own favorite barbers" ON public.favorite_barbers USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- owner_policies
ALTER TABLE public.owner_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own policies" ON public.owner_policies USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- owner_shift_preferences
ALTER TABLE public.owner_shift_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages own shift preferences" ON public.owner_shift_preferences USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- -----------------------------------------------------------------------------
-- TRIGGERS PARA updated_at
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_barbershops ON public.barbershops;
CREATE TRIGGER set_updated_at_barbershops BEFORE UPDATE ON public.barbershops FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_barbers ON public.barbers;
CREATE TRIGGER set_updated_at_barbers BEFORE UPDATE ON public.barbers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_invitations ON public.barber_invitations;
CREATE TRIGGER set_updated_at_invitations BEFORE UPDATE ON public.barber_invitations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_appointments ON public.appointments;
CREATE TRIGGER set_updated_at_appointments BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_warnings ON public.client_warnings;
CREATE TRIGGER set_updated_at_warnings BEFORE UPDATE ON public.client_warnings FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_favorite_shops ON public.favorite_shops;
CREATE TRIGGER set_updated_at_favorite_shops BEFORE UPDATE ON public.favorite_shops FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_favorite_barbers ON public.favorite_barbers;
CREATE TRIGGER set_updated_at_favorite_barbers BEFORE UPDATE ON public.favorite_barbers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_owner_policies ON public.owner_policies;
CREATE TRIGGER set_updated_at_owner_policies BEFORE UPDATE ON public.owner_policies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_owner_shift_preferences ON public.owner_shift_preferences;
CREATE TRIGGER set_updated_at_owner_shift_preferences BEFORE UPDATE ON public.owner_shift_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- -----------------------------------------------------------------------------
-- TRIGGER para crear perfil automáticamente al registrarse
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url, email_verified)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url', COALESCE((NEW.raw_user_meta_data->>'email_verified')::BOOLEAN, FALSE));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -----------------------------------------------------------------------------
-- VISTA user_roles
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.user_roles AS
SELECT p.id AS user_id, 'cliente'::TEXT AS role_type, NULL::UUID AS barbershop_id, NULL::TEXT AS barbershop_name FROM public.profiles p
UNION ALL
SELECT b.user_id, 'barbero'::TEXT, b.barbershop_id, bs.name FROM public.barbers b JOIN public.barbershops bs ON bs.id = b.barbershop_id WHERE b.status = 'active'
UNION ALL
SELECT bs.owner_id AS user_id, 'dueno'::TEXT, bs.id AS barbershop_id, bs.name FROM public.barbershops bs WHERE bs.status = 'active';

-- -----------------------------------------------------------------------------
-- FUNCIÓN aceptar_invitacion_por_codigo
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invitation_by_code(p_code TEXT)
RETURNS JSONB AS $$
WITH current_user AS (
    SELECT auth.uid() AS user_id
), invitation AS (
    SELECT bi.id, bi.barbershop_id
    FROM public.barber_invitations bi
    WHERE bi.manual_code = p_code
      AND bi.status = 'pending'
      AND bi.expires_at > NOW()
    LIMIT 1
), already_barber AS (
    SELECT 1 AS exists_row
    FROM public.barbers b
    JOIN invitation i ON i.barbershop_id = b.barbershop_id
    JOIN current_user cu ON cu.user_id = b.user_id
    LIMIT 1
), inserted AS (
    INSERT INTO public.barbers (barbershop_id, user_id, specialty, color_hex, status)
    SELECT i.barbershop_id, cu.user_id, 'Barbero', '#D4AF37', 'active'
    FROM invitation i
    CROSS JOIN current_user cu
    WHERE NOT EXISTS (SELECT 1 FROM already_barber)
    ON CONFLICT (barbershop_id, user_id) DO NOTHING
    RETURNING id
), invitation_updated AS (
    UPDATE public.barber_invitations bi
    SET status = 'accepted', updated_at = NOW()
    FROM invitation i
    WHERE bi.id = i.id
      AND EXISTS (SELECT 1 FROM inserted)
    RETURNING bi.id
)
SELECT CASE
    WHEN NOT EXISTS (SELECT 1 FROM invitation)
        THEN jsonb_build_object('success', false, 'message', 'Código inválido o expirado.')
    WHEN EXISTS (SELECT 1 FROM already_barber)
        THEN jsonb_build_object('success', false, 'message', 'Ya eres barbero en esta barbería.')
    WHEN EXISTS (SELECT 1 FROM inserted)
        THEN jsonb_build_object('success', true, 'message', 'Te has unido correctamente.')
    ELSE
        jsonb_build_object('success', false, 'message', 'No se pudo completar la invitación.')
END;
$$ LANGUAGE sql SECURITY DEFINER;

REVOKE ALL ON FUNCTION public.accept_invitation_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation_by_code(TEXT) TO authenticated;

-- -----------------------------------------------------------------------------
-- FUNCIÓN limpiar_bloqueos_expirados
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.clean_expired_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM public.time_slots_lock WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- ÍNDICES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_barbershops_owner ON public.barbershops(owner_id);
CREATE INDEX IF NOT EXISTS idx_barbers_user ON public.barbers(user_id);
CREATE INDEX IF NOT EXISTS idx_barbers_shop ON public.barbers(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_services_shop ON public.services(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber ON public.appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_shop ON public.appointments(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.barber_invitations(manual_code);
CREATE INDEX IF NOT EXISTS idx_join_requests_shop ON public.join_requests(barbershop_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user ON public.join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_lock_expires ON public.time_slots_lock(expires_at);
CREATE INDEX IF NOT EXISTS idx_favorite_shops_user ON public.favorite_shops(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_barbers_user ON public.favorite_barbers(user_id);
CREATE INDEX IF NOT EXISTS idx_owner_shift_preferences_owner_date ON public.owner_shift_preferences(owner_id, date_key);