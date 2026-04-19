import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

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
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const validateAccess = async () => {
      const currentRoute = segments[1] ?? "";
      if (!currentRoute) {
        if (isMounted) {
          setIsCheckingAccess(false);
        }
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

      if (isMounted) {
        setIsCheckingAccess(false);
      }
    };

    setIsCheckingAccess(true);
    void validateAccess();

    return () => {
      isMounted = false;
    };
  }, [router, segments]);

  if (isCheckingAccess) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#d4af37" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#131313" },
      }}
    />
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#131313",
    alignItems: "center",
    justifyContent: "center",
  },
});
