import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const OWNER_BARBERS_KEY = "owner_barbers";
const OWNER_BARBER_REQUESTS_KEY = "owner_barber_requests";
const OWNER_INVITATION_KEY = "owner_invitation_code";

export type OwnerBarber = {
  id: string;
  name: string;
  specialty: string;
  active: boolean;
  accountEmail?: string;
  accountUserId?: string;
};

export type OwnerBarberRequest = {
  id: string;
  name: string;
};

export type OwnerInvitation = {
  code: string;
  expiresAt: string;
};

type DbBarber = {
  id: string;
  user_id: string;
  specialty: string | null;
  status: "active" | "inactive";
};

type DbJoinRequest = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected";
};

type DbInvitation = {
  manual_code: string;
  expires_at: string;
};

const defaultBarbers: OwnerBarber[] = [
  {
    id: "barber-1",
    name: "Mateo R.",
    specialty: "Corte Clasico y Barba",
    active: true,
  },
  {
    id: "barber-2",
    name: "Lucas G.",
    specialty: "Diseno y Fade",
    active: true,
  },
];

const defaultRequests: OwnerBarberRequest[] = [
  { id: "req-1", name: "Ezequiel T." },
  { id: "req-2", name: "Carlos Perez" },
];

const parseJson = <T>(raw: string | null, fallback: T): T => {
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

const resolveAuthUser = async (user?: User | null) => {
  if (typeof user !== "undefined") {
    return user;
  }

  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
};

const getOwnerPrimaryBarbershopId = async (ownerId: string) => {
  const { data } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", ownerId)
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  return data?.id ?? null;
};

const resolveOwnerKeys = async (user?: User | null) => {
  const scope = await resolveStorageScope(user);

  return {
    barbersKey: buildScopedStorageKey(OWNER_BARBERS_KEY, scope),
    requestsKey: buildScopedStorageKey(OWNER_BARBER_REQUESTS_KEY, scope),
    invitationKey: buildScopedStorageKey(OWNER_INVITATION_KEY, scope),
  };
};

export const getOwnerBarbers = async (user?: User | null) => {
  const { barbersKey } = await resolveOwnerKeys(user);

  if (isSupabaseConfigured) {
    const authUser = await resolveAuthUser(user);
    if (authUser?.id) {
      const shopId = await getOwnerPrimaryBarbershopId(authUser.id);

      if (shopId) {
        const { data, error } = await supabase
          .from("barbers")
          .select("id, user_id, specialty, status")
          .eq("barbershop_id", shopId)
          .returns<DbBarber[]>();

        if (!error && data) {
          const userIds = data.map((item) => item.user_id).filter(Boolean);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds)
            .returns<Array<{ id: string; full_name: string | null }>>();

          const profileNameById = new Map(
            (profiles ?? []).map((item) => [item.id, item.full_name ?? ""]),
          );

          const mapped: OwnerBarber[] = data.map((item) => ({
            id: item.id,
            name:
              profileNameById.get(item.user_id)?.trim() ||
              `Barbero ${item.user_id.slice(0, 6)}`,
            specialty: item.specialty ?? "Nuevo barbero",
            active: item.status === "active",
            accountUserId: item.user_id,
          }));

          await AsyncStorage.setItem(barbersKey, JSON.stringify(mapped));
          return mapped;
        }
      }
    }
  }

  const raw = await AsyncStorage.getItem(barbersKey);
  const parsed = parseJson<OwnerBarber[]>(raw, []);

  if (parsed.length) {
    return parsed;
  }

  const legacyRaw = await AsyncStorage.getItem(OWNER_BARBERS_KEY);
  const legacyParsed = parseJson<OwnerBarber[]>(legacyRaw, []);
  if (legacyParsed.length) {
    await AsyncStorage.setItem(barbersKey, JSON.stringify(legacyParsed));
    return legacyParsed;
  }

  await AsyncStorage.setItem(barbersKey, JSON.stringify(defaultBarbers));
  return defaultBarbers;
};

export const saveOwnerBarbers = async (
  barbers: OwnerBarber[],
  user?: User | null,
) => {
  const { barbersKey } = await resolveOwnerKeys(user);

  if (isSupabaseConfigured) {
    const authUser = await resolveAuthUser(user);
    if (authUser?.id) {
      const shopId = await getOwnerPrimaryBarbershopId(authUser.id);
      if (shopId) {
        const syncable = barbers.filter(
          (item) => item.accountUserId && isUuid(item.accountUserId),
        );

        if (syncable.length) {
          await Promise.all(
            syncable.map(async (item) => {
              const { data: existing } = await supabase
                .from("barbers")
                .select("id")
                .eq("barbershop_id", shopId)
                .eq("user_id", item.accountUserId as string)
                .maybeSingle<{ id: string }>();

              if (existing?.id) {
                await supabase
                  .from("barbers")
                  .update({
                    specialty: item.specialty,
                    status: item.active ? "active" : "inactive",
                  })
                  .eq("id", existing.id);
              } else {
                await supabase.from("barbers").insert({
                  barbershop_id: shopId,
                  user_id: item.accountUserId,
                  specialty: item.specialty,
                  status: item.active ? "active" : "inactive",
                });
              }
            }),
          );
        }
      }
    }
  }

  await AsyncStorage.setItem(barbersKey, JSON.stringify(barbers));
};

