import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const OWNER_SHIFT_PREFERENCES_KEY = "owner_shift_preferences_by_date";

export type ShiftName = "morning" | "afternoon" | "night";

export type ShiftPreferences = {
  morning: boolean;
  afternoon: boolean;
  night: boolean;
};

type ShiftPreferencesMap = Record<string, ShiftPreferences>;

type DbShiftPreference = {
  date_key: string;
  morning_enabled: boolean;
  afternoon_enabled: boolean;
  night_enabled: boolean;
};

const defaultPreferences: ShiftPreferences = {
  morning: false,
  afternoon: false,
  night: false,
};

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseMap = (raw: string | null): ShiftPreferencesMap => {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as ShiftPreferencesMap;
  } catch {
    return {};
  }
};

const toDbPayload = (dateKey: string, preferences: ShiftPreferences) => ({
  date_key: dateKey,
  morning_enabled: preferences.morning,
  afternoon_enabled: preferences.afternoon,
  night_enabled: preferences.night,
});

const persistMap = async (map: ShiftPreferencesMap) => {
  const scope = await resolveStorageScope();
  const scopedKey = buildScopedStorageKey(OWNER_SHIFT_PREFERENCES_KEY, scope);
  await AsyncStorage.setItem(scopedKey, JSON.stringify(map));
};

export const getShiftForTime = (time: string): ShiftName => {
  const [hourText] = time.split(":");
  const hour = Number(hourText ?? 0);

  if (!Number.isFinite(hour)) {
    return "morning";
  }

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "night";
};

export const getShiftPreferencesByDate = async (date: Date) => {
  const key = getDateKey(date);

  if (isSupabaseConfigured) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (userId) {
      const { data, error } = await supabase
        .from("owner_shift_preferences")
        .select("date_key, morning_enabled, afternoon_enabled, night_enabled")
        .eq("owner_id", userId)
        .eq("date_key", key)
        .maybeSingle<DbShiftPreference>();

      if (!error && data) {
        return {
          morning: data.morning_enabled,
          afternoon: data.afternoon_enabled,
          night: data.night_enabled,
        };
      }
    }
  }

  const scope = await resolveStorageScope();
  const scopedKey = buildScopedStorageKey(OWNER_SHIFT_PREFERENCES_KEY, scope);
  const raw = await AsyncStorage.getItem(scopedKey);
  const map = parseMap(raw);

  return map[key] ?? defaultPreferences;
};

export const saveShiftPreferencesByDate = async (
  date: Date,
  preferences: ShiftPreferences,
) => {
  const scope = await resolveStorageScope();
  const scopedKey = buildScopedStorageKey(OWNER_SHIFT_PREFERENCES_KEY, scope);
  const raw = await AsyncStorage.getItem(scopedKey);
  const map = parseMap(raw);
  const key = getDateKey(date);

  map[key] = preferences;

  if (isSupabaseConfigured) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (userId) {
      await supabase.from("owner_shift_preferences").upsert(
        {
          owner_id: userId,
          ...toDbPayload(key, preferences),
        },
        { onConflict: "owner_id,date_key" },
      );
    }
  }

  await persistMap(map);
};
