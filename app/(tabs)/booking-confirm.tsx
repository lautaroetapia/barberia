import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    APPOINTMENT_SLOT_MINUTES,
    createAppointment,
    formatPrice,
    getReservedDurationMinutes,
    getShopBarberById,
    getShopServiceById,
} from "@/lib/booking-catalog";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function BookingConfirmScreen() {
  const params = useLocalSearchParams<{
    appointmentId?: string;
    isReschedule?: string;
    shopId?: string;
    shopName?: string;
    serviceId?: string;
    barberId?: string;
    resolvedBarberId?: string;
    dateLabel?: string;
    dateIso?: string;
    time?: string;
    serviceName?: string;
    serviceDuration?: string;
  }>();

  const appointmentId = pickFirst(params.appointmentId);
  const isReschedule = pickFirst(params.isReschedule) === "1";
  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const serviceId = pickFirst(params.serviceId) ?? "service-haircut";
  const barberId =
    pickFirst(params.resolvedBarberId) ??
    pickFirst(params.barberId) ??
    "barber-any";
  const dateLabel = pickFirst(params.dateLabel) ?? "Martes 16 de Octubre";
  const time = pickFirst(params.time) ?? "16:30";
  const dateIso = pickFirst(params.dateIso) ?? new Date().toISOString();
  const serviceName = pickFirst(params.serviceName) ?? "Servicio";
  const serviceDuration = Number(pickFirst(params.serviceDuration) ?? "45");

  const [service, setService] = useState<{
    name: string;
    price: number;
    durationMinutes: number;
  }>({
    name: serviceName,
    price: 0,
    durationMinutes: serviceDuration,
  });
  const [barberName, setBarberName] = useState("Cualquier profesional");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [note, setNote] = useState("");
  const [reminder, setReminder] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      const [serviceData, barberData] = await Promise.all([
        getShopServiceById(shopId, serviceId),
        barberId && barberId !== "barber-any"
          ? getShopBarberById(shopId, barberId)
          : Promise.resolve(null),
      ]);

      if (!isMounted) {
        return;
      }

      if (serviceData) {
        setService(serviceData);
      }

      setBarberName(
        barberData?.name ??
          (barberId === "barber-any" ? "Cualquier profesional" : "Barbero"),
      );
      setIsLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [barberId, serviceId, shopId]);

  const startDateTime = useMemo(() => {
    const selectedDate = new Date(dateIso);
    const [hoursRaw, minutesRaw] = time.split(":");
    selectedDate.setHours(Number(hoursRaw ?? 0), Number(minutesRaw ?? 0), 0, 0);
    return selectedDate;
  }, [dateIso, time]);

  const endDateTime = useMemo(() => {
    const reservedDurationMinutes = getReservedDurationMinutes(
      service.durationMinutes || serviceDuration,
    );
    const next = new Date(startDateTime);
    next.setMinutes(next.getMinutes() + reservedDurationMinutes);
    return next;
  }, [service.durationMinutes, serviceDuration, startDateTime]);

  const reservedSlots = useMemo(
    () =>
      getReservedDurationMinutes(service.durationMinutes || serviceDuration) /
      APPOINTMENT_SLOT_MINUTES,
    [service.durationMinutes, serviceDuration],
  );

  const confirm = async () => {
    setIsSaving(true);

    try {
      const appointmentIdResult = await createAppointment({
        shopId,
        barberId,
        serviceId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: note,
      });

      router.replace({
        pathname: "/(tabs)/booking-success",
        params: {
          appointmentId: appointmentIdResult ?? appointmentId,
          isReschedule: isReschedule ? "1" : "0",
          shopId,
          shopName,
          serviceId,
          serviceName: service.name,
          servicePrice: String(service.price),
          barberId,
          barberName,
          resolvedBarberId: barberId,
          dateLabel,
          dateIso,
          time,
          reminder: reminder ? "1" : "0",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo confirmar el turno. Intenta nuevamente.";
      Alert.alert("No se pudo confirmar", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons
              name="keyboard-backspace"
              size={26}
              color="#D4AF37"
            />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Verificación</Text>
            <Text style={styles.subtitle}>Casi hemos terminado</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <View
                key={step}
                style={[
                  styles.progressStep,
                  step < 5 && styles.progressDone,
                  step === 5 && styles.progressActive,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Resumen del Turno</Text>

          <View style={styles.ticketCard}>
            <LinearGradient
              colors={["#1C1C1C", "#141414"]}
              style={styles.ticketGradient}
            >
              <View style={styles.summaryRow}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="content-cut" size={20} color="#D4AF37" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Servicio</Text>
                  <Text style={styles.value}>{service.name}</Text>
                </View>
                <Text style={styles.priceHighlight}>
                  {formatPrice(service.price)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="person" size={20} color="#D4AF37" />
                </View>
                <View>
                  <Text style={styles.label}>Barbero</Text>
                  <Text style={styles.value}>{barberName}</Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.iconCircle}>
                  <MaterialIcons
                    name="event-available"
                    size={20}
                    color="#D4AF37"
                  />
                </View>
                <View>
                  <Text style={styles.label}>Cuándo</Text>
                  <Text style={styles.value}>
                    {dateLabel} • {time} hs
                  </Text>
                  <Text style={styles.metaValue}>
                    {`Reserva: ${reservedSlots} turnos de ${APPOINTMENT_SLOT_MINUTES} min (${reservedSlots * APPOINTMENT_SLOT_MINUTES} min)`}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View style={styles.iconCircle}>
                  <MaterialIcons name="location-on" size={20} color="#D4AF37" />
                </View>
                <View>
                  <Text style={styles.label}>Dónde</Text>
                  <Text style={styles.value}>{shopName}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputTitle}>Preferencias Adicionales</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ej: Solo rebajado a los costados, café sin azúcar..."
              placeholderTextColor="#444"
              multiline
              numberOfLines={3}
              style={styles.textArea}
            />
          </View>

          <Pressable
            style={styles.reminderRow}
            onPress={() => setReminder((v) => !v)}
          >
            <View style={[styles.checkbox, reminder && styles.checkboxActive]}>
              {reminder && (
                <MaterialIcons name="check" size={16} color="#000" />
              )}
            </View>
            <Text style={styles.reminderText}>
              Activar recordatorio vía notificación
            </Text>
          </Pressable>

          <View style={styles.policyBox}>
            <MaterialIcons name="info-outline" size={16} color="#666" />
            <Text style={styles.policyText}>
              Podrás cancelar o reprogramar sin cargo hasta 24 horas antes de tu
              cita.
            </Text>
          </View>
        </ScrollView>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Pressable style={styles.confirmButton} onPress={confirm}>
            {isSaving ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirmar Reserva</Text>
                <MaterialIcons name="verified" size={20} color="#000" />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerCenter: { alignItems: "center" },
  backButton: { width: 44, height: 44, justifyContent: "center" },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subtitle: { color: "#666", fontSize: 11, fontWeight: "600", marginTop: 2 },
  headerSpacer: { width: 44 },

  progressSection: { paddingHorizontal: 25, marginTop: 10, marginBottom: 20 },
  progressContainer: { flexDirection: "row", gap: 6, width: "100%" },
  progressStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#222",
  },
  progressDone: { backgroundColor: "rgba(212, 175, 55, 0.4)" },
  progressActive: { backgroundColor: "#D4AF37" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 140 },
  sectionTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 20,
  },

  ticketCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1A1A1A",
    marginBottom: 30,
  },
  ticketGradient: { padding: 20, gap: 18 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#555",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: { color: "#FFF", fontSize: 15, fontWeight: "700", marginTop: 2 },
  metaValue: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  priceHighlight: { color: "#D4AF37", fontSize: 22, fontWeight: "900" },
  divider: { height: 1, backgroundColor: "#222", marginVertical: 4 },

  inputSection: { marginBottom: 25 },
  inputTitle: {
    color: "#BBB",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
    paddingLeft: 5,
  },
  textArea: {
    backgroundColor: "#111",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
    padding: 15,
    color: "#FFF",
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
  },

  reminderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 25,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: { backgroundColor: "#D4AF37", borderColor: "#D4AF37" },
  reminderText: { color: "#BBB", fontSize: 14, fontWeight: "600" },

  policyBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  policyText: { color: "#666", fontSize: 12, flex: 1, lineHeight: 18 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "#0A0A0A",
    borderTopWidth: 1,
    borderColor: "#1A1A1A",
  },
  confirmButton: {
    height: 64,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  confirmButtonText: { color: "#000", fontSize: 18, fontWeight: "900" },
});
