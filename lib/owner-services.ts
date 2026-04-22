import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const OWNER_SERVICES_KEY = "owner_services";

export type OwnerService = {
  id: string;
  serviceName: string;
  category: string;
  description: string;
  price: string;
  duration: string;
  featured: boolean;
  active: boolean;
};


const parseServices = (raw: string | null) => {
  if (!raw) {
    return [] as OwnerService[];
  }

  try {
    return JSON.parse(raw) as OwnerService[];
  } catch {
    return [] as OwnerService[];
  }
};

type DbService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (value: string) => UUID_REGEX.test(value);

const toPositiveNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed > 0 ? parsed : fallback;
};

const mapDbServiceToOwnerService = (service: DbService): OwnerService => ({
  id: service.id,
  serviceName: service.name,
  category: "General",
  description: service.description ?? "",
  price: String(service.price),
  duration: String(service.duration_minutes),
  featured: false,
  active: service.is_active,
});

const resolveAuthUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
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

const getScopedServicesKey = async (user?: User | null) => {
  const scope = await resolveStorageScope(user);
  return buildScopedStorageKey(OWNER_SERVICES_KEY, scope);
};

export const getOwnerServices = async () => {
  const user = await resolveAuthUser();
  const scopedKey = await getScopedServicesKey(user);

  if (isSupabaseConfigured && user) {
    const shopId = await getPrimaryBarbershopId(user);
    if (shopId) {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, price, duration_minutes, is_active")
        .eq("barbershop_id", shopId)
        .order("created_at", { ascending: true })
        .returns<DbService[]>();

      if (!error && data) {
        const mapped = data.map(mapDbServiceToOwnerService);
        await AsyncStorage.setItem(scopedKey, JSON.stringify(mapped));
        return mapped;
      }
    }
  }

  const raw = await AsyncStorage.getItem(scopedKey);
  const parsed = parseServices(raw);

  return parsed;
};

export const saveOwnerServices = async (services: OwnerService[]) => {
  const user = await resolveAuthUser();
  const scopedKey = await getScopedServicesKey(user);

  if (isSupabaseConfigured && user) {
    const shopId = await getPrimaryBarbershopId(user);

    if (shopId) {
      const { data: existingRows, error: existingError } = await supabase
        .from("services")
        .select("id")
        .eq("barbershop_id", shopId)
        .returns<Array<{ id: string }>>();

      if (existingError) {
        throw existingError;
      }

      const existingIds = new Set((existingRows ?? []).map((item) => item.id));
      const incomingPersistedIds = new Set(
        services.map((item) => item.id).filter((id) => isUuid(id)),
      );

      const toDelete = [...existingIds].filter(
        (id) => !incomingPersistedIds.has(id),
      );

      if (toDelete.length) {
        const { error: deleteError } = await supabase
          .from("services")
          .delete()
          .in("id", toDelete)
          .eq("barbershop_id", shopId);

        if (deleteError) {
          throw deleteError;
        }
      }

      const toUpdate = services.filter(
        (service) => isUuid(service.id) && existingIds.has(service.id),
      );

      if (toUpdate.length) {
        const updateOps = toUpdate.map((service) =>
          supabase
            .from("services")
            .update({
              name: service.serviceName,
              description: service.description || null,
              price: toPositiveNumber(service.price, 1),
              duration_minutes: Math.round(
                toPositiveNumber(service.duration, 30),
              ),
              is_active: service.active,
            })
            .eq("id", service.id)
            .eq("barbershop_id", shopId),
        );

        const updateResults = await Promise.all(updateOps);
        const failedUpdate = updateResults.find((result) => result.error);
        if (failedUpdate?.error) {
          throw failedUpdate.error;
        }
      }

      const toInsert = services.filter(
        (service) => !isUuid(service.id) || !existingIds.has(service.id),
      );

      let insertedRows: DbService[] = [];
      if (toInsert.length) {
        const { data, error: insertError } = await supabase
          .from("services")
          .insert(
            toInsert.map((service) => ({
              barbershop_id: shopId,
              name: service.serviceName,
              description: service.description || null,
              price: toPositiveNumber(service.price, 1),
              duration_minutes: Math.round(
                toPositiveNumber(service.duration, 30),
              ),
              is_active: service.active,
            })),
          )
          .select("id, name, description, price, duration_minutes, is_active")
          .returns<DbService[]>();

        if (insertError) {
          throw insertError;
        }

        insertedRows = data ?? [];
      }

      let insertCursor = 0;
      const persisted = services.map((service) => {
        if (isUuid(service.id) && existingIds.has(service.id)) {
          return {
            ...service,
            price: String(toPositiveNumber(service.price, 1)),
            duration: String(
              Math.round(toPositiveNumber(service.duration, 30)),
            ),
          };
        }

        const inserted = insertedRows[insertCursor];
        insertCursor += 1;
        if (!inserted) {
          return {
            ...service,
            price: String(toPositiveNumber(service.price, 1)),
            duration: String(
              Math.round(toPositiveNumber(service.duration, 30)),
            ),
          };
        }

        return {
          ...service,
          id: inserted.id,
          price: String(inserted.price),
          duration: String(inserted.duration_minutes),
          active: inserted.is_active,
        };
      });

      await AsyncStorage.setItem(scopedKey, JSON.stringify(persisted));
      return persisted;
    }
  }

  await AsyncStorage.setItem(scopedKey, JSON.stringify(services));
  return services;
};
