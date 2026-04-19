import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import { getOwnerPolicies, saveOwnerPolicies } from "@/lib/owner-policies";

export default function OwnerPoliciesScreen() {
  const [freeCancellationHours, setFreeCancellationHours] = useState("12");
  const [noShowPenalty, setNoShowPenalty] = useState("20");
  const [autoConfirmAppointments, setAutoConfirmAppointments] = useState(true);
  const [allowNightBookings, setAllowNightBookings] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  useEffect(() => {
    let isMounted = true;

    const loadPolicies = async () => {
      const policies = await getOwnerPolicies();
      if (!isMounted) {
        return;
      }

      setFreeCancellationHours(policies.freeCancellationHours);
      setNoShowPenalty(policies.noShowPenalty);
      setAutoConfirmAppointments(policies.autoConfirmAppointments);
      setAllowNightBookings(policies.allowNightBookings);
      setIsLoading(false);
    };

    void loadPolicies();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!Number(freeCancellationHours) || !Number(noShowPenalty)) {
      setToast({
        visible: true,
        type: "error",
        message: "Las horas y penalizacion deben ser numericas.",
      });
      return;
    }

    setIsSaving(true);

    try {
      await saveOwnerPolicies({
        freeCancellationHours,
        noShowPenalty,
        autoConfirmAppointments,
        allowNightBookings,
      });
      setToast({
        visible: true,
        type: "success",
        message: "Politicas guardadas",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.replace("/barber/owner-more-settings")}
        >
          <MaterialIcons name="arrow-back" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Politicas</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <Text style={styles.loadingText}>Cargando politicas...</Text>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.label}>Horas de cancelacion sin costo</Text>
          <TextInput
            value={freeCancellationHours}
            onChangeText={setFreeCancellationHours}
            style={styles.input}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Penalizacion por no show (%)</Text>
          <TextInput
            value={noShowPenalty}
            onChangeText={setNoShowPenalty}
            style={styles.input}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.cardRow}>
          <View style={styles.cardRowText}>
            <Text style={styles.labelTitle}>Confirmacion automatica</Text>
            <Text style={styles.labelHint}>
              Confirma turnos nuevos automaticamente
            </Text>
          </View>
          <Switch
            value={autoConfirmAppointments}
            onValueChange={setAutoConfirmAppointments}
            trackColor={{ true: "#d4af37", false: "#4d4635" }}
            thumbColor="#fff"
          />
        </View>

        <View style={styles.cardRow}>
          <View style={styles.cardRowText}>
            <Text style={styles.labelTitle}>Permitir turnos nocturnos</Text>
            <Text style={styles.labelHint}>
              Habilita reservas en franja noche
            </Text>
          </View>
          <Switch
            value={allowNightBookings}
            onValueChange={setAllowNightBookings}
            trackColor={{ true: "#d4af37", false: "#4d4635" }}
            thumbColor="#fff"
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={() => {
            void handleSave();
          }}
          disabled={isSaving || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Guardando..." : "Guardar politicas"}
          </Text>
        </Pressable>
      </View>

      <BarberRoleNav mode="owner" current="mas" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  topBar: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(19,19,19,0.92)",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "#d4af37",
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 180,
    gap: 12,
  },
  loadingText: { color: "#99907c", fontSize: 12, textAlign: "center" },
  card: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    gap: 8,
  },
  label: {
    color: "#d0c5af",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  input: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    color: "#e5e2e1",
    paddingHorizontal: 12,
  },
  cardRow: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardRowText: { flex: 1 },
  labelTitle: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  labelHint: { color: "#99907c", fontSize: 12, marginTop: 2 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 74,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: "rgba(14,14,14,0.96)",
  },
  saveButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: {
    color: "#241a00",
    fontSize: 15,
    fontWeight: "800",
  },
});
