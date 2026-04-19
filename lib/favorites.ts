import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type FavoriteShop = {
  id: string;
  name: string;
  address: string;
};

export type FavoriteBarber = {
  id: string;
  name: string;
  role: string;
  branch: string;
  image: string;
  shopId?: string;
};

const FAVORITE_SHOPS_KEY = "favorite_shops";
const FAVORITE_BARBERS_KEY = "favorite_barbers";

type DbFavoriteShop = {
  shop_id: string;
  shop_name: string;
  shop_address: string;
};

type DbFavoriteBarber = {
  barber_id: string;
  barber_name: string;
  barber_role: string;
  barber_branch: string;
  barber_image: string;
  shop_id: string | null;
};

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const resolveFavoritesKeys = async () => {
  const scope = await resolveStorageScope();
  return {
    shopsKey: buildScopedStorageKey(FAVORITE_SHOPS_KEY, scope),
    barbersKey: buildScopedStorageKey(FAVORITE_BARBERS_KEY, scope),
  };
};

const getAuthUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
};

export const getFavoriteShops = async (): Promise<FavoriteShop[]> => {
  const { shopsKey } = await resolveFavoritesKeys();

  if (isSupabaseConfigured) {
    const userId = await getAuthUserId();
    if (userId) {
      const { data, error } = await supabase
        .from("favorite_shops")
        .select("shop_id, shop_name, shop_address")
        .eq("user_id", userId)
        .returns<DbFavoriteShop[]>();

      if (!error && data) {
        const mapped: FavoriteShop[] = data.map((item) => ({
          id: item.shop_id,
          name: item.shop_name,
          address: item.shop_address,
        }));

        await AsyncStorage.setItem(shopsKey, JSON.stringify(mapped));
        return mapped;
      }
    }
  }

  const value = await AsyncStorage.getItem(shopsKey);
  const parsed = parseJson<FavoriteShop[]>(value, []);

  if (parsed.length) {
    return parsed;
  }

  const legacy = await AsyncStorage.getItem(FAVORITE_SHOPS_KEY);
  const legacyParsed = parseJson<FavoriteShop[]>(legacy, []);
  if (legacyParsed.length) {
    await AsyncStorage.setItem(shopsKey, JSON.stringify(legacyParsed));
    return legacyParsed;
  }

  return [];
};

export const getFavoriteBarbers = async (): Promise<FavoriteBarber[]> => {
  const { barbersKey } = await resolveFavoritesKeys();

  if (isSupabaseConfigured) {
    const userId = await getAuthUserId();
    if (userId) {
      const { data, error } = await supabase
        .from("favorite_barbers")
        .select(
          "barber_id, barber_name, barber_role, barber_branch, barber_image, shop_id",
        )
        .eq("user_id", userId)
        .returns<DbFavoriteBarber[]>();

      if (!error && data) {
        const mapped: FavoriteBarber[] = data.map((item) => ({
          id: item.barber_id,
          name: item.barber_name,
          role: item.barber_role,
          branch: item.barber_branch,
          image: item.barber_image,
          shopId: item.shop_id ?? undefined,
        }));

        await AsyncStorage.setItem(barbersKey, JSON.stringify(mapped));
        return mapped;
      }
    }
  }

  const value = await AsyncStorage.getItem(barbersKey);
  const parsed = parseJson<FavoriteBarber[]>(value, []);

  if (parsed.length) {
    return parsed;
  }

  const legacy = await AsyncStorage.getItem(FAVORITE_BARBERS_KEY);
  const legacyParsed = parseJson<FavoriteBarber[]>(legacy, []);
  if (legacyParsed.length) {
    await AsyncStorage.setItem(barbersKey, JSON.stringify(legacyParsed));
    return legacyParsed;
  }

  return [];
};

export const toggleFavoriteShop = async (
  shop: FavoriteShop,
): Promise<{ isFavorite: boolean; favorites: FavoriteShop[] }> => {
  const { shopsKey } = await resolveFavoritesKeys();
  const favorites = await getFavoriteShops();
  const exists = favorites.some((item) => item.id === shop.id);

  const nextFavorites = exists
    ? favorites.filter((item) => item.id !== shop.id)
    : [shop, ...favorites];

  if (isSupabaseConfigured) {
    const userId = await getAuthUserId();
    if (userId) {
      if (exists) {
        await supabase
          .from("favorite_shops")
          .delete()
          .eq("user_id", userId)
          .eq("shop_id", shop.id);
      } else {
        await supabase.from("favorite_shops").upsert(
          {
            user_id: userId,
            shop_id: shop.id,
            shop_name: shop.name,
            shop_address: shop.address,
          },
          { onConflict: "user_id,shop_id" },
        );
      }
    }
  }

  await AsyncStorage.setItem(shopsKey, JSON.stringify(nextFavorites));

  return {
    isFavorite: !exists,
    favorites: nextFavorites,
  };
};

export const toggleFavoriteBarber = async (
  barber: FavoriteBarber,
): Promise<{ isFavorite: boolean; favorites: FavoriteBarber[] }> => {
  const { barbersKey } = await resolveFavoritesKeys();
  const favorites = await getFavoriteBarbers();
  const exists = favorites.some((item) => item.id === barber.id);

  const nextFavorites = exists
    ? favorites.filter((item) => item.id !== barber.id)
    : [barber, ...favorites];

  if (isSupabaseConfigured) {
    const userId = await getAuthUserId();
    if (userId) {
      if (exists) {
        await supabase
          .from("favorite_barbers")
          .delete()
          .eq("user_id", userId)
          .eq("barber_id", barber.id);
      } else {
        await supabase.from("favorite_barbers").upsert(
          {
            user_id: userId,
            barber_id: barber.id,
            barber_name: barber.name,
            barber_role: barber.role,
            barber_branch: barber.branch,
            barber_image: barber.image,
            shop_id: barber.shopId ?? null,
          },
          { onConflict: "user_id,barber_id" },
        );
      }
    }
  }

  await AsyncStorage.setItem(barbersKey, JSON.stringify(nextFavorites));

  return {
    isFavorite: !exists,
    favorites: nextFavorites,
  };
};

export const removeFavoriteShop = async (shopId: string) => {
  const { shopsKey } = await resolveFavoritesKeys();
  const favorites = await getFavoriteShops();
  const nextFavorites = favorites.filter((item) => item.id !== shopId);

  if (isSupabaseConfigured) {
    const userId = await getAuthUserId();
    if (userId) {
      await supabase
        .from("favorite_shops")
        .delete()
        .eq("user_id", userId)
        .eq("shop_id", shopId);
    }
  }

  await AsyncStorage.setItem(shopsKey, JSON.stringify(nextFavorites));
  return nextFavorites;
};

export const removeFavoriteBarber = async (barberId: string) => {
  const { barbersKey } = await resolveFavoritesKeys();
  const favorites = await getFavoriteBarbers();
  const nextFavorites = favorites.filter((item) => item.id !== barberId);

  if (isSupabaseConfigured) {
    const userId = await getAuthUserId();
    if (userId) {
      await supabase
        .from("favorite_barbers")
        .delete()
        .eq("user_id", userId)
        .eq("barber_id", barberId);
    }
  }

  await AsyncStorage.setItem(barbersKey, JSON.stringify(nextFavorites));
  return nextFavorites;
};
