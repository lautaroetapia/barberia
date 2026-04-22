import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  buildBookingTimeSlots,
  getShopBarberById,
  getShopServiceById,
} from "@/lib/booking-catalog";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

type TimeShift = "morning" | "afternoon" | "night";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BookingTimeScreen() {
  const params = useLocalSearchParams<{
    appointmentId?: string;
    isReschedule?: string;
    shopId?: string;
    shopName?: string;
    serviceId?: string;
    serviceName?: string;
    serviceDuration?: string;
    barberId?: string;
  }>();

  const appointmentId = pickFirst(params.appointmentId);
  const isReschedule = pickFirst(params.isReschedule) === "1";
  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const barberId = pickFirst(params.barberId) ?? "barber-any";
  const serviceId = pickFirst(params.serviceId) ?? "service-haircut";
  const serviceName = pickFirst(params.serviceName) ?? "Servicio";
  const serviceDuration = Number(pickFirst(params.serviceDuration) ?? "45");
  const [dayOffset, setDayOffset] = useState(0);
  const [activeShift, setActiveShift] = useState<TimeShift>("morning");

  const selectedDate = useMemo(() => {
    const next = new Date();
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + dayOffset);
    return next;
  }, [dayOffset]);

  const selectedDateKey = useMemo(
    () => formatDateKey(selectedDate),
    [selectedDate],
  );

  const [dateLabel, setDateLabel] = useState("Cargando disponibilidad...");
  const [dateIso, setDateIso] = useState("");
  const [morningSlots, setMorningSlots] = useState(
    [] as {
      id: string;
      time: string;
      label?: string;
      disabled?: boolean;
    }[],
  );
  const [afternoonSlots, setAfternoonSlots] = useState(
    [] as {
      id: string;
      time: string;
      label?: string;
      disabled?: boolean;
    }[],
  );
  const [nightSlots, setNightSlots] = useState(
    [] as {
      id: string;
      time: string;
      label?: string;
      disabled?: boolean;
    }[],
  );
  const [enabledShifts, setEnabledShifts] = useState({
    morning: true,
    afternoon: true,
    night: true,
  });
  const [barberName, setBarberName] = useState("Cualquier profesional");
  const [resolvedBarberId, setResolvedBarberId] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [autoSearchCount, setAutoSearchCount] = useState(0);

  const shiftAvailability = useMemo(() => {
    const morningAvailable =
      enabledShifts.morning && morningSlots.some((slot) => !slot.disabled);
    const afternoonAvailable =
      enabledShifts.afternoon && afternoonSlots.some((slot) => !slot.disabled);
    const nightAvailable =
      enabledShifts.night && nightSlots.some((slot) => !slot.disabled);

    return {
      morning: morningAvailable,
      afternoon: afternoonAvailable,
      night: nightAvailable,
    };
  }, [
    afternoonSlots,
    enabledShifts.afternoon,
    enabledShifts.morning,
    enabledShifts.night,
    morningSlots,
    nightSlots,
  ]);

  const firstAvailableShift = useMemo<TimeShift>(() => {
    if (shiftAvailability.morning) {
      return "morning";
    }
    if (shiftAvailability.afternoon) {
      return "afternoon";
    }
    if (shiftAvailability.night) {
      return "night";
    }
    return "morning";
  }, [shiftAvailability]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      const [service, barber, slots] = await Promise.all([
        serviceDuration
          ? Promise.resolve(null)
          : getShopServiceById(shopId, serviceId),
        barberId && barberId !== "barber-any"
          ? getShopBarberById(shopId, barberId)
          : Promise.resolve(null),
        buildBookingTimeSlots({
          shopId,
          barberId,
          serviceDurationMinutes:
            serviceDuration ||
            (await getShopServiceById(shopId, serviceId))?.durationMinutes ||
            45,
          selectedDateKey,
          selectedDateIso: selectedDate.toISOString(),
        }),
      ]);

      if (!isMounted) {
        return;
      }

      setDateLabel(slots.dateLabel);
      setDateIso(slots.dateIso);
      setMorningSlots(slots.morning);
      setAfternoonSlots(slots.afternoon);
      setNightSlots(slots.night);
      setEnabledShifts(slots.enabledShifts);
      const availableTimes = [
        ...slots.morning
          .filter((slot) => !slot.disabled)
          .map((slot) => slot.time),
        ...slots.afternoon
          .filter((slot) => !slot.disabled)
          .map((slot) => slot.time),
        ...slots.night
          .filter((slot) => !slot.disabled)
          .map((slot) => slot.time),
      ];
      setSelectedTime((current) => {
        if (current && availableTimes.includes(current)) {
          return current;
        }
        return availableTimes[0] ?? "";
      });
      setResolvedBarberId(slots.resolvedBarberId ?? barber?.id ?? barberId);
      setBarberName(
        barber?.name ??
          (barberId === "barber-any" ? "Cualquier profesional" : "Barbero"),
      );

      if (service?.name && !serviceName) {
        // no-op: route params take precedence, but the call ensures data exists in Supabase
      }

      setIsLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [
    barberId,
    selectedDate,
    selectedDateKey,
    serviceDuration,
    serviceId,
    serviceName,
    shopId,
  ]);

  const visibleSlots = useMemo(() => {
    if (activeShift === "morning") {
      return morningSlots;
    }
    if (activeShift === "afternoon") {
      return afternoonSlots;
    }
    return nightSlots;
  }, [activeShift, afternoonSlots, morningSlots, nightSlots]);

  const availableVisibleSlots = useMemo(
    () => visibleSlots.filter((slot) => !slot.disabled),
    [visibleSlots],
  );

  const hasAnyAvailableSlots = useMemo(
    () =>
      shiftAvailability.morning ||
      shiftAvailability.afternoon ||
      shiftAvailability.night,
    [shiftAvailability],
  );

  const hasSlots = useMemo(
    () => availableVisibleSlots.length > 0,
    [availableVisibleSlots.length],
  );

  useEffect(() => {
    setAutoSearchCount(0);
  }, [barberId, serviceDuration, serviceId, shopId]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!shiftAvailability[activeShift]) {
      setActiveShift(firstAvailableShift);
    }
  }, [activeShift, firstAvailableShift, isLoading, shiftAvailability]);

  useEffect(() => {
    if (isLoading || hasAnyAvailableSlots) {
      return;
    }

    if (autoSearchCount >= 14) {
      return;
    }

    setAutoSearchCount((current) => current + 1);
    setDayOffset((current) => current + 1);
  }, [autoSearchCount, hasAnyAvailableSlots, isLoading]);

  const goNext = () => {
    router.push({
      pathname: "/(tabs)/booking-confirm",
      params: {
        appointmentId,
        isReschedule: isReschedule ? "1" : "0",
        shopId,
        shopName,
        serviceId,
        barberId: resolvedBarberId || barberId,
        resolvedBarberId: resolvedBarberId || barberId,
        serviceName,
        serviceDuration: String(serviceDuration),
        dateLabel,
        dateIso,
        time: selectedTime,
      },
    });
  };

  const renderSlot = (slot: any) => {
    const isSelected = selectedTime === slot.time;
    return (
      <View key={slot.id} style={styles.slotContainer}>
        <Pressable
          style={[
            styles.slotButton,
            isSelected && styles.slotButtonActive,
            slot.disabled && styles.slotButtonDisabled,
          ]}
          onPress={() => !slot.disabled && setSelectedTime(slot.time)}
          disabled={slot.disabled}
        >
          <Text
            style={[
              styles.slotText,
              isSelected && styles.slotTextActive,
              slot.disabled && styles.slotTextDisabled,
            ]}
          >
            {slot.time}
          </Text>
        </Pressable>
        {isSelected && slot.label && (
          <Text style={styles.slotHint}>{slot.label}</Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-backspace" size={26} color="#D4AF37" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Horario</Text>
          <Text style={styles.subtitle}>
            {shopName} • {barberName}
          </Text>
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
                step < 4 && styles.progressDone,
                step === 4 && styles.progressActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepIndicatorText}>
          PASO 04 <Text style={{ color: "#444" }}>/ 06</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* DATE TICKET */}
        <View style={styles.dateTicket}>
          <Pressable
            style={[
              styles.dateNavButton,
              dayOffset <= 0 && styles.dateNavButtonDisabled,
            ]}
            onPress={() => setDayOffset((current) => Math.max(0, current - 1))}
            disabled={dayOffset <= 0}
          >
            <MaterialIcons name="chevron-left" size={22} color="#D4AF37" />
          </Pressable>
          <View>
            <Text style={styles.dateTitle}>Día Seleccionado</Text>
            <Text style={styles.dateValue}>{dateLabel}</Text>
          </View>
          <Pressable
            style={styles.dateNavButton}
            onPress={() => setDayOffset((current) => current + 1)}
          >
            <MaterialIcons name="chevron-right" size={22} color="#D4AF37" />
          </Pressable>
        </View>

        <View style={styles.shiftFilterRow}>
          <Pressable
            style={[
              styles.shiftFilterButton,
              activeShift === "morning" && styles.shiftFilterButtonActive,
              !shiftAvailability.morning && styles.shiftFilterButtonDisabled,
            ]}
            onPress={() => setActiveShift("morning")}
            disabled={!shiftAvailability.morning}
          >
            <Text
              style={[
                styles.shiftFilterText,
                activeShift === "morning" && styles.shiftFilterTextActive,
                !shiftAvailability.morning && styles.shiftFilterTextDisabled,
              ]}
            >
              Manana
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.shiftFilterButton,
              activeShift === "afternoon" && styles.shiftFilterButtonActive,
              !shiftAvailability.afternoon && styles.shiftFilterButtonDisabled,
            ]}
            onPress={() => setActiveShift("afternoon")}
            disabled={!shiftAvailability.afternoon}
          >
            <Text
              style={[
                styles.shiftFilterText,
                activeShift === "afternoon" && styles.shiftFilterTextActive,
                !shiftAvailability.afternoon && styles.shiftFilterTextDisabled,
              ]}
            >
              Tarde
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.shiftFilterButton,
              activeShift === "night" && styles.shiftFilterButtonActive,
              !shiftAvailability.night && styles.shiftFilterButtonDisabled,
            ]}
            onPress={() => setActiveShift("night")}
            disabled={!shiftAvailability.night}
          >
            <Text
              style={[
                styles.shiftFilterText,
                activeShift === "night" && styles.shiftFilterTextActive,
                !shiftAvailability.night && styles.shiftFilterTextDisabled,
              ]}
            >
              Noche
            </Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#D4AF37" />
            <Text style={styles.emptyText}>
              Calculando horarios disponibles...
            </Text>
          </View>
        ) : !hasSlots ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="schedule" size={34} color="#333" />
            <Text style={styles.emptyText}>
              {!shiftAvailability[activeShift]
                ? "Esta franja horaria no esta habilitada por la barberia."
                : "No hay horarios disponibles para este servicio en esta franja."}
            </Text>
            <Pressable
              style={styles.nextDayButton}
              onPress={() => setDayOffset((current) => current + 1)}
            >
              <Text style={styles.nextDayButtonText}>
                {hasAnyAvailableSlots
                  ? "Ver otro dia"
                  : "Ir al proximo dia disponible"}
              </Text>
              <MaterialIcons name="chevron-right" size={18} color="#D4AF37" />
            </Pressable>
          </View>
        ) : (
          <View style={styles.timeSection}>
            <View style={styles.groupHeader}>
              <MaterialIcons
                name={
                  activeShift === "morning"
                    ? "wb-twilight"
                    : activeShift === "afternoon"
                      ? "wb-sunny"
                      : "nightlight-round"
                }
                size={16}
                color="#D4AF37"
              />
              <Text style={styles.groupTitle}>
                {activeShift === "morning"
                  ? "Manana"
                  : activeShift === "afternoon"
                    ? "Tarde"
                    : "Noche"}
              </Text>
            </View>
            <View style={styles.grid}>
              {availableVisibleSlots.map(renderSlot)}
            </View>
          </View>
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.selectionSummary}>
          <Text style={styles.summaryLabel}>Turno seleccionado:</Text>
          <Text style={styles.summaryValue}>
            {selectedTime ? `${selectedTime} hs` : "Sin seleccionar"}
          </Text>
        </View>
        <Pressable
          style={styles.nextButton}
          onPress={goNext}
          disabled={!selectedTime || isLoading}
        >
          <Text style={styles.nextButtonText}>Siguiente</Text>
          <MaterialIcons name="chevron-right" size={24} color="#000" />
        </Pressable>
      </View>
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

  progressSection: {
    paddingHorizontal: 25,
    marginTop: 10,
    alignItems: "center",
  },
  progressContainer: { flexDirection: "row", gap: 6, width: "100%" },
  progressStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#222",
  },
  progressDone: { backgroundColor: "rgba(212, 175, 55, 0.4)" },
  progressActive: { backgroundColor: "#D4AF37" },
  stepIndicatorText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: 1,
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    fontSize: 13,
    maxWidth: 260,
  },
  nextDayButton: {
    marginTop: 8,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  nextDayButtonText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  dateTicket: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#1A1A1A",
    marginBottom: 25,
  },
  dateNavButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0f0f0f",
    alignItems: "center",
    justifyContent: "center",
  },
  dateNavButtonDisabled: {
    opacity: 0.4,
  },
  dateTitle: {
    color: "#555",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  dateValue: { color: "#FFF", fontSize: 18, fontWeight: "800", marginTop: 2 },

  shiftFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  shiftFilterButton: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  shiftFilterButtonActive: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212, 175, 55, 0.12)",
  },
  shiftFilterButtonDisabled: {
    opacity: 0.35,
  },
  shiftFilterText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  shiftFilterTextActive: {
    color: "#D4AF37",
  },
  shiftFilterTextDisabled: {
    color: "#4a4a4a",
  },

  timeSection: { marginBottom: 25 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
    paddingLeft: 5,
  },
  groupTitle: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  slotContainer: { width: "30.5%" },
  slotButton: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  slotButtonActive: {
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212, 175, 55, 0.1)",
  },
  slotButtonDisabled: { opacity: 0.2 },
  slotText: { color: "#888", fontSize: 15, fontWeight: "700" },
  slotTextActive: { color: "#D4AF37" },
  slotTextDisabled: { textDecorationLine: "line-through" },
  slotHint: {
    color: "#D4AF37",
    fontSize: 10,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },

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
  selectionSummary: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: 15,
  },
  summaryLabel: { color: "#555", fontSize: 13, fontWeight: "600" },
  summaryValue: { color: "#D4AF37", fontSize: 13, fontWeight: "800" },
  nextButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: { color: "#000", fontSize: 18, fontWeight: "900" },
});
