import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type BusinessHoursSlot = {
  open: string;
  close: string;
};

type BusinessHoursMap = Record<string, BusinessHoursSlot | null | undefined>;

type NormalizedBusinessHoursSlot = {
  open: string;
  close: string;
};

type DbShop = {
  id: string;
  name: string;
  address: string;
  logo_url: string | null;
  verified: boolean | null;
  business_hours: BusinessHoursMap | null;
};

type DbService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  image_url: string | null;
};

type DbBarber = {
  id: string;
  user_id: string;
  specialty: string | null;
  color_hex: string | null;
  avatar_url: string | null;
  status: string;
  barbershop_id: string;
};

type DbAppointmentRange = {
  start_time: string;
  end_time: string;
};

type DbBreakRange = {
  start_time: string;
  end_time: string;
};

type DbOwnerShiftPreference = {
  morning_enabled: boolean;
  afternoon_enabled: boolean;
  night_enabled: boolean;
};

type DbOwnerPolicy = {
  free_cancellation_hours?: number | null;
  auto_confirm_appointments: boolean | null;
  allow_night_bookings: boolean | null;
};

type DbCancelableAppointment = {
  id: string;
  client_id: string;
  barbershop_id: string;
  status: string;
  start_time: string;
};

export type PublicShopCard = {
  id: string;
  name: string;
  address: string;
  logoUrl: string;
  rating: string;
  reviews: string;
  verified: boolean;
};

export type BookingServiceCard = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  imageUrl: string;
};

export type BookingBarberCard = {
  id: string;
  userId: string;
  name: string;
  specialty: string;
  avatarUrl: string;
  rating: string;
  reviews: string;
  colorHex: string;
  shopId: string;
  shopName: string;
};

export type FeaturedBarberCard = BookingBarberCard;

export type ClientAppointmentCard = {
  id: string;
  icon: string;
  service: string;
  date: string;
  time: string;
  barber: string;
  status: string;
  statusColor: string;
  canRate: boolean;
  stars: number;
  shopId?: string;
  serviceId?: string;
  barberId?: string;
  serviceDurationMinutes?: number;
};

export type BookingTimeSlot = {
  id: string;
  time: string;
  label?: string;
  disabled?: boolean;
  startMinutes: number;
  endMinutes: number;
};

export type BookingTimeSlotGroups = {
  dateLabel: string;
  dateIso: string;
  morning: BookingTimeSlot[];
  afternoon: BookingTimeSlot[];
  night: BookingTimeSlot[];
  enabledShifts: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  resolvedBarberId: string | null;
};

export const APPOINTMENT_SLOT_MINUTES = 30;

export const getReservedDurationMinutes = (serviceDurationMinutes: number) => {
  const normalizedDuration = Number.isFinite(serviceDurationMinutes)
    ? Math.max(1, Math.round(serviceDurationMinutes))
    : APPOINTMENT_SLOT_MINUTES;

  const slotsNeeded = Math.ceil(normalizedDuration / APPOINTMENT_SLOT_MINUTES);
  return slotsNeeded * APPOINTMENT_SLOT_MINUTES;
};

const DEFAULT_SHOP_IMAGE =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop";
const DEFAULT_BARBER_IMAGE =
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop";
const DEFAULT_WORKING_HOURS: NormalizedBusinessHoursSlot = {
  open: "09:00",
  close: "20:00",
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const DAY_KEYS_ES = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "miércoles",
  "jueves",
  "viernes",
  "sabado",
  "sábado",
] as const;

const parseTimeToMinutes = (value: string) => {
  const normalized = value.trim();

  // Handle values like "2026-04-21T09:30:00Z", "09:30:00-03:00", "09:30 AM".
  // Pick the primary clock time, not timezone offsets.
  const timeMatch = normalized.match(
    /(?:^|T|\s)(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i,
  );

  if (timeMatch) {
    let hours = Number(timeMatch[1] ?? 0);
    const minutes = Number(timeMatch[2] ?? 0);
    const meridiem =
      timeMatch[3]?.toUpperCase() ??
      normalized.match(/\b(AM|PM)\b/i)?.[1]?.toUpperCase();

    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    } else if (meridiem === "PM" && hours < 12) {
      hours += 12;
    }

    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      return hours * 60 + minutes;
    }
  }

  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) {
    return numeric * 60;
  }

  return 0;
};

