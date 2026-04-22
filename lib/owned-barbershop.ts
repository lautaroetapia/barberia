import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const OWNED_BARBERSHOP_KEY = "owned_barbershop_profile";
const OWNED_BARBERSHOP_BUCKET =
  process.env.EXPO_PUBLIC_SUPABASE_BARBERSHOP_BUCKET ?? "barbershops";

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

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

const isBucketNotFoundError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /bucket\s+not\s+found/i.test(message);
};

const guessExtensionFromType = (contentType: string) => {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
};

const uploadBarbershopImageIfNeeded = async (
  ownerId: string,
  imageUri: string,
) => {
  const trimmedUri = imageUri.trim();
  if (!trimmedUri) {
    return "";
  }

  if (isRemoteUrl(trimmedUri)) {
    return trimmedUri;
  }

  const response = await fetch(trimmedUri);
  if (!response.ok) {
    throw new Error("No se pudo leer la imagen seleccionada.");
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const fileExtension = guessExtensionFromType(contentType);
  const filePath = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExtension}`;
  const fileBuffer = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(OWNED_BARBERSHOP_BUCKET)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from(OWNED_BARBERSHOP_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
};

const resolveLogoUrlForPersistence = async (
  ownerId: string,
  imageUri: string,
  existingLogoUrl: string | null,
) => {
  const trimmedUri = imageUri.trim();
  if (!trimmedUri) {
    return "";
  }

  if (isRemoteUrl(trimmedUri)) {
    return trimmedUri;
  }

  try {
    return await uploadBarbershopImageIfNeeded(ownerId, trimmedUri);
  } catch (error) {
    // Fallback seguro: si no existe bucket, mantener logo anterior y no romper guardado.
    if (isBucketNotFoundError(error)) {
      return existingLogoUrl ?? "";
    }

    throw error;
  }
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
    const id =
      typeof parsed.id === "string" && parsed.id.trim() ? parsed.id : undefined;

    return {
      id,
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
  options?: { forceCreate?: boolean },
) => {
  const scope = await resolveStorageScope(user);
  const scopedKey = buildScopedStorageKey(OWNED_BARBERSHOP_KEY, scope);
  let persistedBarbershopId = profile.id;
  const shouldForceCreate = Boolean(options?.forceCreate);

  if (isSupabaseConfigured) {
    const resolvedUser =
      typeof user === "undefined"
        ? ((await supabase.auth.getUser()).data.user ?? null)
        : user;

    if (!resolvedUser?.id) {
      throw new Error("Debes iniciar sesión para crear una barbería.");
    }

    const { data: existing } = shouldForceCreate
      ? { data: null as { id: string; logo_url: string | null } | null }
      : await supabase
          .from("barbershops")
          .select("id, logo_url")
          .eq("owner_id", resolvedUser.id)
          .neq("status", "deleted")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string; logo_url: string | null }>();

    const uploadedImageUrl = await resolveLogoUrlForPersistence(
      resolvedUser.id,
      profile.imageUri,
      shouldForceCreate ? null : (existing?.logo_url ?? null),
    );

    if (!shouldForceCreate && existing?.id) {
      const { error: updateError } = await supabase
        .from("barbershops")
        .update({
          name: profile.name,
          address: profile.address,
          phone: profile.phone,
          logo_url: uploadedImageUrl || null,
        })
        .eq("id", existing.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      persistedBarbershopId = existing.id;
    } else {
      const { data: insertedRows, error: insertError } = await supabase
        .from("barbershops")
        .insert({
          owner_id: resolvedUser.id,
          name: profile.name,
          address: profile.address,
          phone: profile.phone,
          logo_url: uploadedImageUrl || null,
          status: "active",
        })
        .select("id")
        .returns<Array<{ id: string }>>();

      if (insertError) {
        throw new Error(`No se pudo crear la barbería: ${insertError.message}`);
      }

      const insertedId = insertedRows?.[0]?.id;
      if (insertedId) {
        persistedBarbershopId = insertedId;
      } else {
        // Fallback para entornos donde INSERT se aplica pero no devuelve filas.
        const { data: fetched, error: fetchError } = await supabase
          .from("barbershops")
          .select("id")
          .eq("owner_id", resolvedUser.id)
          .eq("name", profile.name)
          .eq("address", profile.address)
          .eq("phone", profile.phone)
          .neq("status", "deleted")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string }>();

        if (fetchError || !fetched?.id) {
          throw new Error(
            "No pudimos confirmar la creación de la barbería. Revisa permisos RLS y vuelve a intentar.",
          );
        }

        persistedBarbershopId = fetched.id;
      }
    }

    profile = {
      ...profile,
      imageUri: uploadedImageUrl,
    };
  }

  const payload: OwnedBarbershopProfile = {
    id: persistedBarbershopId,
    ...profile,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(scopedKey, JSON.stringify(payload));
  return payload;
};
