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
import "react-native-reanimated";

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
        try {
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
        } catch {
          if (!isCancelled) {
            router.replace("/(tabs)");
          }
        }
      };

      void resolveHome();

      return () => {
        isCancelled = true;
      };
    }
  }, [isLoadingSession, navigationState?.key, router, segments, session]);

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