const parseDateTimeToMinutes = (value: string) => {
  const parsed = new Date(value);
  if (Number.isFinite(parsed.getTime())) {
    return parsed.getHours() * 60 + parsed.getMinutes();
  }

  return parseTimeToMinutes(value);
};

const formatMinutesToTime = (value: number) => {
  const normalized = ((value % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor(normalized % 60)
    .toString()
    .padStart(2, "0");
  return `${hours}:${minutes}`;
};

const formatDateLabel = (date: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(date)
    .replace(/^./, (char) => char.toUpperCase());

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateKey = (dateKey: string) => {
  const [yearText, monthText, dayText] = dateKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (!Number.isFinite(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const resolveBusinessHoursSlot = (
  hours: BusinessHoursMap | null,
  date: Date,
): NormalizedBusinessHoursSlot | null => {
  if (!hours) {
    return null;
  }

  const dayKey = DAY_KEYS[date.getDay()];
  const spanishDayKey = DAY_KEYS_ES[date.getDay()];
  const rawSlot =
    hours[dayKey] ??
    hours[spanishDayKey] ??
    hours[dayKey.toUpperCase()] ??
    null;

  if (!rawSlot) {
    return null;
  }

  const open = rawSlot.open ?? (rawSlot as { start?: string }).start;
  const close = rawSlot.close ?? (rawSlot as { end?: string }).end;

  if (!open || !close) {
    return null;
  }

  return { open, close };
};

const normalizeBusinessHours = (hours: BusinessHoursMap | null) => {
  if (!hours) {
    return null;
  }

  return hours;
};

const findNextOpenDay = (
  hours: BusinessHoursMap | null,
  fromDate = new Date(),
) => {
  if (!hours) {
    return null;
  }

  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(fromDate);
    candidate.setDate(candidate.getDate() + offset);
    const dayHours = resolveBusinessHoursSlot(hours, candidate);

    if (dayHours?.open && dayHours?.close) {
      return { date: candidate, hours: dayHours };
    }
  }

  return null;
};

const buildBlockedRanges = (
  ranges: { start_time: string; end_time: string }[],
) =>
  ranges.map((range) => ({
    start: parseDateTimeToMinutes(range.start_time),
    end: parseDateTimeToMinutes(range.end_time),
  }));

const overlaps = (
  startMinutes: number,
  endMinutes: number,
  blockedRanges: { start: number; end: number }[],
) =>
  blockedRanges.some(
    (range) => startMinutes < range.end && endMinutes > range.start,
  );

const formatAppointmentDate = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));

const formatAppointmentTime = (value: string) =>
  new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));

const ACTIVE_APPOINTMENT_STATUSES = new Set(["pending", "confirmed"]);
const CLOSED_APPOINTMENT_STATUSES = new Set([
  "completed",
  "cancelled",
  "no_show",
]);

const isActiveClientAppointment = (
  appointment: { status: string; start_time: string; end_time: string },
  now: Date,
) => {
  if (!ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) {
    return false;
  }

  const endAt = new Date(appointment.end_time || appointment.start_time);
  return Number.isFinite(endAt.getTime()) && endAt >= now;
};

const isHistoryClientAppointment = (
  appointment: { status: string; start_time: string; end_time: string },
  now: Date,
) => {
  if (CLOSED_APPOINTMENT_STATUSES.has(appointment.status)) {
    return true;
  }

  if (ACTIVE_APPOINTMENT_STATUSES.has(appointment.status)) {
    const endAt = new Date(appointment.end_time || appointment.start_time);
    return Number.isFinite(endAt.getTime()) && endAt < now;
  }

  return false;
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export const getPublicBarbershops = async (): Promise<PublicShopCard[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data: publicRows, error: publicError } = await supabase
    .from("barbershops")
    .select("id, name, address, logo_url, verified, business_hours")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .returns<DbShop[]>();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: ownerRows } = user?.id
    ? await supabase
        .from("barbershops")
        .select("id, name, address, logo_url, verified, business_hours")
        .eq("owner_id", user.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false })
        .returns<DbShop[]>()
    : { data: [] as DbShop[] };

  const mergedRows = [...(publicRows ?? [])];

  for (const ownerShop of ownerRows ?? []) {
    if (!mergedRows.some((item) => item.id === ownerShop.id)) {
      mergedRows.push(ownerShop);
    }
  }

  if (!mergedRows.length) {
    if (publicError) {
      console.warn(
        "No se pudieron cargar barberias publicas:",
        publicError.message,
      );
    }
    return [];
  }

  return mergedRows.map((shop) => ({
    id: shop.id,
    name: shop.name,
    address: shop.address,
    logoUrl: shop.logo_url ?? DEFAULT_SHOP_IMAGE,
    rating: shop.verified ? "5.0" : "4.8",
    reviews: shop.verified ? "120" : "24",
    verified: Boolean(shop.verified),
  }));
};

