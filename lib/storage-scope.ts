import type { User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

const normalizeScope = (user: User | null) => {
  const userId = user?.id?.trim();
  if (userId) {
    return `uid:${userId}`;
  }

  const email = user?.email?.trim().toLowerCase();
  if (email) {
    return `email:${email}`;
  }

  return "guest";
};

export const resolveStorageScope = async (user?: User | null) => {
  if (typeof user !== "undefined") {
    return normalizeScope(user);
  }

  const { data } = await supabase.auth.getUser();
  return normalizeScope(data.user ?? null);
};

export const buildScopedStorageKey = (baseKey: string, scope: string) => {
  return `${baseKey}:${scope}`;
};