export const getOwnerBarberRequests = async (user?: User | null) => {
  const { requestsKey } = await resolveOwnerKeys(user);

  if (isSupabaseConfigured) {
    const authUser = await resolveAuthUser(user);
    if (authUser?.id) {
      const shopId = await getOwnerPrimaryBarbershopId(authUser.id);

      if (shopId) {
        const { data, error } = await supabase
          .from("join_requests")
          .select("id, user_id, status")
          .eq("barbershop_id", shopId)
          .eq("status", "pending")
          .returns<DbJoinRequest[]>();

        if (!error && data) {
          const userIds = data.map((item) => item.user_id).filter(Boolean);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", userIds)
            .returns<Array<{ id: string; full_name: string | null }>>();

          const profileNameById = new Map(
            (profiles ?? []).map((item) => [item.id, item.full_name ?? ""]),
          );

          const mapped: OwnerBarberRequest[] = data.map((item) => ({
            id: item.id,
            name:
              profileNameById.get(item.user_id)?.trim() ||
              `Solicitud ${item.user_id.slice(0, 6)}`,
          }));

          await AsyncStorage.setItem(requestsKey, JSON.stringify(mapped));
          return mapped;
        }
      }
    }
  }

  const raw = await AsyncStorage.getItem(requestsKey);
  const parsed = parseJson<OwnerBarberRequest[]>(raw, []);

  if (parsed.length) {
    return parsed;
  }

  const legacyRaw = await AsyncStorage.getItem(OWNER_BARBER_REQUESTS_KEY);
  const legacyParsed = parseJson<OwnerBarberRequest[]>(legacyRaw, []);
  if (legacyParsed.length) {
    await AsyncStorage.setItem(requestsKey, JSON.stringify(legacyParsed));
    return legacyParsed;
  }

  await AsyncStorage.setItem(requestsKey, JSON.stringify(defaultRequests));
  return defaultRequests;
};

export const saveOwnerBarberRequests = async (
  requests: OwnerBarberRequest[],
  user?: User | null,
) => {
  const { requestsKey } = await resolveOwnerKeys(user);

  await AsyncStorage.setItem(requestsKey, JSON.stringify(requests));
};

const randomCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += chars[Math.floor(Math.random() * chars.length)] ?? "A";
  }

  return code;
};

export const getOwnerInvitation = async (user?: User | null) => {
  const { invitationKey } = await resolveOwnerKeys(user);

  if (isSupabaseConfigured) {
    const authUser = await resolveAuthUser(user);
    if (authUser?.id) {
      const shopId = await getOwnerPrimaryBarbershopId(authUser.id);

      if (shopId) {
        const { data, error } = await supabase
          .from("barber_invitations")
          .select("manual_code, expires_at")
          .eq("barbershop_id", shopId)
          .eq("status", "pending")
          .gt("expires_at", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<DbInvitation>();

        if (!error && data?.manual_code && data?.expires_at) {
          const mapped: OwnerInvitation = {
            code: data.manual_code,
            expiresAt: data.expires_at,
          };
          await AsyncStorage.setItem(invitationKey, JSON.stringify(mapped));
          return mapped;
        }
      }
    }
  }

  const raw = await AsyncStorage.getItem(invitationKey);
  const parsed = parseJson<OwnerInvitation | null>(raw, null);

  if (parsed?.code && parsed?.expiresAt) {
    return parsed;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const invitation: OwnerInvitation = {
    code: randomCode(),
    expiresAt: expiresAt.toISOString(),
  };

  const legacyRaw = await AsyncStorage.getItem(OWNER_INVITATION_KEY);
  const legacyParsed = parseJson<OwnerInvitation | null>(legacyRaw, null);
  if (legacyParsed?.code && legacyParsed?.expiresAt) {
    await AsyncStorage.setItem(invitationKey, JSON.stringify(legacyParsed));
    return legacyParsed;
  }

  await AsyncStorage.setItem(invitationKey, JSON.stringify(invitation));
  return invitation;
};

export const regenerateOwnerInvitation = async (user?: User | null) => {
  const { invitationKey } = await resolveOwnerKeys(user);

  if (isSupabaseConfigured) {
    const authUser = await resolveAuthUser(user);
    if (authUser?.id) {
      const shopId = await getOwnerPrimaryBarbershopId(authUser.id);
      if (shopId) {
        await supabase
          .from("barber_invitations")
          .update({ status: "expired" })
          .eq("barbershop_id", shopId)
          .eq("status", "pending");

        const expiresAtDate = new Date();
        expiresAtDate.setDate(expiresAtDate.getDate() + 7);

        const generatedCode = randomCode();
        const expiresAt = expiresAtDate.toISOString();

        await supabase.from("barber_invitations").insert({
          barbershop_id: shopId,
          manual_code: generatedCode,
          expires_at: expiresAt,
          status: "pending",
        });

        const invitation: OwnerInvitation = {
          code: generatedCode,
          expiresAt,
        };

        await AsyncStorage.setItem(invitationKey, JSON.stringify(invitation));
        return invitation;
      }
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const invitation: OwnerInvitation = {
    code: randomCode(),
    expiresAt: expiresAt.toISOString(),
  };

  await AsyncStorage.setItem(invitationKey, JSON.stringify(invitation));
  return invitation;
};