export const getPublicBarbershopById = async (shopId: string) => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const { data, error } = await supabase
    .from("barbershops")
    .select("id, name, address, logo_url, verified, business_hours")
    .eq("id", shopId)
    .maybeSingle<DbShop>();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    address: data.address,
    logoUrl: data.logo_url ?? DEFAULT_SHOP_IMAGE,
    rating: data.verified ? "5.0" : "4.8",
    reviews: data.verified ? "120" : "24",
    verified: Boolean(data.verified),
    businessHours: normalizeBusinessHours(data.business_hours),
  };
};

export const getShopServices = async (
  shopId: string,
): Promise<BookingServiceCard[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price, duration_minutes, image_url")
    .eq("barbershop_id", shopId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .returns<DbService[]>();

  if (error || !data) {
    return [];
  }

  return data.map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    price: Number(service.price),
    durationMinutes: service.duration_minutes,
    imageUrl: service.image_url ?? DEFAULT_SHOP_IMAGE,
  }));
};

export const getShopServiceById = async (shopId: string, serviceId: string) => {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, price, duration_minutes, image_url")
    .eq("barbershop_id", shopId)
    .eq("id", serviceId)
    .maybeSingle<DbService>();
  if (error || !data) {
    return null;
  }
  return {
    id: data.id,
    name: data.name,
    description: data.description ?? "",
    price: Number(data.price),
    durationMinutes: data.duration_minutes,
    imageUrl: data.image_url ?? "",
  };
};

export const getShopBarbers = async (
  shopId: string,
): Promise<BookingBarberCard[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from("barbers")
    .select(
      "id, user_id, specialty, color_hex, avatar_url, status, barbershop_id",
    )
    .eq("barbershop_id", shopId)
    .eq("status", "active")
    .returns<DbBarber[]>();

  if (error || !data?.length) {
    return [];
  }

  const { data: shop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("id", shopId)
    .maybeSingle<{ id: string; name: string }>();

  const userIds = data.map((barber) => barber.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds)
    .returns<
      { id: string; full_name: string | null; avatar_url: string | null }[]
    >();

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return data.map((barber) => {
    const profile = profileById.get(barber.user_id);

    return {
      id: barber.id,
      userId: barber.user_id,
      name:
        profile?.full_name?.trim() || `Barbero ${barber.user_id.slice(0, 6)}`,
      specialty: barber.specialty ?? "Nuevo barbero",
      avatarUrl:
        barber.avatar_url ?? profile?.avatar_url ?? DEFAULT_BARBER_IMAGE,
      rating: "4.9",
      reviews: "120",
      colorHex: barber.color_hex ?? "#D4AF37",
      shopId,
      shopName: shop?.name ?? "Barbería",
    };
  });
};

export const getShopBarberById = async (shopId: string, barberId: string) => {
  if (!isSupabaseConfigured) {
    return null;
  }
  const { data, error } = await supabase
    .from("barbers")
    .select(
      "id, user_id, specialty, color_hex, avatar_url, status, barbershop_id",
    )
    .eq("barbershop_id", shopId)
    .eq("id", barberId)
    .eq("status", "active")
    .maybeSingle<DbBarber>();
  if (error || !data) {
    return null;
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", data.user_id)
    .maybeSingle<{
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    }>();
  const { data: shop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("id", shopId)
    .maybeSingle<{ id: string; name: string }>();
  return {
    id: data.id,
    userId: data.user_id,
    name: profile?.full_name?.trim() || `Barbero ${data.user_id.slice(0, 6)}`,
    specialty: data.specialty ?? "Nuevo barbero",
    avatarUrl: data.avatar_url ?? profile?.avatar_url ?? "",
    rating: "",
    reviews: "",
    colorHex: data.color_hex ?? "#D4AF37",
    shopId,
    shopName: shop?.name ?? "Barbería",
  };
};

export const getFeaturedBarbers = async (): Promise<FeaturedBarberCard[]> => {
  if (!isSupabaseConfigured) {
    return [];
  }

  const { data, error } = await supabase
    .from("barbers")
    .select(
      "id, user_id, specialty, color_hex, avatar_url, status, barbershop_id",
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8)
    .returns<DbBarber[]>();

  if (error || !data?.length) {
    return [];
  }

  const userIds = data.map((barber) => barber.user_id);
  const shopIds = Array.from(
    new Set(data.map((barber) => barber.barbershop_id)),
  );

  const [{ data: profiles }, { data: shops }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds)
      .returns<
        {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
        }[]
      >(),
    supabase
      .from("barbershops")
      .select("id, name")
      .in("id", shopIds)
      .returns<{ id: string; name: string }[]>(),
  ]);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );
  const shopById = new Map((shops ?? []).map((shop) => [shop.id, shop]));

  return data.map((barber) => {
    const profile = profileById.get(barber.user_id);

    return {
      id: barber.id,
      userId: barber.user_id,
      name:
        profile?.full_name?.trim() || `Barbero ${barber.user_id.slice(0, 6)}`,
      specialty: barber.specialty ?? "Especialista",
      avatarUrl:
        barber.avatar_url ?? profile?.avatar_url ?? DEFAULT_BARBER_IMAGE,
      rating: "",
      reviews: "",
      colorHex: barber.color_hex ?? "#D4AF37",
      shopId: barber.barbershop_id,
      shopName: shopById.get(barber.barbershop_id)?.name ?? "Barbería",
    };
  });
};

