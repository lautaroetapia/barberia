import type { User } from "@supabase/supabase-js";

import { getOwnedBarbershopProfile } from "@/lib/owned-barbershop";
import { getOwnerBarbers } from "@/lib/owner-barbers";
import { supabase } from "@/lib/supabase";

export type RoleVisibility = {
  hasBarberRole: boolean;
  hasOwnerRole: boolean;
};

const resolveVisibility = async (
  user: User | null,
): Promise<RoleVisibility> => {
  const [ownedBarbershopProfile, ownerBarbers] = await Promise.all([
    getOwnedBarbershopProfile(user),
    getOwnerBarbers(user),
  ]);

  const userEmail = user?.email?.toLowerCase() ?? "";
  const userId = user?.id ?? "";

  const hasOwnerRole = Boolean(ownedBarbershopProfile?.name?.trim());

  const hasBarberLinked = ownerBarbers.some((barber) => {
    const byUserId = Boolean(userId) && barber.accountUserId === userId;
    const byEmail =
      Boolean(userEmail) && barber.accountEmail?.toLowerCase() === userEmail;
    return byUserId || byEmail;
  });

  const hasBarberRole = hasBarberLinked;

  return { hasBarberRole, hasOwnerRole };
};

export const getRoleVisibilityForUser = async (user: User | null) => {
  return resolveVisibility(user);
};

export const getRoleVisibilityForCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return resolveVisibility(data.user ?? null);
};
