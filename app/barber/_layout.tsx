import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { getRoleVisibilityForCurrentUser } from "@/lib/role-visibility";

const OWNER_ROUTES = new Set([
  "dashboard-owner",
  "owner-agenda",
  "barbers-management",
  "edit-service",
  "invitation-code",
  "owner-more-settings",
  "owner-barbershop-profile",
  "owner-policies",
  "owner-reports",
  "owner-shifts",
  "owner-support",
]);

const BARBER_ROUTES = new Set([
  "barber-my-agenda",
  "barber-history",
  "clients-management",
  "barber-profile",
]);

export default function BarberLayout() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    let isMounted = true;

    const validateAccess = async () => {
      try {
        const currentRoute = segments[1] ?? "";
        if (!currentRoute) {
          return;
        }

        const visibility = await getRoleVisibilityForCurrentUser();

        if (OWNER_ROUTES.has(currentRoute) && !visibility.hasOwnerRole) {
          router.replace("/(tabs)/profile");
          return;
        }

        if (BARBER_ROUTES.has(currentRoute) && !visibility.hasBarberRole) {
          router.replace("/(tabs)/profile");
          return;
        }
      } catch {
        router.replace("/(tabs)");
        return;
      }
    };

    void validateAccess();

    return () => {
      isMounted = false;
    };
  }, [router, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#131313" },
      }}
    />
  );
}
