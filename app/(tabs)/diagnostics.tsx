import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getStoredActiveRole } from "@/lib/active-role";
import {
    buildScopedStorageKey,
    resolveStorageScope,
} from "@/lib/storage-scope";
import { supabase } from "@/lib/supabase";

type DiagnosticsState = {
  userId: string;
  email: string;
  scope: string;
  activeRole: string;
  hasOwnerRole: boolean;
  hasBarberRole: boolean;
  hasScopedBarbershopProfile: boolean;
  hasLegacyBarbershopProfile: boolean;
  scopedBarbersCount: number;
  legacyBarbersCount: number;
  scopedRequestsCount: number;
  legacyRequestsCount: number;
  hasScopedInvitation: boolean;
  hasLegacyInvitation: boolean;
};

const BARBERSHOP_KEY = "owned_barbershop_profile";
const OWNER_BARBERS_KEY = "owner_barbers";
const OWNER_REQUESTS_KEY = "owner_barber_requests";
const OWNER_INVITATION_KEY = "owner_invitation_code";

const parseCountArray = (raw: string | null) => {
  if (!raw) {
    return 0;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
};

const parseHasOwner = (raw: string | null) => {
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw) as { name?: unknown };
    return typeof parsed.name === "string" && parsed.name.trim().length > 0;
  } catch {
    return false;
  }
};

const parseHasBarberForUser = (
  raw: string | null,
  userId: string,
  email: string,
) => {
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw) as Array<{
      accountUserId?: string;
      accountEmail?: string;
    }>;

    if (!Array.isArray(parsed)) {
      return false;
    }

    const normalizedEmail = email.trim().toLowerCase();

    return parsed.some((item) => {
      const byUserId = Boolean(userId) && item.accountUserId === userId;
      const byEmail =
        Boolean(normalizedEmail) &&
        item.accountEmail?.toLowerCase() === normalizedEmail;
      return byUserId || byEmail;
    });
  } catch {
    return false;
  }
};

export default function DiagnosticsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<DiagnosticsState | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user ?? null;

      const userId = user?.id ?? "";
      const email = user?.email ?? "";
      const scope = await resolveStorageScope(user);
      const activeRole = (await getStoredActiveRole()) ?? "null";

      const scopedBarbershopKey = buildScopedStorageKey(BARBERSHOP_KEY, scope);
      const scopedBarbersKey = buildScopedStorageKey(OWNER_BARBERS_KEY, scope);
      const scopedRequestsKey = buildScopedStorageKey(
        OWNER_REQUESTS_KEY,
        scope,
      );
      const scopedInvitationKey = buildScopedStorageKey(
        OWNER_INVITATION_KEY,
        scope,
      );

      const [
        rawScopedBarbershop,
        rawLegacyBarbershop,
        rawScopedBarbers,
        rawLegacyBarbers,
        rawScopedRequests,
        rawLegacyRequests,
        rawScopedInvitation,
        rawLegacyInvitation,
      ] = await Promise.all([
        AsyncStorage.getItem(scopedBarbershopKey),
        AsyncStorage.getItem(BARBERSHOP_KEY),
        AsyncStorage.getItem(scopedBarbersKey),
        AsyncStorage.getItem(OWNER_BARBERS_KEY),
        AsyncStorage.getItem(scopedRequestsKey),
        AsyncStorage.getItem(OWNER_REQUESTS_KEY),
        AsyncStorage.getItem(scopedInvitationKey),
        AsyncStorage.getItem(OWNER_INVITATION_KEY),
      ]);

      const hasOwnerRole = parseHasOwner(rawScopedBarbershop);
      const hasBarberRole = parseHasBarberForUser(
        rawScopedBarbers,
        userId,
        email,
      );

      setState({
        userId: userId || "(sin usuario)",
        email: email || "(sin email)",
        scope,
        activeRole,
        hasOwnerRole,
        hasBarberRole,
        hasScopedBarbershopProfile: Boolean(rawScopedBarbershop),
        hasLegacyBarbershopProfile: Boolean(rawLegacyBarbershop),
        scopedBarbersCount: parseCountArray(rawScopedBarbers),
        legacyBarbersCount: parseCountArray(rawLegacyBarbers),
        scopedRequestsCount: parseCountArray(rawScopedRequests),
        legacyRequestsCount: parseCountArray(rawLegacyRequests),
        hasScopedInvitation: Boolean(rawScopedInvitation),
        hasLegacyInvitation: Boolean(rawLegacyInvitation),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
        <Text style={styles.title}>Diagnostico</Text>
        <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
          <Text style={styles.refreshButtonText}>Actualizar</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#d4af37" />
            <Text style={styles.loadingText}>Revisando estado...</Text>
          </View>
        ) : null}

        {!isLoading && state ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sesion</Text>
              <Text style={styles.item}>userId: {state.userId}</Text>
              <Text style={styles.item}>email: {state.email}</Text>
              <Text style={styles.item}>scope: {state.scope}</Text>
              <Text style={styles.item}>active_role: {state.activeRole}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Roles calculados</Text>
              <Text style={styles.item}>
                hasOwnerRole: {state.hasOwnerRole ? "true" : "false"}
              </Text>
              <Text style={styles.item}>
                hasBarberRole: {state.hasBarberRole ? "true" : "false"}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Storage scopeado</Text>
              <Text style={styles.item}>
                owned_barbershop_profile(scope):{" "}
                {state.hasScopedBarbershopProfile ? "existe" : "vacio"}
              </Text>
              <Text style={styles.item}>
                owner_barbers(scope): {state.scopedBarbersCount}
              </Text>
              <Text style={styles.item}>
                owner_barber_requests(scope): {state.scopedRequestsCount}
              </Text>
              <Text style={styles.item}>
                owner_invitation_code(scope):{" "}
                {state.hasScopedInvitation ? "existe" : "vacio"}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Storage legacy</Text>
              <Text style={styles.item}>
                owned_barbershop_profile:{" "}
                {state.hasLegacyBarbershopProfile ? "existe" : "vacio"}
              </Text>
              <Text style={styles.item}>
                owner_barbers: {state.legacyBarbersCount}
              </Text>
              <Text style={styles.item}>
                owner_barber_requests: {state.legacyRequestsCount}
              </Text>
              <Text style={styles.item}>
                owner_invitation_code:{" "}
                {state.hasLegacyInvitation ? "existe" : "vacio"}
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
  },
  header: {
    height: 72,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    minWidth: 74,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    color: "#d0c5af",
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    color: "#d4af37",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  refreshButton: {
    minWidth: 90,
    minHeight: 36,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    color: "#241a00",
    fontSize: 12,
    fontWeight: "800",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  loadingCard: {
    minHeight: 84,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    color: "#d0c5af",
    fontSize: 12,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    gap: 8,
  },
  cardTitle: {
    color: "#f2ca50",
    fontSize: 15,
    fontWeight: "800",
  },
  item: {
    color: "#d0c5af",
    fontSize: 12,
    lineHeight: 18,
  },
});
