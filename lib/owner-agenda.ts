import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const OWNER_APPOINTMENTS_KEY = "owner_appointments_by_date";

export type OwnerAppointmentStatus =
  | "pendiente"
  | "en_progreso"
  | "completado"
  | "no_asistio"
  | "libre"
  | "bloqueado";

export type OwnerAppointment = {
  id: string;
  time: string;
  client: string;
  service: string;
  status: OwnerAppointmentStatus;
};

type OwnerAppointmentsByDate = Record<string, OwnerAppointment[]>;

type DbAppointmentStatus = "confirmed" | "completed" | "cancelled" | "no_show";

type DbAppointment = {
  id: string;
  status: DbAppointmentStatus;
  start_time: string;
  end_time: string;
  barber_id: string;
  client_id: string;
  service_id: string;
};

type DbServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
};

type DbProfileRow = {
  id: string;
  full_name: string | null;
};

type DbBarberRow = {
  id: string;
  user_id: string;
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseMap = (raw: string | null) => {
  if (!raw) {
    return {} as OwnerAppointmentsByDate;
  }

  try {
    return JSON.parse(raw) as OwnerAppointmentsByDate;
  } catch {
    return {} as OwnerAppointmentsByDate;
  }
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const toLocalStatus = (status: DbAppointmentStatus): OwnerAppointmentStatus => {
  if (status === "completed") {
    return "completado";
  }

  if (status === "no_show" || status === "cancelled") {
    return "no_asistio";
  }

  return "pendiente";
};

const toDbStatus = (status: OwnerAppointmentStatus): DbAppointmentStatus => {
  if (status === "completado") {
    return "completed";
  }

  if (status === "no_asistio") {
    return "no_show";
  }

  if (status === "bloqueado") {
    return "confirmed";
  }

  return "confirmed";
};

const normalizeKey = (value: string) => value.trim().toLowerCase();

const parseTimeOnDate = (date: Date, time: string) => {
  const [hhText, mmText] = time.split(":");
  const hh = Number(hhText);
  const mm = Number(mmText);

  if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
    return null;
  }

  const parsed = new Date(date);
  parsed.setHours(hh, mm, 0, 0);
  return parsed;
};

const resolveAuthUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
};

const getScopedAgendaKey = async (user?: User | null) => {
  const scope = await resolveStorageScope(user);
  return buildScopedStorageKey(OWNER_APPOINTMENTS_KEY, scope);
};

const getOwnerPrimaryBarbershopId = async (user: User) => {
  const { data } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", user.id)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
};

