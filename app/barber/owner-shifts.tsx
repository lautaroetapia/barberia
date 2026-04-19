import { MaterialIcons } from "@expo/vector-icons";
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

const weekDays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miercoles",
  "Jueves",
  "Viernes",
  "Sabado",
];

const monthNames = [
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
];

const shiftLabel: Record<ShiftName, string> = {
  morning: "Manana",
  afternoon: "Tarde",
  night: "Noche",
};

const shiftStartHour: Record<ShiftName, number> = {
  morning: 9,
  afternoon: 13,
  night: 18,
};

const toTimeText = (hour: number, minute: number) => {
  const hh = `${hour}`.padStart(2, "0");
  const mm = `${minute}`.padStart(2, "0");
  return `${hh}:${mm}`;
};

const buildShiftTimes = (shift: ShiftName, count: number) => {
  const start = shiftStartHour[shift];
  const times: string[] = [];

  for (let i = 0; i < count; i += 1) {
    const totalMinutes = start * 60 + i * 30;
    const hh = Math.floor(totalMinutes / 60);
    const mm = totalMinutes % 60;
    times.push(toTimeText(hh, mm));
  }

  return times;
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
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [dayOffset]);

  const selectedDateLabel = useMemo(() => {
    return `${weekDays[selectedDate.getDay()]}, ${selectedDate.getDate()} ${monthNames[selectedDate.getMonth()]}`;
  }, [selectedDate]);

  const shiftCounters = useMemo(() => {
    const counters: Record<ShiftName, number> = {
      morning: 0,
      afternoon: 0,
      night: 0,
    };

    appointments.forEach((item) => {
      if (item.status === "libre") {
        return;
      }

      const shift = getShiftForTime(item.time);
      counters[shift] += 1;
    });

    return counters;
  }, [appointments]);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const [shiftPrefs, storedAppointments] = await Promise.all([
        getShiftPreferencesByDate(selectedDate),
        getOwnerAppointmentsByDate(selectedDate),
      ]);

      if (!isMounted) {
        return;
      }

      setPreferences(shiftPrefs);
      setAppointments(storedAppointments);
      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const togglePreference = async (shift: ShiftName) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      const nextPreferences: ShiftPreferences = {
        ...preferences,
        [shift]: !preferences[shift],
      };

      setPreferences(nextPreferences);
      await saveShiftPreferencesByDate(selectedDate, nextPreferences);
      setToast({
        visible: true,
        type: "success",
        message: `Franja ${shiftLabel[shift].toLowerCase()} ${
          nextPreferences[shift] ? "activada" : "desactivada"
        }`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const reprogramShift = (fromShift: ShiftName, toShift: ShiftName) => {
    if (fromShift === toShift) {
      return;
    }

    const candidates = appointments.filter(
      (item) =>
        item.status !== "libre" && getShiftForTime(item.time) === fromShift,
    );

    if (!candidates.length) {
      setToast({
        visible: true,
        type: "info",
        message: `No hay turnos en ${shiftLabel[fromShift].toLowerCase()}.`,
      });
      return;
    }

    Alert.alert(
      "Reprogramar turnos",
      `Mover ${candidates.length} turno(s) de ${shiftLabel[fromShift].toLowerCase()} a ${shiftLabel[toShift].toLowerCase()}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Mover",
          onPress: () => {
            if (isProcessing) {
              return;
            }

            setIsProcessing(true);
            const times = buildShiftTimes(toShift, candidates.length);
            let cursor = 0;

            const nextAppointments = appointments
              .map((item) => {
                if (
                  item.status === "libre" ||
                  getShiftForTime(item.time) !== fromShift
                ) {
                  return item;
                }

                const nextTime = times[cursor] ?? item.time;
                cursor += 1;
                return {
                  ...item,
                  time: nextTime,
                };
              })
              .sort((a, b) => a.time.localeCompare(b.time));

            setAppointments(nextAppointments);
            void saveOwnerAppointmentsByDate(selectedDate, nextAppointments)
              .then(() => {
                setToast({
                  visible: true,
                  type: "success",
                  message: `Turnos movidos a ${shiftLabel[toShift].toLowerCase()}`,
                });
              })
              .finally(() => {
                setIsProcessing(false);
              });
          },
        },
      ],
    );
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
        <Text style={styles.brand}>Franjas</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateHeader}>
          <Pressable onPress={() => setDayOffset((prev) => prev - 1)}>
            <MaterialIcons name="chevron-left" size={24} color="#d0c5af" />
          </Pressable>
          <Text style={styles.dateTitle}>{selectedDateLabel}</Text>
          <Pressable onPress={() => setDayOffset((prev) => prev + 1)}>
            <MaterialIcons name="chevron-right" size={24} color="#d0c5af" />
          </Pressable>
        </View>

        {isLoading ? <Text style={styles.loadingText}>Cargando...</Text> : null}

        {(["morning", "afternoon", "night"] as const).map((shift) => (
          <View key={shift} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <View>
                <Text style={styles.shiftTitle}>{shiftLabel[shift]}</Text>
                <Text style={styles.shiftMeta}>
                  {shiftCounters[shift]} turno(s)
                </Text>
              </View>
              <Pressable
                style={preferences[shift] ? styles.toggleOn : styles.toggleOff}
                disabled={isProcessing}
                onPress={() => {
                  void togglePreference(shift);
                }}
              >
                <View style={styles.toggleDot} />
              </Pressable>
            </View>

            <View style={styles.reprogramRow}>
              {shift !== "morning" ? (
                <Pressable
                  style={styles.reprogramButton}
                  disabled={isProcessing}
                  onPress={() => reprogramShift(shift, "morning")}
                >
                  <Text style={styles.reprogramText}>Mover a manana</Text>
                </Pressable>
              ) : null}

              {shift !== "afternoon" ? (
                <Pressable
                  style={styles.reprogramButton}
                  disabled={isProcessing}
                  onPress={() => reprogramShift(shift, "afternoon")}
                >
                  <Text style={styles.reprogramText}>Mover a tarde</Text>
                </Pressable>
              ) : null}

              {shift !== "night" ? (
                <Pressable
                  style={styles.reprogramButton}
                  disabled={isProcessing}
                  onPress={() => reprogramShift(shift, "night")}
                >
                  <Text style={styles.reprogramText}>Mover a noche</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Nota</Text>
          <Text style={styles.noteText}>
            Esta pantalla es independiente de Agenda. Aqui defines en que
            franjas quieres atender y puedes mover turnos de una franja a otra.
          </Text>
        </View>
      </ScrollView>

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
    paddingBottom: 110,
    gap: 12,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateTitle: {
    color: "#e5e2e1",
    fontSize: 22,
    fontWeight: "800",
  },
  loadingText: {
    color: "#99907c",
    fontSize: 12,
    textAlign: "center",
  },
  shiftCard: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    gap: 10,
  },
  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  shiftTitle: { color: "#e5e2e1", fontSize: 18, fontWeight: "700" },
  shiftMeta: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  toggleOn: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.25)",
    justifyContent: "center",
    paddingHorizontal: 3,
    alignItems: "flex-end",
  },
  toggleOff: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(77,70,53,0.25)",
    justifyContent: "center",
    paddingHorizontal: 3,
    alignItems: "flex-start",
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#f2ca50",
  },
  reprogramRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  reprogramButton: {
    minHeight: 34,
    borderRadius: 9,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  reprogramText: {
    color: "#f2ca50",
    fontSize: 12,
    fontWeight: "700",
  },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    backgroundColor: "#1c1b1b",
    padding: 14,
  },
  noteTitle: { color: "#e5e2e1", fontSize: 14, fontWeight: "700" },
  noteText: { color: "#d0c5af", fontSize: 12, marginTop: 4, lineHeight: 18 },
});