export const buildBookingTimeSlots = async ({
  shopId,
  barberId,
  excludeAppointmentId,
  serviceDurationMinutes,
  selectedDateIso,
  selectedDateKey,
}: {
  shopId: string;
  barberId?: string;
  excludeAppointmentId?: string;
  serviceDurationMinutes: number;
  selectedDateIso?: string;
  selectedDateKey?: string;
}): Promise<BookingTimeSlotGroups> => {
  const parsedSelectedDate = selectedDateKey
    ? parseDateKey(selectedDateKey)
    : selectedDateIso
      ? new Date(selectedDateIso)
      : null;
  const selectedDate =
    parsedSelectedDate && Number.isFinite(parsedSelectedDate.getTime())
      ? parsedSelectedDate
      : new Date();

  if (!isSupabaseConfigured) {
    return {
      dateLabel: formatDateLabel(selectedDate),
      dateIso: selectedDate.toISOString(),
      morning: [],
      afternoon: [],
      night: [],
      enabledShifts: { morning: true, afternoon: true, night: true },
      resolvedBarberId: barberId ?? null,
    };
  }

  const shop = await getPublicBarbershopById(shopId);
  const availableBarbers = await getShopBarbers(shopId);
  const resolvedBarber =
    barberId && barberId !== "barber-any"
      ? (availableBarbers.find((item) => item.id === barberId) ?? null)
      : (availableBarbers[0] ?? null);

  let baseDate = selectedDate;
  let dayHours = resolveBusinessHoursSlot(
    shop?.businessHours ?? null,
    baseDate,
  );

  if (!dayHours?.open || !dayHours.close) {
    const nextOpenDay = findNextOpenDay(
      shop?.businessHours ?? null,
      selectedDate,
    );
    if (nextOpenDay?.hours?.open && nextOpenDay.hours.close) {
      baseDate = nextOpenDay.date;
      dayHours = nextOpenDay.hours;
    }
  }

  if (!dayHours?.open || !dayHours.close) {
    dayHours = DEFAULT_WORKING_HOURS;
  }

  let enabledShifts = { morning: true, afternoon: true, night: true };
  const { data: shopOwner } = await supabase
    .from("barbershops")
    .select("owner_id")
    .eq("id", shopId)
    .maybeSingle<{ owner_id: string }>();

  if (shopOwner?.owner_id) {
    const { data: shiftPreference } = await supabase
      .from("owner_shift_preferences")
      .select("morning_enabled, afternoon_enabled, night_enabled")
      .eq("owner_id", shopOwner.owner_id)
      .eq("date_key", formatDateKey(baseDate))
      .maybeSingle<DbOwnerShiftPreference>();

    if (shiftPreference) {
      enabledShifts = {
        morning: shiftPreference.morning_enabled,
        afternoon: shiftPreference.afternoon_enabled,
        night: shiftPreference.night_enabled,
      };
    }

    const { data: ownerPolicy, error: ownerPolicyError } = await supabase
      .from("owner_policies")
      .select("allow_night_bookings")
      .eq("owner_id", shopOwner.owner_id)
      .maybeSingle<Pick<DbOwnerPolicy, "allow_night_bookings">>();

    if (
      !ownerPolicyError &&
      typeof ownerPolicy?.allow_night_bookings === "boolean"
    ) {
      enabledShifts = {
        ...enabledShifts,
        night: enabledShifts.night && ownerPolicy.allow_night_bookings,
      };
    }
  }

  const requestedSpecificBarber = Boolean(
    barberId && barberId !== "barber-any",
  );
  const candidateBarberIds = requestedSpecificBarber
    ? ([resolvedBarber?.id ?? null].filter(Boolean) as string[])
    : availableBarbers.map((item) => item.id);

  if (!candidateBarberIds.length) {
    return {
      dateLabel: formatDateLabel(baseDate),
      dateIso: baseDate.toISOString(),
      morning: [],
      afternoon: [],
      night: [],
      enabledShifts,
      resolvedBarberId: null,
    };
  }

  const startOfDay = new Date(baseDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(baseDate);
  endOfDay.setHours(23, 59, 59, 999);
  let openMinutes = parseTimeToMinutes(dayHours.open);
  let closeMinutes = parseTimeToMinutes(dayHours.close);
  if (closeMinutes <= openMinutes) {
    openMinutes = parseTimeToMinutes(DEFAULT_WORKING_HOURS.open);
    closeMinutes = parseTimeToMinutes(DEFAULT_WORKING_HOURS.close);
  }
  const reservedDurationMinutes = getReservedDurationMinutes(
    serviceDurationMinutes,
  );
  const stepMinutes = APPOINTMENT_SLOT_MINUTES;
  const now = new Date();
  const isToday = formatDateKey(baseDate) === formatDateKey(now);
  const minStartMinutes = now.getHours() * 60 + now.getMinutes() + 5;
  const buildSlotsForBarber = async (candidateBarberId: string) => {
    const appointmentsQuery = supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("barbershop_id", shopId)
      .eq("barber_id", candidateBarberId)
      .in("status", ["pending", "confirmed", "completed"])
      .gte("start_time", startOfDay.toISOString())
      .lt("start_time", endOfDay.toISOString())
      .returns<DbAppointmentRange[]>();

    const filteredAppointmentsQuery = excludeAppointmentId
      ? appointmentsQuery.neq("id", excludeAppointmentId)
      : appointmentsQuery;

    const [appointmentsResponse, breaksResponse] = await Promise.all([
      filteredAppointmentsQuery,
      supabase
        .from("barber_breaks")
        .select("start_time, end_time")
        .eq("barber_id", candidateBarberId)
        .gte("start_time", startOfDay.toISOString())
        .lt("start_time", endOfDay.toISOString())
        .returns<DbBreakRange[]>(),
    ]);

    const blockedRanges = [
      ...buildBlockedRanges(appointmentsResponse.data ?? []),
      ...buildBlockedRanges(breaksResponse.data ?? []),
    ];

    const morning: BookingTimeSlot[] = [];
    const afternoon: BookingTimeSlot[] = [];
    const night: BookingTimeSlot[] = [];

    for (
      let startMinutes = openMinutes;
      startMinutes + reservedDurationMinutes <= closeMinutes;
      startMinutes += stepMinutes
    ) {
      if (isToday && startMinutes < minStartMinutes) {
        continue;
      }

      const endMinutes = startMinutes + reservedDurationMinutes;
      const slot = {
        id: formatMinutesToTime(startMinutes),
        time: formatMinutesToTime(startMinutes),
        disabled: overlaps(startMinutes, endMinutes, blockedRanges),
        startMinutes,
        endMinutes,
      } satisfies BookingTimeSlot;

      if (startMinutes < 12 * 60) {
        morning.push(slot);
      } else if (startMinutes < 18 * 60) {
        afternoon.push(slot);
      } else {
        night.push(slot);
      }
    }

    return {
      morning,
      afternoon,
      night,
      resolvedBarberId: candidateBarberId,
    };
  };

  let fallbackSlots: Awaited<ReturnType<typeof buildSlotsForBarber>> | null =
    null;

  for (const candidateBarberId of candidateBarberIds) {
    const candidateSlots = await buildSlotsForBarber(candidateBarberId);
    if (!fallbackSlots) {
      fallbackSlots = candidateSlots;
    }

    const hasAvailableCandidateSlots =
      (enabledShifts.morning &&
        candidateSlots.morning.some((slot) => !slot.disabled)) ||
      (enabledShifts.afternoon &&
        candidateSlots.afternoon.some((slot) => !slot.disabled)) ||
      (enabledShifts.night &&
        candidateSlots.night.some((slot) => !slot.disabled));

    if (requestedSpecificBarber || hasAvailableCandidateSlots) {
      return {
        dateLabel: formatDateLabel(baseDate),
        dateIso: baseDate.toISOString(),
        morning: candidateSlots.morning,
        afternoon: candidateSlots.afternoon,
        night: candidateSlots.night,
        enabledShifts,
        resolvedBarberId: candidateSlots.resolvedBarberId,
      };
    }
  }

  return {
    dateLabel: formatDateLabel(baseDate),
    dateIso: baseDate.toISOString(),
    morning: fallbackSlots?.morning ?? [],
    afternoon: fallbackSlots?.afternoon ?? [],
    night: fallbackSlots?.night ?? [],
    enabledShifts,
    resolvedBarberId:
      fallbackSlots?.resolvedBarberId ?? resolvedBarber?.id ?? null,
  };
};

export const createAppointment = async ({
  shopId,
  barberId,
  serviceId,
  startTime,
  endTime,
  notes,
}: {
  shopId: string;
  barberId: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}) => {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    throw new Error("Debes iniciar sesión para confirmar la reserva.");
  }

  const startDate = new Date(startTime);
  if (!Number.isFinite(startDate.getTime())) {
    throw new Error("La fecha u hora seleccionada no es válida.");
  }

  const now = new Date();
  if (startDate.getTime() <= now.getTime()) {
    throw new Error("No puedes reservar un turno en una fecha u hora pasada.");
  }

  const { data: activeBarber, error: activeBarberError } = await supabase
    .from("barbers")
    .select("id")
    .eq("id", barberId)
    .eq("barbershop_id", shopId)
    .eq("status", "active")
    .maybeSingle<{ id: string }>();

  if (activeBarberError) {
    throw new Error(activeBarberError.message);
  }

  if (!activeBarber?.id) {
    throw new Error(
      "Este barbero está inactivo y no puede recibir nuevos turnos.",
    );
  }

  let autoConfirmAppointments = true;
  let allowNightBookings = true;

  const { data: shopOwner } = await supabase
    .from("barbershops")
    .select("owner_id")
    .eq("id", shopId)
    .maybeSingle<{ owner_id: string }>();

  if (shopOwner?.owner_id) {
    const { data: ownerPolicy, error: ownerPolicyError } = await supabase
      .from("owner_policies")
      .select("auto_confirm_appointments, allow_night_bookings")
      .eq("owner_id", shopOwner.owner_id)
      .maybeSingle<DbOwnerPolicy>();

    if (!ownerPolicyError && ownerPolicy) {
      if (typeof ownerPolicy.auto_confirm_appointments === "boolean") {
        autoConfirmAppointments = ownerPolicy.auto_confirm_appointments;
      }

      if (typeof ownerPolicy.allow_night_bookings === "boolean") {
        allowNightBookings = ownerPolicy.allow_night_bookings;
      }
    }
  }

  const appointmentStartMinutes =
    startDate.getHours() * 60 + startDate.getMinutes();
  const NIGHT_SHIFT_START_MINUTES = 18 * 60;
  if (
    !allowNightBookings &&
    appointmentStartMinutes >= NIGHT_SHIFT_START_MINUTES
  ) {
    throw new Error(
      "La barbería no permite reservas nocturnas en este momento.",
    );
  }

  if (startDate.getMinutes() % APPOINTMENT_SLOT_MINUTES !== 0) {
    throw new Error(
      `La hora debe comenzar en bloques de ${APPOINTMENT_SLOT_MINUTES} minutos.`,
    );
  }

  const serviceData = await getShopServiceById(shopId, serviceId);
  const reservedDurationMinutes = getReservedDurationMinutes(
    serviceData?.durationMinutes ??
      Math.max(
        APPOINTMENT_SLOT_MINUTES,
        Math.round(
          (new Date(endTime).getTime() - startDate.getTime()) / (60 * 1000),
        ),
      ),
  );

  const normalizedEndDate = new Date(startDate);
  normalizedEndDate.setMinutes(
    normalizedEndDate.getMinutes() + reservedDurationMinutes,
  );

  const { data: overlappingAppointments, error: overlapAppointmentsError } =
    await supabase
      .from("appointments")
      .select("id")
      .eq("barbershop_id", shopId)
      .eq("barber_id", barberId)
      .in("status", ["pending", "confirmed", "completed"])
      .lt("start_time", normalizedEndDate.toISOString())
      .gt("end_time", startDate.toISOString())
      .limit(1)
      .returns<{ id: string }[]>();

  if (overlapAppointmentsError) {
    throw new Error(overlapAppointmentsError.message);
  }

  if ((overlappingAppointments ?? []).length > 0) {
    throw new Error(
      "Ese horario ya fue reservado. Elige otro bloque disponible.",
    );
  }

  const { data: overlappingBreaks, error: overlapBreaksError } = await supabase
    .from("barber_breaks")
    .select("id")
    .eq("barber_id", barberId)
    .lt("start_time", normalizedEndDate.toISOString())
    .gt("end_time", startDate.toISOString())
    .limit(1)
    .returns<{ id: string }[]>();

  if (overlapBreaksError) {
    throw new Error(overlapBreaksError.message);
  }

  if ((overlappingBreaks ?? []).length > 0) {
    throw new Error(
      "El barbero no tiene bloques continuos disponibles para esa duración.",
    );
  }

  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      barbershop_id: shopId,
      client_id: user.id,
      barber_id: barberId,
      service_id: serviceId,
      start_time: startDate.toISOString(),
      end_time: normalizedEndDate.toISOString(),
      status: autoConfirmAppointments ? "confirmed" : "pending",
      notes: notes?.trim() || null,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return appointment?.id ?? null;
};

