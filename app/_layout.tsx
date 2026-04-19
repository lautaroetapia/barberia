import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import {
    Stack,
    useRootNavigationState,
    useRouter,
    useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import { Skeleton } from "@/components/ui/skeleton";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getRoleHomeRoute, getStoredActiveRole } from "@/lib/active-role";
import { getRoleVisibilityForCurrentUser } from "@/lib/role-visibility";
import { supabase } from "@/lib/supabase";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        setSession(data.session);
        setIsLoadingSession(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setSession(null);
        setIsLoadingSession(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoadingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!navigationState?.key || isLoadingSession) {
      return;
    }

    const topSegment = segments[0];
    const inAuth = topSegment === "auth";
    const inOnboarding = topSegment === "onboarding";
    const inTabs = topSegment === "(tabs)";
    const inModal = topSegment === "modal";
    const inBarber = topSegment === "barber";
    const inIndex = topSegment === "index";
    const isPublicRoute = inAuth || inOnboarding || inIndex;
    const isProtectedRoute = inTabs || inModal || inBarber;

    if (!session && isProtectedRoute) {
      router.replace("/auth/login");
      return;
    }

    if (session && isPublicRoute) {
      let isCancelled = false;

      const resolveHome = async () => {
        const [storedRole, visibility] = await Promise.all([
          getStoredActiveRole(),
          getRoleVisibilityForCurrentUser(),
        ]);
        if (isCancelled) {
          return;
        }

        let nextRole: "cliente" | "barbero" | "dueno" = "cliente";

        if (storedRole === "dueno" && visibility.hasOwnerRole) {
          nextRole = "dueno";
        } else if (storedRole === "barbero" && visibility.hasBarberRole) {
          nextRole = "barbero";
        }

        router.replace(getRoleHomeRoute(nextRole));
      };

      void resolveHome();

      return () => {
        isCancelled = true;
      };
    }
  }, [isLoadingSession, navigationState?.key, router, segments, session]);

  if (isLoadingSession) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={styles.loadingScreen}>
          <Text style={styles.loadingBrand}>NAVAJA DORADA</Text>
          <Skeleton style={styles.loadingSubline} borderRadius={6} />

          <View style={styles.loadingCard}>
            <Skeleton style={styles.loadingCardTitle} />
            <Skeleton style={styles.loadingCardLine} />
            <Skeleton style={styles.loadingCardLineShort} />
            <View style={styles.loadingActions}>
              <Skeleton style={styles.loadingAction} />
              <Skeleton style={styles.loadingAction} />
            </View>
          </View>

          <Text style={styles.loadingText}>Preparando tu experiencia...</Text>
        </View>
        <StatusBar style="light" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: "#0e0e0e" } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="barber" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 24,
  },
  loadingBrand: {
    color: "#d4af37",
    fontSize: 24,
    letterSpacing: 3,
    fontWeight: "800",
  },
  loadingSubline: {
    width: 182,
    height: 14,
    marginBottom: 8,
  },
  loadingCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 16,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.28)",
    padding: 16,
    gap: 10,
  },
  loadingCardTitle: {
    width: "58%",
    height: 24,
  },
  loadingCardLine: {
    width: "82%",
    height: 12,
  },
  loadingCardLineShort: {
    width: "48%",
    height: 12,
  },
  loadingActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  loadingAction: {
    flex: 1,
    height: 40,
    borderRadius: 10,
  },
  loadingText: {
    color: "#d0c5af",
    fontSize: 14,
    letterSpacing: 0.4,
  },
});
