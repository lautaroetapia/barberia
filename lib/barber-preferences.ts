import AsyncStorage from "@react-native-async-storage/async-storage";

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const BARBER_PREFERENCES_KEY = "barber_preferences";

export type BarberPreferences = {
  notificationsEnabled: boolean;
  calendarSyncEnabled: boolean;
};

export const getBarberPreferences = async () => {
  const defaults = {
    notificationsEnabled: false,
    calendarSyncEnabled: false,
  };

  try {
    const raw = await AsyncStorage.getItem(BARBER_PREFERENCES_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<BarberPreferences>) : null;

    let notificationsEnabled =
      typeof parsed?.notificationsEnabled === "boolean"
        ? parsed.notificationsEnabled
        : defaults.notificationsEnabled;
    const calendarSyncEnabled =
      typeof parsed?.calendarSyncEnabled === "boolean"
        ? parsed.calendarSyncEnabled
        : defaults.calendarSyncEnabled;

    if (isSupabaseConfigured) {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;
      if (userId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("notifications_enabled")
          .eq("id", userId)
          .maybeSingle<{ notifications_enabled: boolean | null }>();

        if (typeof profileData?.notifications_enabled === "boolean") {
          notificationsEnabled = profileData.notifications_enabled;
        }
      }
    }

    const merged = {
      notificationsEnabled,
      calendarSyncEnabled,
    };

    await AsyncStorage.setItem(BARBER_PREFERENCES_KEY, JSON.stringify(merged));
    return merged;
  } catch {
    return defaults;
  }
};

export const saveBarberPreferences = async (preferences: BarberPreferences) => {
  await AsyncStorage.setItem(
    BARBER_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );

  if (!isSupabaseConfigured) {
    return;
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return;
  }

  await supabase
    .from("profiles")
    .update({ notifications_enabled: preferences.notificationsEnabled })
    .eq("id", userId);
};

export const saveNotificationPushToken = async (pushToken: string | null) => {
  if (!isSupabaseConfigured) {
    return;
  }

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  if (!userId) {
    return;
  }

  await supabase
    .from("profiles")
    .update({ push_token: pushToken })
    .eq("id", userId);
};
