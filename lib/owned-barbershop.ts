import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const OWNED_BARBERSHOP_KEY = "owned_barbershop_profile";

export type OwnedBarbershopProfile = {
  id?: string;
  name: string;
  address: string;
  phone: string;
  description: string;
  imageUri: string;
  createdAt: string;
};

type DbBarbershop = {
  id: string;
  name: string;
  address: string;
  phone: string;
  logo_url: string | null;
  created_at: string;
};

const parseOwnedBarbershop = (
  raw: string | null,
): OwnedBarbershopProfile | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<OwnedBarbershopProfile>;

    if (
      typeof parsed.name !== "string" ||
      typeof parsed.address !== "string" ||
      typeof parsed.phone !== "string" ||
      typeof parsed.description !== "string" ||
      typeof parsed.createdAt !== "string"
    ) {
      return null;
    }

    const imageUri = typeof parsed.imageUri === "string" ? parsed.imageUri : "";

    return {
      name: parsed.name,
      address: parsed.address,
      phone: parsed.phone,
      description: parsed.description,
      imageUri,
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
};

export const getOwnedBarbershopProfile = async (user?: User | null) => {
  const scope = await resolveStorageScope(user);
  const scopedKey = buildScopedStorageKey(OWNED_BARBERSHOP_KEY, scope);

  if (isSupabaseConfigured) {
    const resolvedUser =
      typeof user === "undefined"
        ? ((await supabase.auth.getUser()).data.user ?? null)
        : user;

    if (resolvedUser?.id) {
      const { data, error } = await supabase
        .from("barbershops")
        .select("id, name, address, phone, logo_url, created_at")
        .eq("owner_id", resolvedUser.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<DbBarbershop>();

      if (!error && data) {
        const profile: OwnedBarbershopProfile = {
          id: data.id,
          name: data.name,
          address: data.address,
          phone: data.phone,
          description: "",
          imageUri: data.logo_url ?? "",
          createdAt: data.created_at,
        };

        await AsyncStorage.setItem(scopedKey, JSON.stringify(profile));
        return profile;
      }
    }
  }

  const rawScoped = await AsyncStorage.getItem(scopedKey);
  const scopedProfile = parseOwnedBarbershop(rawScoped);
  if (scopedProfile) {
    return scopedProfile;
  }

  const rawLegacy = await AsyncStorage.getItem(OWNED_BARBERSHOP_KEY);
  const legacyProfile = parseOwnedBarbershop(rawLegacy);
  if (!legacyProfile) {
    return null;
  }

  await AsyncStorage.setItem(scopedKey, JSON.stringify(legacyProfile));
  return legacyProfile;
};

export const saveOwnedBarbershopProfile = async (
  profile: Omit<OwnedBarbershopProfile, "createdAt">,
  user?: User | null,
) => {
  const scope = await resolveStorageScope(user);
  const scopedKey = buildScopedStorageKey(OWNED_BARBERSHOP_KEY, scope);

  if (isSupabaseConfigured) {
    const resolvedUser =
      typeof user === "undefined"
        ? ((await supabase.auth.getUser()).data.user ?? null)
        : user;

    if (resolvedUser?.id) {
      const { data: existing } = await supabase
        .from("barbershops")
        .select("id")
        .eq("owner_id", resolvedUser.id)
        .neq("status", "deleted")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<{ id: string }>();

      if (existing?.id) {
        await supabase
          .from("barbershops")
          .update({
            name: profile.name,
            address: profile.address,
            phone: profile.phone,
            logo_url: profile.imageUri || null,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("barbershops").insert({
          owner_id: resolvedUser.id,
          name: profile.name,
          address: profile.address,
          phone: profile.phone,
          logo_url: profile.imageUri || null,
          status: "active",
        });
      }
    }
  }

  const payload: OwnedBarbershopProfile = {
    ...profile,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(scopedKey, JSON.stringify(payload));
  return payload;
};