export const cancelClientAppointment = async (
  appointmentId: string,
): Promise<{ penaltyApplies: boolean; freeCancellationHours: number }> => {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    throw new Error("Debes iniciar sesión para cancelar el turno.");
  }

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .select("id, client_id, barbershop_id, status, start_time")
    .eq("id", appointmentId)
    .eq("client_id", user.id)
    .maybeSingle<DbCancelableAppointment>();

  if (appointmentError) {
    throw new Error(appointmentError.message);
  }

  if (!appointment) {
    throw new Error("No encontramos el turno a cancelar.");
  }

  if (!["pending", "confirmed"].includes(appointment.status)) {
    throw new Error("Este turno ya no se puede cancelar.");
  }

  let freeCancellationHours = 12;

  const { data: shopOwner } = await supabase
    .from("barbershops")
    .select("owner_id")
    .eq("id", appointment.barbershop_id)
    .maybeSingle<{ owner_id: string }>();

  if (shopOwner?.owner_id) {
    const { data: ownerPolicy, error: ownerPolicyError } = await supabase
      .from("owner_policies")
      .select("free_cancellation_hours")
      .eq("owner_id", shopOwner.owner_id)
      .maybeSingle<Pick<DbOwnerPolicy, "free_cancellation_hours">>();

    if (
      !ownerPolicyError &&
      Number.isFinite(ownerPolicy?.free_cancellation_hours)
    ) {
      freeCancellationHours = Math.max(
        0,
        Number(ownerPolicy?.free_cancellation_hours ?? 0),
      );
    }
  }

  const appointmentStart = new Date(appointment.start_time);
  const hoursUntilAppointment =
    (appointmentStart.getTime() - Date.now()) / (60 * 60 * 1000);
  const penaltyApplies = hoursUntilAppointment < freeCancellationHours;

  const { error: cancelError } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", appointment.id)
    .eq("client_id", user.id)
    .in("status", ["pending", "confirmed"]);

  if (cancelError) {
    throw new Error(cancelError.message);
  }

  return {
    penaltyApplies,
    freeCancellationHours,
  };
};