const getBarberPrimaryBarbershopId = async (user: User) => {
  const { data } = await supabase
    .from("barbers")
    .select("barbershop_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ barbershop_id: string }>();

  return data?.barbershop_id ?? null;
};

const getPrimaryBarbershopId = async (user: User) => {
  const ownerShopId = await getOwnerPrimaryBarbershopId(user);
  if (ownerShopId) {
    return ownerShopId;
  }

  return getBarberPrimaryBarbershopId(user);
};

const getDayBoundsIso = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const mapDbAppointments = async (rows: DbAppointment[]) => {
  const clientIds = [...new Set(rows.map((item) => item.client_id))];
  const serviceIds = [...new Set(rows.map((item) => item.service_id))];

  const [{ data: profiles }, { data: services }] = await Promise.all([
    clientIds.length
      ? supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", clientIds)
          .returns<DbProfileRow[]>()
      : Promise.resolve({
          data: [] as DbProfileRow[],
        }),
    serviceIds.length
      ? supabase
          .from("services")
          .select("id, name")
          .in("id", serviceIds)
          .returns<Array<{ id: string; name: string }>>()
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
  ]);

  const profileNameById = new Map(
    (profiles ?? []).map((item) => [item.id, item.full_name ?? "Cliente"]),
  );
  const serviceNameById = new Map(
    (services ?? []).map((item) => [item.id, item.name]),
  );

  return rows.map((item) => {
    const start = new Date(item.start_time);
    const hh = `${start.getHours()}`.padStart(2, "0");
    const mm = `${start.getMinutes()}`.padStart(2, "0");

    return {
      id: item.id,
      time: `${hh}:${mm}`,
      client: profileNameById.get(item.client_id) ?? "Cliente",
      service: serviceNameById.get(item.service_id) ?? "Servicio",
      status: toLocalStatus(item.status),
    } satisfies OwnerAppointment;
  });
};

const syncAppointmentsToSupabase = async (
  date: Date,
  appointments: OwnerAppointment[],
  user: User,
  shopId: string,
  removedAppointmentIds: string[],
) => {
  const nonFreeAppointments = appointments.filter(
    (item) => item.status !== "libre" && item.status !== "bloqueado",
  );
  if (!nonFreeAppointments.length && !removedAppointmentIds.length) {
    return;
  }

  const { startIso, endIso } = getDayBoundsIso(date);

  const [{ data: existing }, { data: services }, { data: barbers }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, status, start_time, end_time, barber_id, client_id, service_id",
        )
        .eq("barbershop_id", shopId)
        .gte("start_time", startIso)
        .lte("start_time", endIso)
        .returns<DbAppointment[]>(),
      supabase
        .from("services")
        .select("id, name, duration_minutes")
        .eq("barbershop_id", shopId)
        .returns<DbServiceRow[]>(),
      supabase
        .from("barbers")
        .select("id, user_id")
        .eq("barbershop_id", shopId)
        .eq("status", "active")
        .order("created_at", { ascending: true })
        .returns<DbBarberRow[]>(),
    ]);

  const existingById = new Map((existing ?? []).map((item) => [item.id, item]));
  const serviceByName = new Map(
    (services ?? []).map((item) => [normalizeKey(item.name), item]),
  );

  const namesToResolve = [
    ...new Set(
      nonFreeAppointments
        .filter((item) => !isUuid(item.id))
        .map((item) => item.client.trim())
        .filter(Boolean),
    ),
  ];

  const { data: profiles } = namesToResolve.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("full_name", namesToResolve)
        .returns<DbProfileRow[]>()
    : { data: [] as DbProfileRow[] };

  const profileByName = new Map(
    (profiles ?? [])
      .filter((item) => item.full_name)
      .map((item) => [normalizeKey(item.full_name as string), item.id]),
  );

  const fallbackBarberId =
    (barbers ?? []).find((item) => item.user_id === user.id)?.id ??
    (barbers ?? [])[0]?.id ??
    null;

  const updates: Array<Promise<unknown>> = [];
  const inserts: Array<{
    barbershop_id: string;
    client_id: string;
    barber_id: string;
    service_id: string;
    start_time: string;
    end_time: string;
    status: DbAppointmentStatus;
  }> = [];

  nonFreeAppointments.forEach((item) => {
    const startDate = parseTimeOnDate(date, item.time);
    if (!startDate) {
      return;
    }

    const resolvedService =
      serviceByName.get(normalizeKey(item.service)) ??
      (services ?? [])[0] ??
      null;

    const duration = Math.max(
      Number(resolvedService?.duration_minutes ?? 45),
      15,
    );
    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    if (isUuid(item.id) && existingById.has(item.id)) {
      const payload: {
        status: DbAppointmentStatus;
        start_time: string;
        end_time: string;
        service_id?: string;
      } = {
        status: toDbStatus(item.status),
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
      };

      if (resolvedService?.id) {
        payload.service_id = resolvedService.id;
      }

      updates.push(
        supabase
          .from("appointments")
          .update(payload)
          .eq("barbershop_id", shopId)
          .eq("id", item.id),
      );
      return;
    }

    if (!resolvedService?.id || !fallbackBarberId) {
      return;
    }

    const resolvedClientId = profileByName.get(normalizeKey(item.client));
    if (!resolvedClientId) {
      return;
    }

    const matchedExisting = (existing ?? []).find(
      (row) =>
        row.client_id === resolvedClientId &&
        row.service_id === resolvedService.id &&
        row.start_time === startDate.toISOString(),
    );

    if (matchedExisting?.id) {
      updates.push(
        supabase
          .from("appointments")
          .update({
            status: toDbStatus(item.status),
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            service_id: resolvedService.id,
          })
          .eq("barbershop_id", shopId)
          .eq("id", matchedExisting.id),
      );
      return;
    }

    inserts.push({
      barbershop_id: shopId,
      client_id: resolvedClientId,
      barber_id: fallbackBarberId,
      service_id: resolvedService.id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      status: toDbStatus(item.status),
    });
  });

  if (updates.length) {
    await Promise.all(updates);
  }

  if (inserts.length) {
    await supabase.from("appointments").insert(inserts);
  }

  if (removedAppointmentIds.length) {
    await supabase
      .from("appointments")
      .update({
        status: "cancelled",
        cancelled_by: user.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq("barbershop_id", shopId)
      .in("id", removedAppointmentIds);
  }
};

const persistMap = async (map: OwnerAppointmentsByDate) => {
  const user = await resolveAuthUser();
  const scopedKey = await getScopedAgendaKey(user);
  await AsyncStorage.setItem(scopedKey, JSON.stringify(map));
};

export const getOwnerAppointmentsMap = async () => {
  const user = await resolveAuthUser();
  const scopedKey = await getScopedAgendaKey(user);

  if (isSupabaseConfigured && user) {
    const shopId = await getPrimaryBarbershopId(user);

    if (shopId) {
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, status, start_time, end_time, barber_id, client_id, service_id",
        )
        .eq("barbershop_id", shopId)
        .order("start_time", { ascending: true })
        .returns<DbAppointment[]>();

      if (!error && data?.length) {
        const mappedRows = await mapDbAppointments(data);
        const grouped = mappedRows.reduce<OwnerAppointmentsByDate>(
          (acc, item) => {
            const date = new Date(
              data.find((row) => row.id === item.id)?.start_time ?? "",
            );
            const key = getDateKey(date);
            if (!acc[key]) {
              acc[key] = [];
            }
            acc[key].push(item);
            return acc;
          },
          {},
        );

        await AsyncStorage.setItem(scopedKey, JSON.stringify(grouped));
        return grouped;
      }
    }
  }

  const raw = await AsyncStorage.getItem(scopedKey);
  const parsed = parseMap(raw);
  if (Object.keys(parsed).length) {
    return parsed;
  }

  const legacyRaw = await AsyncStorage.getItem(OWNER_APPOINTMENTS_KEY);
  const legacyParsed = parseMap(legacyRaw);
  if (Object.keys(legacyParsed).length) {
    await AsyncStorage.setItem(scopedKey, JSON.stringify(legacyParsed));
    return legacyParsed;
  }

  return {};
};

