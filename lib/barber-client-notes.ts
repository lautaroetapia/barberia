import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const BARBER_CLIENT_NOTES_KEY = "barber_client_notes";

type NotesMap = Record<string, string>;

const parseNotesMap = (raw: string | null) => {
  if (!raw) {
    return {} as NotesMap;
  }

  try {
    return JSON.parse(raw) as NotesMap;
  } catch {
    return {} as NotesMap;
  }
};

const normalizeClientName = (name: string) => name.trim().toLowerCase();

type DbClientNote = {
  client_id: string;
  note: string;
  created_at: string;
};

type DbProfile = {
  id: string;
  full_name: string | null;
};

const resolveNotesKey = async () => {
  const scope = await resolveStorageScope();
  return buildScopedStorageKey(BARBER_CLIENT_NOTES_KEY, scope);
};

const resolveAuthUser = async () => {
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

const getBarberPrimaryBarbershopId = async (userId: string) => {
  const { data } = await supabase
    .from("barbers")
    .select("barbershop_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle<{ barbershop_id: string }>();

  return data?.barbershop_id ?? null;
};

const getPrimaryBarbershopId = async (userId: string) => {
  const ownerShopId = await getOwnerPrimaryBarbershopId(userId);
  if (ownerShopId) {
    return ownerShopId;
  }

  return getBarberPrimaryBarbershopId(userId);
};

export const getBarberClientNotesMap = async () => {
  const scopedKey = await resolveNotesKey();

  if (isSupabaseConfigured) {
    const user = await resolveAuthUser();
    if (user?.id) {
      const shopId = await getPrimaryBarbershopId(user.id);
      if (shopId) {
        const { data, error } = await supabase
          .from("client_notes")
          .select("client_id, note, created_at")
          .eq("barbershop_id", shopId)
          .eq("author_id", user.id)
          .order("created_at", { ascending: false })
          .returns<DbClientNote[]>();

        if (!error && data) {
          const latestByClient = new Map<string, string>();
          data.forEach((item) => {
            if (!latestByClient.has(item.client_id)) {
              latestByClient.set(item.client_id, item.note);
            }
          });

          const clientIds = [...latestByClient.keys()];
          const { data: profiles } = clientIds.length
            ? await supabase
                .from("profiles")
                .select("id, full_name")
                .in("id", clientIds)
                .returns<DbProfile[]>()
            : { data: [] as DbProfile[] };

          const nameById = new Map(
            (profiles ?? [])
              .filter((item) => item.full_name)
              .map((item) => [item.id, item.full_name as string]),
          );

          const mapped = {} as NotesMap;
          latestByClient.forEach((note, clientId) => {
            const clientName = nameById.get(clientId);
            if (!clientName) {
              return;
            }

            mapped[normalizeClientName(clientName)] = note;
          });

          await AsyncStorage.setItem(scopedKey, JSON.stringify(mapped));
          return mapped;
        }
      }
    }
  }

  const raw = await AsyncStorage.getItem(scopedKey);
  const parsed = parseNotesMap(raw);
  if (Object.keys(parsed).length) {
    return parsed;
  }

  const legacyRaw = await AsyncStorage.getItem(BARBER_CLIENT_NOTES_KEY);
  const legacyParsed = parseNotesMap(legacyRaw);
  if (Object.keys(legacyParsed).length) {
    await AsyncStorage.setItem(scopedKey, JSON.stringify(legacyParsed));
    return legacyParsed;
  }

  return {};
};

export const getBarberClientNote = async (clientName: string) => {
  const map = await getBarberClientNotesMap();
  return map[normalizeClientName(clientName)] ?? "";
};

export const saveBarberClientNote = async (
  clientName: string,
  note: string,
) => {
  const scopedKey = await resolveNotesKey();
  const raw = await AsyncStorage.getItem(scopedKey);
  const map = parseNotesMap(raw);
  map[normalizeClientName(clientName)] = note;

  if (isSupabaseConfigured) {
    const user = await resolveAuthUser();
    if (user?.id) {
      const shopId = await getPrimaryBarbershopId(user.id);
      if (shopId) {
        const normalizedName = clientName.trim();
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("full_name", normalizedName)
          .limit(1)
          .maybeSingle<{ id: string }>();

        if (profile?.id) {
          await supabase.from("client_notes").insert({
            client_id: profile.id,
            barbershop_id: shopId,
            author_id: user.id,
            note,
          });
        }
      }
    }
  }

  await AsyncStorage.setItem(scopedKey, JSON.stringify(map));
};
