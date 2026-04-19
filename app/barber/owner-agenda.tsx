import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
    getOwnerAppointmentsByDate,
    saveOwnerAppointmentsByDate,
    type OwnerAppointment,
} from "@/lib/owner-agenda";

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

export default function OwnerAgendaScreen() {
  const [dayOffset, setDayOffset] = useState(0);
  const [appointments, setAppointments] = useState<OwnerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newService, setNewService] = useState("");
  const [newTime, setNewTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const selectedDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [dayOffset]);

  const selectedDateLabel = useMemo(() => {
    const date = selectedDate;
    return `${weekDays[date.getDay()]}, ${date.getDate()} ${monthNames[date.getMonth()]}`;
  }, [selectedDate]);

  useEffect(() => {
    let isMounted = true;

    const loadAppointments = async () => {
      const storedAppointments = await getOwnerAppointmentsByDate(selectedDate);
      if (!isMounted) {
        return;
      }

      setAppointments(storedAppointments);
      setIsLoading(false);
    };

    void loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const scheduledCount = appointments.filter(
    (item) => item.status !== "libre",
  ).length;

  const markInProgress = async (id: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    const nextAppointments = appointments.map((item) =>
      item.id === id ? { ...item, status: "en_progreso" } : item,
    );
    setAppointments(nextAppointments);
    await saveOwnerAppointmentsByDate(selectedDate, nextAppointments);
    setToast({ visible: true, message: "Turno iniciado", type: "success" });
    setIsProcessing(false);
  };

  const markNoShow = async (id: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    const nextAppointments = appointments.map((item) =>
      item.id === id ? { ...item, status: "no_asistio" } : item,
    );
    setAppointments(nextAppointments);
    await saveOwnerAppointmentsByDate(selectedDate, nextAppointments);
    setToast({
      visible: true,
      message: "Turno marcado como no asistio",
      type: "info",
    });
    setIsProcessing(false);
  };

  const deleteAppointment = async (id: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    const nextAppointments = appointments.filter((item) => item.id !== id);
    setAppointments(nextAppointments);
    await saveOwnerAppointmentsByDate(selectedDate, nextAppointments);
    setToast({ visible: true, message: "Turno eliminado", type: "info" });
    setIsProcessing(false);
  };

  const confirmDelete = (id: string) => {
    Alert.alert(
      "Eliminar turno",
      "Esta accion quitara el turno de la agenda. Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void deleteAppointment(id);
          },
        },
      ],
    );
  };

  const handleAddAppointment = async () => {
    if (isProcessing) {
      return;
    }

    if (!newClient.trim() || !newService.trim() || !newTime.trim()) {
      setToast({
        visible: true,
        message: "Completa cliente, servicio y hora",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);

    const nextAppointments = [
      ...appointments,
      {
        id: `ap-${Date.now()}`,
        time: newTime.trim(),
        client: newClient.trim(),
        service: newService.trim(),
        status: "pendiente",
      } as OwnerAppointment,
    ].sort((a, b) => a.time.localeCompare(b.time));

    setAppointments(nextAppointments);
    await saveOwnerAppointmentsByDate(selectedDate, nextAppointments);
    setAddModalVisible(false);
    setNewClient("");
    setNewService("");
    setNewTime("");
    setToast({ visible: true, message: "Turno agregado", type: "success" });
    setIsProcessing(false);
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
          <MaterialIcons name="menu" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLleSA-Lg0D-i1xnyNZBfM_20VjtcTg9K03sBcQObgygOMEqRkjNP7RpPb1ieDZ9q7BOKKQYaXazN36uekOYvwqFaDWY5w4e73uBIw5ggMhfO10cDTaInO4ABEKzWhhSWigzO7FjQW4SvjYtR6p5lthpVkPawQmjQamF9LuwbNOB9YEtHmkQii4mqaHJtl9B-_10h_mIX8cMUvITC5l-3lz21FqgRxPpdnHtZRiity7wZBryrbJLIkvV2oa2DkcMmUU20fAXlxX58Z",
            }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateHeader}>
          <Pressable onPress={() => setDayOffset((prev) => prev - 1)}>
            <MaterialIcons name="chevron-left" size={24} color="#d0c5af" />
          </Pressable>
          <View style={styles.dateCenter}>
            <Text style={styles.dateTitle}>{selectedDateLabel}</Text>
            <Text style={styles.dateSubtitle}>
              {scheduledCount} citas programadas
            </Text>
          </View>
          <Pressable onPress={() => setDayOffset((prev) => prev + 1)}>
            <MaterialIcons name="chevron-right" size={24} color="#d0c5af" />
          </Pressable>
        </View>

        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>Barbero · Centro</Text>
        </View>

        {isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <Skeleton style={styles.skeletonTime} />
                <View style={styles.skeletonBody}>
                  <Skeleton style={styles.skeletonLinePrimary} />
                  <Skeleton style={styles.skeletonLineSecondary} />
                  <View style={styles.skeletonActions}>
                    <Skeleton style={styles.skeletonAction} />
                    <Skeleton style={styles.skeletonAction} />
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {appointments.map((item) => (
          <View key={item.id} style={styles.timelineCard}>
            <Text
              style={[styles.time, item.status === "libre" && styles.timeMuted]}
            >
              {item.time}
            </Text>
            <View style={styles.timelineBody}>
              <Text style={styles.client}>{item.client}</Text>
              <Text style={styles.service}>{item.service}</Text>
              {item.status === "en_progreso" ? (
                <Text style={styles.statusProgress}>En progreso</Text>
              ) : null}
              {item.status === "no_asistio" ? (
                <Text style={styles.statusNoShow}>No asistio</Text>
              ) : null}
              {item.status === "pendiente" ? (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.actionPrimary}
                    disabled={isProcessing}
                    onPress={() => {
                      void markInProgress(item.id);
                    }}
                  >
                    <Text style={styles.actionPrimaryText}>Iniciar</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionGhost}
                    disabled={isProcessing}
                    onPress={() => {
                      void markNoShow(item.id);
                    }}
                  >
                    <Text style={styles.actionGhostText}>No asistio</Text>
                  </Pressable>
                </View>
              ) : null}

              {item.status !== "libre" ? (
                <Pressable
                  style={styles.actionDelete}
                  disabled={isProcessing}
                  onPress={() => confirmDelete(item.id)}
                >
                  <Text style={styles.actionDeleteText}>Eliminar turno</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>

      <Pressable
        style={styles.fab}
        disabled={isProcessing}
        onPress={() => setAddModalVisible(true)}
      >
        <MaterialIcons name="add" size={28} color="#3c2f00" />
      </Pressable>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar turno manual</Text>

            <TextInput
              style={styles.modalInput}
              value={newClient}
              onChangeText={setNewClient}
              placeholder="Cliente"
              placeholderTextColor="#777"
            />
            <TextInput
              style={styles.modalInput}
              value={newService}
              onChangeText={setNewService}
              placeholder="Servicio"
              placeholderTextColor="#777"
            />
            <TextInput
              style={styles.modalInput}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="Hora (ej: 14:30)"
              placeholderTextColor="#777"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                disabled={isProcessing}
                onPress={() => {
                  void handleAddAppointment();
                }}
              >
                <Text style={styles.modalConfirmText}>
                  {isProcessing ? "Guardando..." : "Agregar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BarberRoleNav mode="owner" current="agenda" />
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
    backgroundColor: "rgba(19,19,19,0.9)",
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
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 2,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4d4635",
  },
  avatar: { width: "100%", height: "100%" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 168,
    gap: 12,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateCenter: { alignItems: "center" },
  dateTitle: { color: "#e5e2e1", fontSize: 24, fontWeight: "800" },
  dateSubtitle: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  badgeWrap: {
    alignSelf: "center",
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.3)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    marginBottom: 2,
  },
  badgeText: { color: "#f2ca50", fontSize: 12, fontWeight: "600" },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
  },
  skeletonTime: {
    width: 60,
    height: 20,
    marginTop: 2,
  },
  skeletonBody: {
    flex: 1,
    gap: 8,
  },
  skeletonLinePrimary: {
    height: 16,
    width: "62%",
  },
  skeletonLineSecondary: {
    height: 12,
    width: "46%",
  },
  skeletonActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  skeletonAction: {
    height: 34,
    flex: 1,
    borderRadius: 9,
  },
  loadingText: { color: "#99907c", fontSize: 12, textAlign: "center" },
  timelineCard: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
  },
  time: { color: "#f2ca50", fontSize: 17, fontWeight: "800", width: 60 },
  timeMuted: { color: "#99907c" },
  timelineBody: { flex: 1 },
  client: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  service: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionPrimary: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  actionPrimaryText: { color: "#3c2f00", fontSize: 12, fontWeight: "800" },
  actionGhost: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#4d4635",
    alignItems: "center",
    justifyContent: "center",
  },
  actionGhostText: { color: "#d0c5af", fontSize: 12, fontWeight: "600" },
  actionDelete: {
    marginTop: 8,
    minHeight: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.35)",
    backgroundColor: "rgba(147,0,10,0.2)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  actionDeleteText: { color: "#ffb4ab", fontSize: 12, fontWeight: "700" },
  statusProgress: {
    marginTop: 8,
    alignSelf: "flex-start",
    color: "#f2ca50",
    fontSize: 11,
    fontWeight: "700",
  },
  statusNoShow: {
    marginTop: 8,
    alignSelf: "flex-start",
    color: "#ffb4ab",
    fontSize: 11,
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 88,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 16,
    gap: 10,
  },
  modalTitle: { color: "#e5e2e1", fontSize: 20, fontWeight: "800" },
  modalInput: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    color: "#e5e2e1",
    paddingHorizontal: 12,
  },
  modalActions: { flexDirection: "row", gap: 8 },
  modalCancelButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { color: "#d0c5af", fontSize: 13, fontWeight: "700" },
  modalConfirmButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: { color: "#241a00", fontSize: 13, fontWeight: "800" },
});