export const getOwnerAppointmentsByDate = async (date: Date) => {
  const user = await resolveAuthUser();
  const scopedKey = await getScopedAgendaKey(user);

  if (isSupabaseConfigured && user) {
    const shopId = await getPrimaryBarbershopId(user);

    if (shopId) {
      const { startIso, endIso } = getDayBoundsIso(date);
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, status, start_time, end_time, barber_id, client_id, service_id",
        )
        .eq("barbershop_id", shopId)
        .gte("start_time", startIso)
        .lte("start_time", endIso)
        .order("start_time", { ascending: true })
        .returns<DbAppointment[]>();

      if (!error && data?.length) {
        const mapped = await mapDbAppointments(data);
        const rawCurrent = await AsyncStorage.getItem(scopedKey);
        const mapCurrent = parseMap(rawCurrent);
        mapCurrent[getDateKey(date)] = mapped;
        await AsyncStorage.setItem(scopedKey, JSON.stringify(mapCurrent));
        return mapped;
      }
    }
  }

  const raw = await AsyncStorage.getItem(scopedKey);
  const map = parseMap(raw);
  const key = getDateKey(date);

  // Si no hay datos en Supabase ni en cache, retorna vacío
  return map[key] ?? [];
};

export const saveOwnerAppointmentsByDate = async (
  date: Date,
  appointments: OwnerAppointment[],
) => {
  const user = await resolveAuthUser();
  const scopedKey = await getScopedAgendaKey(user);
  const raw = await AsyncStorage.getItem(scopedKey);
  const map = parseMap(raw);
  const key = getDateKey(date);

  const previousAppointments = map[key] ?? [];
  const previousDbIds = new Set(
    previousAppointments.map((item) => item.id).filter((id) => isUuid(id)),
  );

  const nextActiveDbIds = new Set(
    appointments
      .filter((item) => item.status !== "libre")
      .map((item) => item.id)
      .filter((id) => isUuid(id)),
  );

  const removedAppointmentIds = [...previousDbIds].filter(
    (id) => !nextActiveDbIds.has(id),
  );

  map[key] = appointments;
  await persistMap(map);

  if (isSupabaseConfigured && user) {
    const shopId = await getPrimaryBarbershopId(user);
    if (shopId) {
      await syncAppointmentsToSupabase(
        date,
        appointments,
        user,
        shopId,
        removedAppointmentIds,
      );
    }
  }
};

export const getDateStorageKey = getDateKey;
