import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
      if (!isMounted) return;
      setFreeCancellationHours(policies.freeCancellationHours);
      setNoShowPenalty(policies.noShowPenalty);
      setAutoConfirmAppointments(policies.autoConfirmAppointments);
      setAllowNightBookings(policies.allowNightBookings);
      setIsLoading(false);
    };
    void loadPolicies();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    if (!Number(freeCancellationHours) && freeCancellationHours !== "0") {
      setToast({ visible: true, type: "error", message: "Ingresa un número de horas válido." });
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
      setToast({ visible: true, type: "success", message: "Políticas actualizadas correctamente" });
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={26} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Políticas de Reserva</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color="#d4af37" style={{ marginTop: 20 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Cancelaciones y Penalizaciones</Text>
            
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="clock" size={18} color="#d4af37" />
                <Text style={styles.label}>Cancelación gratuita</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={freeCancellationHours}
                  onChangeText={setFreeCancellationHours}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#444"
                />
                <Text style={styles.inputSuffix}>Horas antes</Text>
              </View>
              <Text style={styles.labelHint}>Tiempo límite para cancelar sin que se apliquen cargos al cliente.</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="alert-circle" size={18} color="#d4af37" />
                <Text style={styles.label}>Multa por No-Show</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  value={noShowPenalty}
                  onChangeText={setNoShowPenalty}
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#444"
                />
                <Text style={styles.inputSuffix}>% del servicio</Text>
              </View>
              <Text style={styles.labelHint}>Porcentaje sugerido a cobrar si el cliente no se presenta.</Text>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Automatización y Horarios</Text>

            <View style={styles.cardRow}>
              <View style={styles.cardRowText}>
                <Text style={styles.labelTitle}>Auto-confirmación</Text>
                <Text style={styles.labelHint}>Acepta turnos sin intervención manual.</Text>
              </View>
              <Switch
                value={autoConfirmAppointments}
                onValueChange={setAutoConfirmAppointments}
                trackColor={{ true: "#d4af37", false: "#2a2a2a" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.cardRow}>
              <View style={styles.cardRowText}>
                <Text style={styles.labelTitle}>Reservas Nocturnas</Text>
                <Text style={styles.labelHint}>Permite turnos fuera del horario estándar.</Text>
              </View>
              <Switch
                value={allowNightBookings}
                onValueChange={setAllowNightBookings}
                trackColor={{ true: "#d4af37", false: "#2a2a2a" }}
                thumbColor="#fff"
              />
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <ActivityIndicator color="#1a1a1a" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Actualizar Políticas</Text>
          )}
        </Pressable>
      </View>

      <BarberRoleNav mode="owner" current="mas" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0c0c0c" },
  topBar: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0c0c0c",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 220,
  },
  sectionTitle: {
    color: "#d4af37",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#151515",
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  label: { color: "#eee", fontSize: 14, fontWeight: "700" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0c0c0c",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: "#d4af37",
    fontSize: 18,
    fontWeight: "700",
  },
  inputSuffix: { color: "#666", fontSize: 13, fontWeight: "600" },
  labelHint: { color: "#777", fontSize: 12, lineHeight: 18 },
  
  cardRow: {
    borderRadius: 20,
    backgroundColor: "#151515",
    padding: 16,
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardRowText: { flex: 1, paddingRight: 10 },
  labelTitle: { color: "#eee", fontSize: 15, fontWeight: "700" },

  footer: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(12,12,12,0.9)",
  },
  saveButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: "#000", fontSize: 16, fontWeight: "800" },
});