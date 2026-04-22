import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

const OWNER_POLICIES_KEY = "owner_policies";

export type OwnerPolicies = {
  freeCancellationHours: string;
  noShowPenalty: string;
  autoConfirmAppointments: boolean;
  allowNightBookings: boolean;
};


type DbOwnerPolicies = {
  free_cancellation_hours: number;
  no_show_penalty_percent: number;
  auto_confirm_appointments: boolean;
  allow_night_bookings: boolean;
};

const parsePolicies = (raw: string | null): OwnerPolicies | null => {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as OwnerPolicies;
  } catch {
    return null;
  }
};

export const getOwnerPolicies = async () => {
  const scope = await resolveStorageScope();
  const scopedKey = buildScopedStorageKey(OWNER_POLICIES_KEY, scope);

  if (isSupabaseConfigured) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (userId) {
      const { data, error } = await supabase
        .from("owner_policies")
        .select(
          "free_cancellation_hours, no_show_penalty_percent, auto_confirm_appointments, allow_night_bookings",
        )
        .eq("owner_id", userId)
        .maybeSingle<DbOwnerPolicies>();

      if (!error && data) {
        const mapped: OwnerPolicies = {
          freeCancellationHours: String(data.free_cancellation_hours),
          noShowPenalty: String(data.no_show_penalty_percent),
          autoConfirmAppointments: data.auto_confirm_appointments,
          allowNightBookings: data.allow_night_bookings,
        };

        await AsyncStorage.setItem(scopedKey, JSON.stringify(mapped));
        return mapped;
      }
    }
  }

  const raw = await AsyncStorage.getItem(scopedKey);
  const parsed = parsePolicies(raw);
  if (parsed) {
    return parsed;
  }
  // Si no hay datos en Supabase ni en cache, retorna vacío
  return null;
};

export const saveOwnerPolicies = async (policies: OwnerPolicies) => {
  const scope = await resolveStorageScope();
  const scopedKey = buildScopedStorageKey(OWNER_POLICIES_KEY, scope);

  if (isSupabaseConfigured) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;

    if (userId) {
      await supabase.from("owner_policies").upsert({
        owner_id: userId,
        free_cancellation_hours: Number(policies.freeCancellationHours) || 0,
        no_show_penalty_percent: Number(policies.noShowPenalty) || 0,
        auto_confirm_appointments: policies.autoConfirmAppointments,
        allow_night_bookings: policies.allowNightBookings,
      });
    }
  }

  await AsyncStorage.setItem(scopedKey, JSON.stringify(policies));
};
