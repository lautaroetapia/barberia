import AsyncStorage from "@react-native-async-storage/async-storage";

export type AppRole = "cliente" | "barbero" | "dueno";

const ACTIVE_ROLE_KEY = "active_role";

const ROLE_HOME_ROUTES: Record<AppRole, string> = {
  cliente: "/(tabs)",
  barbero: "/barber/barber-my-agenda",
  dueno: "/barber/dashboard-owner",
};

export const getRoleHomeRoute = (role: AppRole) => ROLE_HOME_ROUTES[role];

export const getStoredActiveRole = async (): Promise<AppRole | null> => {
  const value = await AsyncStorage.getItem(ACTIVE_ROLE_KEY);
  if (value === "cliente" || value === "barbero" || value === "dueno") {
    return value;
  }

  return null;
};

export const setStoredActiveRole = async (role: AppRole) => {
  await AsyncStorage.setItem(ACTIVE_ROLE_KEY, role);
};

export const clearStoredActiveRole = async () => {
  await AsyncStorage.removeItem(ACTIVE_ROLE_KEY);
};
