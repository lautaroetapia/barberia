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

const defaultServices: OwnerService[] = [
  {
    id: "svc-1",
    serviceName: "Corte Imperial",
    category: "Cabello",
    description: "Corte premium con asesoria, lavado y peinado final.",
    price: "45",
    duration: "45",
    featured: true,
    active: true,
  },
  {
    id: "svc-2",
    serviceName: "Barba Premium",
    category: "Barba",
    description: "Perfilado, toalla caliente y finalizacion con aceites.",
    price: "30",
    duration: "30",
    featured: false,
    active: true,
  },
];

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
        const mapped: OwnerService[] = data.map((service) => ({
          id: service.id,
          serviceName: service.name,
          category: "General",
          description: service.description ?? "",
          price: String(service.price),
          duration: String(service.duration_minutes),
          featured: false,
          active: service.is_active,
        }));

        if (mapped.length) {
          await AsyncStorage.setItem(scopedKey, JSON.stringify(mapped));
          return mapped;
        }
      }
    }
  }

  const raw = await AsyncStorage.getItem(scopedKey);
  const parsed = parseServices(raw);

  if (!parsed.length) {
    const legacyRaw = await AsyncStorage.getItem(OWNER_SERVICES_KEY);
    const legacyParsed = parseServices(legacyRaw);

    if (legacyParsed.length) {
      await AsyncStorage.setItem(scopedKey, JSON.stringify(legacyParsed));
      return legacyParsed;
    }

    await AsyncStorage.setItem(scopedKey, JSON.stringify(defaultServices));
    return defaultServices;
  }

  return parsed;
};

export const saveOwnerServices = async (services: OwnerService[]) => {
  const user = await resolveAuthUser();
  const scopedKey = await getScopedServicesKey(user);

  if (isSupabaseConfigured && user) {
    const shopId = await getPrimaryBarbershopId(user);

    if (shopId) {
      await supabase.from("services").delete().eq("barbershop_id", shopId);

      const rows = services.map((service) => ({
        barbershop_id: shopId,
        name: service.serviceName,
        description: service.description || null,
        price: Number(service.price) || 0,
        duration_minutes: Number(service.duration) || 30,
        is_active: service.active,
      }));

      if (rows.length) {
        await supabase.from("services").insert(rows);
      }
    }
  }

  await AsyncStorage.setItem(scopedKey, JSON.stringify(services));
};