const loadClientAppointments = async () => {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!isSupabaseConfigured || !user) {
    return [] as ClientAppointmentCard[];
  }

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "id, status, start_time, end_time, service_id, barber_id, barbershop_id",
    )
    .eq("client_id", user.id)
    .order("start_time", { ascending: true });

  if (error || !appointments?.length) {
    return [] as ClientAppointmentCard[];
  }

  const serviceIds = Array.from(
    new Set(appointments.map((item) => item.service_id)),
  );
  const barberIds = Array.from(
    new Set(appointments.map((item) => item.barber_id)),
  );

  const [{ data: services }, { data: barbers }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, name, duration_minutes")
        .in("id", serviceIds)
        .returns<{ id: string; name: string; duration_minutes: number }[]>(),
      supabase
        .from("barbers")
        .select("id, user_id")
        .in("id", barberIds)
        .returns<{ id: string; user_id: string }[]>(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .returns<{ id: string; full_name: string | null }[]>(),
    ]);

  const serviceById = new Map(
    (services ?? []).map((service) => [service.id, service.name]),
  );
  const serviceDurationById = new Map(
    (services ?? []).map((service) => [service.id, service.duration_minutes]),
  );
  const barberById = new Map(
    (barbers ?? []).map((barber) => [barber.id, barber.user_id]),
  );
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name ?? ""]),
  );

  const now = new Date();

  return appointments
    .filter((item) => isActiveClientAppointment(item, now))
    .map((appointment) => {
      const barberUserId = barberById.get(appointment.barber_id) ?? "";
      const isPending = appointment.status === "pending";

      return {
        id: appointment.id,
        icon: "content-cut",
        service: serviceById.get(appointment.service_id) ?? "Servicio",
        date: formatAppointmentDate(appointment.start_time),
        time: `${formatAppointmentTime(appointment.start_time)} hs`,
        barber: profileById.get(barberUserId) || "Barbero",
        status: isPending ? "Pendiente" : "Confirmado",
        statusColor: isPending ? "#F9A825" : "#4CAF50",
        canRate: false,
        stars: 0,
        shopId: appointment.barbershop_id,
        serviceId: appointment.service_id,
        barberId: appointment.barber_id,
        serviceDurationMinutes:
          serviceDurationById.get(appointment.service_id) ?? undefined,
      } satisfies ClientAppointmentCard;
    });
};

