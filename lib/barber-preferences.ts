import AsyncStorage from "@react-native-async-storage/async-storage";

const BARBER_PREFERENCES_KEY = "barber_preferences";

export type BarberPreferences = {
  notificationsEnabled: boolean;
  calendarSyncEnabled: boolean;
};

const defaultPreferences: BarberPreferences = {
  notificationsEnabled: false,
  calendarSyncEnabled: false,
};

const parsePreferences = (raw: string | null): BarberPreferences => {
  if (!raw) {
    return defaultPreferences;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BarberPreferences>;
    return {
      notificationsEnabled: Boolean(parsed.notificationsEnabled),
      calendarSyncEnabled: Boolean(parsed.calendarSyncEnabled),
    };
  } catch {
    return defaultPreferences;
  }
};

export const getBarberPreferences = async () => {
  const raw = await AsyncStorage.getItem(BARBER_PREFERENCES_KEY);
  return parsePreferences(raw);
};

export const saveBarberPreferences = async (preferences: BarberPreferences) => {
  await AsyncStorage.setItem(
    BARBER_PREFERENCES_KEY,
    JSON.stringify(preferences),
  );
};
