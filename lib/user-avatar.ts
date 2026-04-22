import type { User } from "@supabase/supabase-js";

type IdentityData = {
  email?: unknown;
  avatar_url?: unknown;
  picture?: unknown;
  photo_url?: unknown;
  photoURL?: unknown;
  image?: unknown;
  profile_image_url?: unknown;
};

const pickAvatarValue = (value: unknown) => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return null;
};

const extractAvatarFromIdentityData = (identityData?: IdentityData) =>
  pickAvatarValue(identityData?.avatar_url) ??
  pickAvatarValue(identityData?.picture) ??
  pickAvatarValue(identityData?.photo_url) ??
  pickAvatarValue(identityData?.photoURL) ??
  pickAvatarValue(identityData?.image) ??
  pickAvatarValue(identityData?.profile_image_url);

export const isGoogleUser = (user: User | null) => {
  if (!user) {
    return false;
  }

  const provider = user.app_metadata?.provider;
  if (
    typeof provider === "string" &&
    provider.toLowerCase().includes("google")
  ) {
    return true;
  }

  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata?.providers
    : [];

  return providers.some(
    (currentProvider) =>
      typeof currentProvider === "string" &&
      currentProvider.toLowerCase().includes("google"),
  );
};

export const getGoogleAvatarFromProviderToken = async (
  providerToken?: string | null,
) => {
  if (!providerToken) {
    return null;
  }

  const endpoints = [
    "https://www.googleapis.com/oauth2/v3/userinfo",
    "https://www.googleapis.com/oauth2/v2/userinfo",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${providerToken}`,
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as IdentityData;
      const picture = extractAvatarFromIdentityData(data);

      if (picture) {
        return picture;
      }
    } catch {
      continue;
    }
  }

  return null;
};

export const getUserAvatarUri = (user: User | null, fallbackUri: string) => {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  const googleIdentity = identities.find((identity) =>
    typeof identity.provider === "string"
      ? identity.provider.toLowerCase().includes("google")
      : false,
  );
  const googleIdentityData = googleIdentity?.identity_data as
    | IdentityData
    | undefined;

  const googleAvatar = extractAvatarFromIdentityData(googleIdentityData);

  if (googleAvatar) {
    return googleAvatar;
  }

  const identityAvatar = identities
    .map((identity) =>
      extractAvatarFromIdentityData(identity.identity_data as IdentityData),
    )
    .find(Boolean);

  if (identityAvatar) {
    return identityAvatar;
  }

  const metadataAvatar =
    pickAvatarValue(user?.user_metadata?.avatar_url) ??
    pickAvatarValue(user?.user_metadata?.picture) ??
    pickAvatarValue(user?.user_metadata?.photo_url) ??
    pickAvatarValue(user?.user_metadata?.photoURL) ??
    pickAvatarValue(user?.user_metadata?.image) ??
    pickAvatarValue(user?.app_metadata?.avatar_url) ??
    pickAvatarValue(user?.app_metadata?.picture);

  if (metadataAvatar) {
    return metadataAvatar;
  }

  return fallbackUri;
};

const guessExtensionFromType = (contentType: string) => {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
};

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

export const uploadUserAvatar = async (
  user: User,
  imageUri: string,
) => {
  const trimmedUri = imageUri.trim();
  if (!trimmedUri || isRemoteUrl(trimmedUri)) {
    return trimmedUri;
  }

  const response = await fetch(trimmedUri);
  if (!response.ok) {
    throw new Error("No se pudo leer la imagen seleccionada.");
  }

  const contentType = response.headers.get("content-type") ?? "image/jpeg";
  const fileExtension = guessExtensionFromType(contentType);
  const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExtension}`;
  const fileBuffer = await response.arrayBuffer();

  const { supabase } = await import("@/lib/supabase");

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const publicUrl = data.publicUrl;

  await Promise.all([
    supabase.auth.updateUser({ data: { avatar_url: publicUrl } }),
    supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)
  ]);

  return publicUrl;
};