export const getClientActiveAppointments = async () => loadClientAppointments();

export const getClientAppointmentHistory = async (): Promise<
  ClientAppointmentCard[]
> => {
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!isSupabaseConfigured || !user) {
    return [];
  }

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(
      "id, status, start_time, end_time, service_id, barber_id, barbershop_id",
    )
    .eq("client_id", user.id)
    .order("start_time", { ascending: false });

  if (error || !appointments?.length) {
    return [];
  }

  const serviceIds = Array.from(
    new Set(appointments.map((item) => item.service_id)),
  );
  const barberIds = Array.from(
    new Set(appointments.map((item) => item.barber_id)),
  );

  const [{ data: services }, { data: barbers }, { data: profiles }] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, name")
        .in("id", serviceIds)
        .returns<{ id: string; name: string }[]>(),
      supabase
        .from("barbers")
        .select("id, user_id")
        .in("id", barberIds)
        .returns<{ id: string; user_id: string }[]>(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .returns<{ id: string; full_name: string | null }[]>(),
    ]);

  const serviceById = new Map(
    (services ?? []).map((service) => [service.id, service.name]),
  );
  const barberById = new Map(
    (barbers ?? []).map((barber) => [barber.id, barber.user_id]),
  );
  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name ?? ""]),
  );

  const now = new Date();

  return appointments
    .filter((appointment) => isHistoryClientAppointment(appointment, now))
    .map((appointment) => {
      const barberUserId = barberById.get(appointment.barber_id) ?? "";
      const statusLabel =
        appointment.status === "completed"
          ? "Completado"
          : appointment.status === "cancelled"
            ? "Cancelado"
            : appointment.status === "no_show"
              ? "No-show"
              : "Finalizado";

      return {
        id: appointment.id,
        icon:
          appointment.status === "completed" ? "event-available" : "event-note",
        service: serviceById.get(appointment.service_id) ?? "Servicio",
        date: formatAppointmentDate(appointment.start_time),
        time: `${formatAppointmentTime(appointment.start_time)} hs`,
        barber: profileById.get(barberUserId) || "Barbero",
        status: statusLabel,
        statusColor:
          appointment.status === "completed"
            ? "#4CAF50"
            : appointment.status === "cancelled"
              ? "#FF5252"
              : appointment.status === "no_show"
                ? "#777"
                : "#999",
        canRate: appointment.status === "completed",
        stars: appointment.status === "completed" ? 0 : 0,
      } satisfies ClientAppointmentCard;
    });
};
