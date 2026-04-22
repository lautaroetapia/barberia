import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import {
    getOwnerAppointmentsByDate,
    saveOwnerAppointmentsByDate,
    type OwnerAppointment,
} from "@/lib/owner-agenda";
import {
    getShiftForTime,
    getShiftPreferencesByDate,
    saveShiftPreferencesByDate,
    type ShiftName,
    type ShiftPreferences,
} from "@/lib/owner-shifts";

const TARGET_SHIFT_TIMES: Record<ShiftName, string[]> = {
  morning: ["09:00", "10:00", "11:00"],
  afternoon: ["13:00", "14:00", "15:00", "16:00", "17:00"],
  night: ["18:00", "19:00", "20:00", "21:00"],
};

export default function OwnerShiftsScreen() {
  const [dayOffset, setDayOffset] = useState(0);
  const [preferences, setPreferences] = useState<ShiftPreferences>({
    morning: true,
    afternoon: true,
    night: true,
  });
  const [appointments, setAppointments] = useState<OwnerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "info" | "error",
  });

  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [dayOffset]);

  const selectedDateLabel = useMemo(() => {
    const day = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][
      selectedDate.getDay()
    ];
    const month = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ][selectedDate.getMonth()];
    return `${day}, ${selectedDate.getDate()} ${month}`;
  }, [selectedDate]);

  const shiftData = {
    morning: { label: "Mañana", icon: "sun" as const, color: "#f2ca50" },
    afternoon: { label: "Tarde", icon: "sunrise" as const, color: "#ff8c00" },
    night: { label: "Noche", icon: "moon" as const, color: "#87ceeb" },
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [nextPreferences, nextAppointments] = await Promise.all([
          getShiftPreferencesByDate(selectedDate),
          getOwnerAppointmentsByDate(selectedDate),
        ]);

        if (!isMounted) {
          return;
        }

        setPreferences(nextPreferences);
        setAppointments(nextAppointments);
      } catch {
        if (isMounted) {
          setToast({
            visible: true,
            message: "No se pudieron cargar las franjas.",
            type: "error",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  // Genera horarios cada 30 minutos para cada franja
  const getShiftTimeSlots = (shift: ShiftName) => {
    let start = 9,
      end = 12; // morning
    if (shift === "afternoon") {
      start = 13;
      end = 18;
    }
    if (shift === "night") {
      start = 18;
      end = 22;
    }
    const slots: string[] = [];
    for (let h = start; h < end; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
      slots.push(`${h.toString().padStart(2, "0")}:30`);
    }
    return slots;
  };

  const togglePreference = async (shift: ShiftName) => {
    if (isProcessing) return;

    const hasTurnos = appointments.some(
      (a) => a.status !== "libre" && getShiftForTime(a.time) === shift,
    );
    const nextEnabled = !preferences[shift];

    if (!nextEnabled && hasTurnos) {
      Alert.alert(
        "Franja con turnos",
        "Esta franja tiene turnos activos. Reprogramalos antes de desactivarla.",
      );
      return;
    }

    setIsProcessing(true);
    try {
      const nextPreferences = { ...preferences, [shift]: nextEnabled };
      await saveShiftPreferencesByDate(selectedDate, nextPreferences);
      setPreferences(nextPreferences);

      // Si se activa la franja, crear horarios cada 30 minutos
      if (nextEnabled) {
        const times = getShiftTimeSlots(shift);
        const existingTimes = appointments
          .filter((a) => getShiftForTime(a.time) === shift)
          .map((a) => a.time);
        const newTimes = times.filter((t) => !existingTimes.includes(t));
        if (newTimes.length > 0) {
          const newAppointments = newTimes.map((time, idx) => ({
            id: `${shift}-${time}-${Date.now()}-${idx}`,
            time,
            client: "",
            service: "",
            status: "libre",
          }));
          try {
            const { saveOwnerAppointmentsByDate } =
              await import("@/lib/owner-agenda");
            await saveOwnerAppointmentsByDate(selectedDate, [
              ...appointments,
              ...newAppointments,
            ]);
            setAppointments((prev) => [...prev, ...newAppointments]);
            setToast({
              visible: true,
              message: `Se crearon ${newAppointments.length} horarios para la franja ${shiftData[shift].label}.`,
              type: "success",
            });
          } catch (err) {
            setToast({
              visible: true,
              message: "No se pudieron crear los horarios en Supabase.",
              type: "error",
            });
          }
        } else {
          setToast({
            visible: true,
            message: `No hay horarios nuevos para crear en la franja ${shiftData[shift].label}.`,
            type: "info",
          });
        }
      }
    } catch {
      setToast({
        visible: true,
        message: "No se pudo actualizar la franja.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reprogramShift = async (fromShift: ShiftName, toShift: ShiftName) => {
    if (isProcessing) {
      return;
    }

    const fromAppointments = appointments.filter(
      (a) => a.status !== "libre" && getShiftForTime(a.time) === fromShift,
    );

    if (!fromAppointments.length) {
      return;
    }

    setIsProcessing(true);
    try {
      let index = 0;
      const nextAppointments = appointments.map((appointment) => {
        if (
          appointment.status === "libre" ||
          getShiftForTime(appointment.time) !== fromShift
        ) {
          return appointment;
        }

        const targetTimes = TARGET_SHIFT_TIMES[toShift];
        const nextTime =
          targetTimes[Math.min(index, targetTimes.length - 1)] ??
          appointment.time;
        index += 1;

        return {
          ...appointment,
          time: nextTime,
        };
      });

      await saveOwnerAppointmentsByDate(selectedDate, nextAppointments);
      setAppointments(nextAppointments);
      setToast({
        visible: true,
        message: `Turnos movidos a ${shiftData[toShift].label}.`,
        type: "success",
      });
    } catch {
      setToast({
        visible: true,
        message: "No se pudieron reprogramar los turnos.",
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/barber/owner-more-settings")}
        >
          <Feather name="chevron-left" size={28} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Franjas Horarias</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Fecha Estilizado */}
        <View style={styles.datePickerContainer}>
          <Pressable
            style={styles.dateArrow}
            onPress={() => setDayOffset((prev) => prev - 1)}
          >
            <Feather name="chevron-left" size={20} color="#d4af37" />
          </Pressable>
          <View style={styles.dateInfo}>
            <Feather
              name="calendar"
              size={14}
              color="#d4af37"
              style={{ marginBottom: 4 }}
            />
            <Text style={styles.dateTitle}>{selectedDateLabel}</Text>
          </View>
          <Pressable
            style={styles.dateArrow}
            onPress={() => setDayOffset((prev) => prev + 1)}
          >
            <Feather name="chevron-right" size={20} color="#d4af37" />
          </Pressable>
        </View>

        {(["morning", "afternoon", "night"] as const).map((shift) => {
          const isActive = preferences[shift];
          // Contar todos los turnos (libres y agendados) para mostrar el total
          const totalTurnos = appointments.filter(
            (a) => getShiftForTime(a.time) === shift,
          ).length;
          const hasTurnos = appointments.filter(
            (a) => a.status !== "libre" && getShiftForTime(a.time) === shift,
          ).length;

          return (
            <View
              key={shift}
              style={[styles.shiftCard, !isActive && styles.shiftCardInactive]}
            >
              <View style={styles.shiftHeader}>
                <View style={styles.shiftIconText}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: shiftData[shift].color + "20" },
                    ]}
                  >
                    <Feather
                      name={shiftData[shift].icon}
                      size={20}
                      color={shiftData[shift].color}
                    />
                  </View>
                  <View>
                    <Text style={styles.shiftTitle}>
                      {shiftData[shift].label}
                    </Text>
                    <Text style={styles.shiftMeta}>{totalTurnos} horarios</Text>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.switchBase,
                    isActive ? styles.switchOn : styles.switchOff,
                  ]}
                  onPress={() => togglePreference(shift)}
                  disabled={isProcessing}
                >
                  <View
                    style={[styles.switchDot, isActive && styles.switchDotOn]}
                  />
                </Pressable>
              </View>

              {/* Sección de Reprogramación */}
              <View style={styles.actionsContainer}>
                <Text style={styles.actionLabel}>Mover turnos a:</Text>
                <View style={styles.buttonGroup}>
                  {(["morning", "afternoon", "night"] as const).map(
                    (dest) =>
                      dest !== shift && (
                        <Pressable
                          key={dest}
                          style={styles.actionButton}
                          onPress={() => reprogramShift(shift, dest)}
                          disabled={isProcessing || !hasTurnos}
                        >
                          <Feather
                            name="arrow-right"
                            size={12}
                            color="#d4af37"
                          />
                          <Text style={styles.actionButtonText}>
                            {shiftData[dest].label}
                          </Text>
                        </Pressable>
                      ),
                  )}
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.infoBox}>
          <Feather name="info" size={16} color="#99907c" />
          <Text style={styles.infoText}>
            Activa o desactiva franjas para controlar tu disponibilidad. Si
            tienes turnos en una franja desactivada, muévelos a otra para
            mantener tu agenda organizada.
          </Text>
        </View>
      </ScrollView>

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
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { paddingHorizontal: 20, paddingBottom: 120 },

  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151515",
    borderRadius: 20,
    padding: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
  },
  dateInfo: { flex: 1, alignItems: "center" },
  dateTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },

  shiftCard: {
    backgroundColor: "#151515",
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  shiftCardInactive: { opacity: 0.6, borderColor: "transparent" },
  shiftHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  shiftIconText: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  shiftTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  shiftMeta: { color: "#777", fontSize: 12, marginTop: 2 },

  // Switch Estilizado
  switchBase: {
    width: 50,
    height: 28,
    borderRadius: 15,
    padding: 4,
    justifyContent: "center",
  },
  switchOn: { backgroundColor: "#d4af37" },
  switchOff: { backgroundColor: "#333" },
  switchDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  switchDotOn: { alignSelf: "flex-end" },

  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#222",
    paddingTop: 16,
  },
  actionLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  buttonGroup: { flexDirection: "row", gap: 10 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1c1c1c",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  actionButtonText: { color: "#d4af37", fontSize: 13, fontWeight: "600" },

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#151515",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginTop: 10,
  },
  infoText: { color: "#99907c", fontSize: 12, flex: 1, lineHeight: 18 },
});
