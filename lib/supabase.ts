import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

import { SUPABASE_FALLBACK } from "@/constants/app-config";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const isWeb = Platform.OS === "web";
const isBrowser = typeof window !== "undefined";

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase no configurado. Define EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en tu entorno.",
  );
}

export const supabase = createClient(
  supabaseUrl ?? SUPABASE_FALLBACK.URL,
  supabaseAnonKey ?? SUPABASE_FALLBACK.ANON_KEY,
  {
    auth: {
      ...(isWeb ? {} : { storage: AsyncStorage }),
      autoRefreshToken: isBrowser,
      persistSession: isBrowser,
      detectSessionInUrl: false,
    },
  },
);
