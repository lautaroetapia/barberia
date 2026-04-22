import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from "react-native";

import { getStoredActiveRole } from "@/lib/active-role";
import {
  buildScopedStorageKey,
  resolveStorageScope,
} from "@/lib/storage-scope";
import { supabase } from "@/lib/supabase";

// ... (Tipos y funciones de parseo se mantienen iguales)

export default function DiagnosticsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [state, setState] = useState<DiagnosticsState | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // ... (Lógica de obtención de datos se mantiene igual)
      // (Asumiendo que la lógica de negocio no cambia, solo el UI)
      // Mantenemos tu lógica original aquí...
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const StatusIcon = ({ active }: { active: boolean }) => (
    <MaterialIcons
      name={active ? "check-circle" : "cancel"}
      size={16}
      color={active ? "#4CAF50" : "#F44336"}
    />
  );

  const DataRow = ({ label, value, isStatus }: { label: string, value: any, isStatus?: boolean }) => (
    <View style={styles.dataRow}>
      <Text style={styles.label}>{label}:</Text>
      <View style={styles.valueContainer}>
        {isStatus && <StatusIcon active={Boolean(value)} />}
        <Text style={[styles.value, isStatus && { marginLeft: 6 }]}>
          {typeof value === "boolean" ? (value ? "TRUE" : "FALSE") : value}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color="#d0c5af" />
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>System Diagnostics</Text>
          <Text style={styles.subtitle}>Estado interno del motor</Text>
        </View>
        <Pressable 
          style={[styles.refreshButton, isLoading && { opacity: 0.5 }]} 
          onPress={() => !isLoading && void refresh()}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#241a00" />
          ) : (
            <MaterialIcons name="refresh" size={20} color="#241a00" />
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!isLoading && state ? (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="account-circle" size={18} color="#f2ca50" />
                <Text style={styles.sectionTitle}>Sesión de Usuario</Text>
              </View>
              <View style={styles.card}>
                <DataRow label="User ID" value={state.userId} />
                <DataRow label="Email" value={state.email} />
                <DataRow label="Scope" value={state.scope} />
                <DataRow label="Active Role" value={state.activeRole} />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="admin-panel-settings" size={18} color="#f2ca50" />
                <Text style={styles.sectionTitle}>Roles Calculados</Text>
              </View>
              <View style={styles.card}>
                <DataRow label="Has Owner Role" value={state.hasOwnerRole} isStatus />
                <DataRow label="Has Barber Role" value={state.hasBarberRole} isStatus />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="storage" size={18} color="#f2ca50" />
                <Text style={styles.sectionTitle}>Storage Scoped ({state.scope})</Text>
              </View>
              <View style={styles.card}>
                <DataRow label="Profile" value={state.hasScopedBarbershopProfile} isStatus />
                <DataRow label="Barbers" value={state.scopedBarbersCount} />
                <DataRow label="Requests" value={state.scopedRequestsCount} />
                <DataRow label="Invitation" value={state.hasScopedInvitation} isStatus />
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="history" size={18} color="#f2ca50" />
                <Text style={styles.sectionTitle}>Storage Legacy (Global)</Text>
              </View>
              <View style={styles.card}>
                <DataRow label="Profile" value={state.hasLegacyBarbershopProfile} isStatus />
                <DataRow label="Barbers" value={state.legacyBarbersCount} />
                <DataRow label="Requests" value={state.legacyRequestsCount} />
                <DataRow label="Invitation" value={state.hasLegacyInvitation} isStatus />
              </View>
            </View>
          </>
        ) : (
          isLoading && (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="large" color="#d4af37" />
              <Text style={styles.loadingText}>Analizando base de datos...</Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0F0F0F",
  },
  header: {
    paddingTop: 10,
    height: 80,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1C1B1B",
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: "#d4af37",
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  subtitle: {
    color: "#666",
    fontSize: 11,
    fontWeight: "600",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1C1B1B",
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
  },
  sectionTitle: {
    color: "#f2ca50",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "#161616",
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    gap: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#555",
    fontSize: 12,
    fontWeight: "700",
  },
  valueContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  value: {
    color: "#d0c5af",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "right",
  },
  loadingWrapper: {
    marginTop: 100,
    alignItems: "center",
    gap: 15,
  },
  loadingText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
});