import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  APP_ROLE_VALUES,
  ROLE_HOME_ROUTES,
  STORAGE_KEYS,
  type AppRoleValue,
} from "@/constants/app-config";

export type AppRole = AppRoleValue;

export const getRoleHomeRoute = (role: AppRole) => ROLE_HOME_ROUTES[role];

export const getStoredActiveRole = async (): Promise<AppRole | null> => {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE);
  if (value && APP_ROLE_VALUES.includes(value as AppRole)) {
    return value;
  }

  return null;
};

export const setStoredActiveRole = async (role: AppRole) => {
  await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
};

export const clearStoredActiveRole = async () => {
  await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
};
