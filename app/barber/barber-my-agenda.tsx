import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Calendar from "expo-calendar";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getBarberPreferences } from "@/lib/barber-preferences";
import {
    getDateStorageKey,
    getOwnerAppointmentsByDate,
    saveOwnerAppointmentsByDate,
    type OwnerAppointment,
} from "@/lib/owner-agenda";
import { getOwnerServices, type OwnerService } from "@/lib/owner-services";

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

export default function BarberMyAgendaScreen() {
  // Estado para modal de agendado manual (debe estar aquí)
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [services, setServices] = useState<OwnerService[]>([]);
  const [selectedService, setSelectedService] = useState<OwnerService | null>(
    null,
  );
  const [addError, setAddError] = useState<string>("");

  // Cargar servicios al abrir modal
  const openAddModal = async (time: string) => {
    setSelectedTime(time);
    setShowAddModal(true);
    setAddError("");
    const loaded = await getOwnerServices();
    const activeServices = loaded.filter((item) => item.active);
    setServices(activeServices);
    setSelectedService(activeServices[0] ?? null);
    if (!activeServices.length) {
      setAddError(
        "No hay servicios activos. Crea un servicio primero para agendar.",
      );
    }
  };

  const timeToMinutes = (time: string) => {
    const [hhText, mmText] = time.split(":");
    const hh = Number(hhText);
    const mm = Number(mmText);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
      return null;
    }
    return hh * 60 + mm;
  };

  const slotsRequired = useMemo(() => {
    const duration = Number(selectedService?.duration ?? 0);
    if (!Number.isFinite(duration) || duration <= 0) {
      return 1;
    }
    return Math.ceil(duration / 30);
  }, [selectedService]);

  // Lógica para bloquear turnos según duración
  const handleAddAppointment = async () => {
    if (!selectedTime || !selectedService) {
      setAddError("Selecciona un servicio para continuar.");
      return;
    }

    const sortedTimeline = [...timeline].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
    const idx = sortedTimeline.findIndex((item) => item.time === selectedTime);
    if (idx === -1) {
      setAddError("Turno base no encontrado.");
      return;
    }

    const baseMinute = timeToMinutes(selectedTime);
    if (baseMinute === null) {
      setAddError("La hora seleccionada es inválida.");
      return;
    }

    const segment = sortedTimeline.slice(idx, idx + slotsRequired);
    if (segment.length < slotsRequired) {
      setAddError(
        "No hay suficientes turnos para cubrir la duración del servicio.",
      );
      return;
    }

    for (let i = 0; i < segment.length; i += 1) {
      const slot = segment[i];
      const minute = timeToMinutes(slot.time);
      const expectedMinute = baseMinute + i * 30;

      if (minute === null || minute !== expectedMinute) {
        setAddError(
          "Los turnos deben ser seguidos cada 30 minutos. El bloque seleccionado tiene cortes.",
        );
        return;
      }

      if (slot.status !== "libre") {
        setAddError("Uno o más turnos del bloque ya están ocupados.");
        return;
      }
    }

    const selectedIds = new Set(segment.map((item) => item.id));
    const firstId = segment[0]?.id;
    const updated = timeline.map((item) => {
      if (!selectedIds.has(item.id)) {
        return item;
      }

      if (item.id === firstId) {
        return {
          ...item,
          status: "pendiente",
          client: "Cliente manual",
          service: selectedService.serviceName,
        };
      }

      return {
        ...item,
        status: "bloqueado",
        client: "Bloqueado",
        service: `Bloque ${selectedService.serviceName}`,
      };
    });

    setTimeline(updated);
    await saveOwnerAppointmentsByDate(today, updated);
    setShowAddModal(false);
    setAddError("");
    setToast({
      visible: true,
      message: `Turno creado: ${selectedService.serviceName} (${slotsRequired} bloques de 30 min).`,
      type: "success",
    });
  };
  const [timeline, setTimeline] = useState<OwnerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const today = useMemo(() => new Date(), []);

  const dayLabel = useMemo(() => {
    return `${weekDays[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;
  }, [today]);

  const loadAgenda = useCallback(async () => {
    setIsLoading(true);
    const appointments = await getOwnerAppointmentsByDate(today);
    const sorted = appointments.sort((a, b) => a.time.localeCompare(b.time));
    setTimeline(sorted);

    const preferences = await getBarberPreferences();
    if (preferences.notificationsEnabled) {
      const todayKey = getDateStorageKey(today);
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const remindersForToday = scheduled.filter((item) => {
        const data = (item.content.data ?? {}) as Record<string, unknown>;
        return (
          data.type === "barber-appointment-reminder" &&
          data.dateKey === todayKey
        );
      });

      await Promise.all(
        remindersForToday.map((item) =>
          Notifications.cancelScheduledNotificationAsync(item.identifier),
        ),
      );

      const now = Date.now();
      const candidates = sorted.filter(
        (item) => item.status !== "libre" && item.status !== "no_asistio",
      );

      await Promise.all(
        candidates.map(async (item) => {
          const [hourText, minuteText] = item.time.split(":");
          const hour = Number(hourText);
          const minute = Number(minuteText);

          if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
            return;
          }

          const startDate = new Date(today);
          startDate.setHours(hour, minute, 0, 0);
          const reminderDate = new Date(startDate.getTime() - 60 * 60 * 1000);

          if (reminderDate.getTime() <= now) {
            return;
          }

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Recordatorio de turno",
              body: `${item.client} · ${item.service} a las ${item.time}`,
              data: {
                type: "barber-appointment-reminder",
                dateKey: todayKey,
                appointmentId: item.id,
              },
            },
            trigger: reminderDate,
          });
        }),
      );
    }

    setIsLoading(false);
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      void loadAgenda();
    }, [loadAgenda]),
  );

  const scheduledCount = useMemo(
    () =>
      timeline.filter(
        (item) => item.status !== "libre" && item.status !== "bloqueado",
      ).length,
    [timeline],
  );

  const totalHoy = useMemo(() => {
    return timeline.filter((item) => item.status === "completado").length;
  }, [timeline]);

  const totalHoyLabel = useMemo(() => `${totalHoy} completados`, [totalHoy]);

  const updateAppointmentStatus = async (
    id: string,
    status: OwnerAppointment["status"],
  ) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      const nextTimeline = timeline.map((item) =>
        item.id === id ? { ...item, status } : item,
      );
      setTimeline(nextTimeline);
      await saveOwnerAppointmentsByDate(today, nextTimeline);
      setToast({
        visible: true,
        type: "success",
        message:
          status === "en_progreso"
            ? "Turno iniciado"
            : status === "completado"
              ? "Turno completado"
              : status === "no_asistio"
                ? "Turno marcado como no asistio"
                : "Turno actualizado",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmNoShow = (id: string) => {
    Alert.alert(
      "Marcar no asistio",
      "Confirmas marcar este turno como no asistio?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: () => {
            void updateAppointmentStatus(id, "no_asistio");
          },
        },
      ],
    );
  };

  const deleteAppointment = async (id: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    try {
      const nextTimeline = timeline.filter((item) => item.id !== id);
      setTimeline(nextTimeline);
      await saveOwnerAppointmentsByDate(today, nextTimeline);
      setToast({
        visible: true,
        message: "Turno eliminado",
        type: "info",
      });
    } finally {
      setIsProcessing(false);
    }
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

  const ensureCalendarId = async () => {
    const calendars = await Calendar.getCalendarsAsync(
      Calendar.EntityTypes.EVENT,
    );
    const existing = calendars.find((item) => item.title === "Navaja Dorada");
    if (existing?.id) {
      return existing.id;
    }

    if (Platform.OS === "ios") {
      const defaultCalendar = await Calendar.getDefaultCalendarAsync();
      return Calendar.createCalendarAsync({
        title: "Navaja Dorada",
        color: "#d4af37",
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendar.source.id,
        source: defaultCalendar.source,
        name: "Navaja Dorada",
        ownerAccount: "personal",
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });
    }

    return Calendar.createCalendarAsync({
      title: "Navaja Dorada",
      color: "#d4af37",
      entityType: Calendar.EntityTypes.EVENT,
      name: "Navaja Dorada",
      ownerAccount: "personal",
      accessLevel: Calendar.CalendarAccessLevel.OWNER,
    });
  };

  const syncTodayToCalendar = async () => {
    if (isSyncingCalendar) {
      return;
    }

    setIsSyncingCalendar(true);
    try {
      const permission = await Calendar.getCalendarPermissionsAsync();
      let granted = permission.granted;
      if (!granted) {
        const requested = await Calendar.requestCalendarPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        setToast({
          visible: true,
          message: "Permiso de calendario denegado",
          type: "error",
        });
        return;
      }

      const calendarId = await ensureCalendarId();
      const todayKey = getDateStorageKey(today);
      const services = await getOwnerServices();
      const durationByService = new Map(
        services.map((item) => [
          item.serviceName.toLowerCase(),
          Number(item.duration),
        ]),
      );

      const dayStart = new Date(today);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(today);
      dayEnd.setHours(23, 59, 59, 999);

      const existingEvents = await Calendar.getEventsAsync(
        [calendarId],
        dayStart,
        dayEnd,
      );
      const existingByToken = new Map(
        existingEvents
          .filter((item) =>
            item.notes?.startsWith(`navaja-appointment:${todayKey}:`),
          )
          .map((item) => [item.notes as string, item]),
      );

      const candidates = timeline.filter(
        (item) => item.status !== "libre" && item.status !== "no_asistio",
      );

      const expectedTokens = new Set(
        candidates.map((item) => `navaja-appointment:${todayKey}:${item.id}`),
      );

      await Promise.all(
        existingEvents
          .filter((item) =>
            item.notes?.startsWith(`navaja-appointment:${todayKey}:`),
          )
          .filter((item) => !expectedTokens.has(item.notes as string))
          .map((item) => Calendar.deleteEventAsync(item.id)),
      );

      for (const item of candidates) {
        const [hourText, minuteText] = item.time.split(":");
        const hour = Number(hourText);
        const minute = Number(minuteText);

        if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
          continue;
        }

        const startDate = new Date(today);
        startDate.setHours(hour, minute, 0, 0);
        const minutes = durationByService.get(item.service.toLowerCase()) ?? 45;
        const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);

        const notes = `navaja-appointment:${todayKey}:${item.id}`;
        const existing = existingByToken.get(notes);

        if (existing) {
          await Calendar.updateEventAsync(existing.id, {
            title: `[Navaja] ${item.client}`,
            startDate,
            endDate,
            notes,
            location: "Navaja Dorada",
            alarms: [{ relativeOffset: -30 }],
          });
        } else {
          await Calendar.createEventAsync(calendarId, {
            title: `[Navaja] ${item.client}`,
            startDate,
            endDate,
            notes,
            location: "Navaja Dorada",
            alarms: [{ relativeOffset: -30 }],
          });
        }
      }

      setToast({
        visible: true,
        message: "Turnos sincronizados al calendario",
        type: "success",
      });
    } catch {
      setToast({
        visible: true,
        message: "No se pudo sincronizar el calendario",
        type: "error",
      });
    } finally {
      setIsSyncingCalendar(false);
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
          onPress={() => router.replace("/barber/barber-profile")}
        >
          <MaterialIcons name="menu" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqBP3fpBBSq2HVlHtMfDbDQ8gyxOW7APdE4aw3PmFAebofHGy_9Vs8awhO15ehqVb8YCY55XbpwFXmZWwyx4QRJC3l-44ztOApaDXmUz9psQPT0ofKkFWNNm1-RSkJOeY8_G9bIvPXqosy00FSHcfTe6GMN4ZLTpA1XV-BMiWwuHK-WZhlUXMlEIdV4TTTB1h0oLD5qtHFAoNOH-sbaHEuV-EDpUwEy1AUJzZi9F3Sqi1XS8RtdE1-0Wj_wz7sEFrjs6KUAxe2IR3m",
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
        {/* Modal para agendar manualmente */}
        <Modal visible={showAddModal} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                padding: 20,
                width: "90%",
              }}
            >
              <Text
                style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}
              >
                Agendar turno
              </Text>
              <Text>Hora: {selectedTime}</Text>
              <Text style={{ marginTop: 10 }}>Servicio:</Text>
              <Text style={{ color: "#666", marginBottom: 8 }}>
                Los turnos se toman en bloques de 30 min. Este servicio ocupará{" "}
                {slotsRequired} bloque(s).
              </Text>
              <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => setSelectedService(item)}
                    style={{
                      padding: 8,
                      backgroundColor:
                        selectedService?.id === item.id ? "#d4af37" : "#eee",
                      marginVertical: 2,
                      borderRadius: 8,
                    }}
                  >
                    <Text>
                      {item.serviceName} ({item.duration} min)
                    </Text>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 120, marginBottom: 10 }}
              />
              {addError ? (
                <Text style={{ color: "red", marginBottom: 8 }}>
                  {addError}
                </Text>
              ) : null}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <Pressable
                  onPress={() => setShowAddModal(false)}
                  style={{ padding: 10 }}
                >
                  <Text>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddAppointment}
                  style={{
                    backgroundColor: "#d4af37",
                    padding: 10,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#fff" }}>Agendar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Text style={styles.dayTitle}>{dayLabel}</Text>
        <Text style={styles.daySubtitle}>
          {scheduledCount} citas programadas
        </Text>

        <Pressable
          style={styles.syncCalendarButton}
          disabled={isSyncingCalendar}
          onPress={() => {
            void syncTodayToCalendar();
          }}
        >
          <MaterialIcons name="event-available" size={16} color="#241a00" />
          <Text style={styles.syncCalendarText}>
            {isSyncingCalendar
              ? "Sincronizando..."
              : "Sincronizar a calendario"}
          </Text>
        </Pressable>
        {/* Mostrar los turnos libres con botón para agendar manualmente */}
        {timeline
          .filter((a) => a.status === "libre")
          .map((a) => (
            <Pressable
              key={a.id}
              style={{
                marginVertical: 4,
                padding: 10,
                backgroundColor: "#eee",
                borderRadius: 8,
              }}
              onPress={() => openAddModal(a.time)}
            >
              <Text>Agregar turno a las {a.time}</Text>
            </Pressable>
          ))}

        {isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <Skeleton style={styles.skeletonTime} />
                <View style={styles.skeletonContent}>
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

        {timeline.map((item) =>
          item.status === "bloqueado" ? null : (
            <View
              key={item.id}
              style={[
                styles.card,
                item.status === "en_progreso" && styles.cardActive,
              ]}
            >
              <Text
                style={[
                  styles.time,
                  item.status === "en_progreso" && styles.timeActive,
                ]}
              >
                {item.time}
              </Text>
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.client}</Text>
                <Text style={styles.service}>{item.service}</Text>

                {item.status === "pendiente" ? (
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.completeButton}
                      disabled={isProcessing}
                      onPress={() => {
                        void updateAppointmentStatus(item.id, "en_progreso");
                      }}
                    >
                      <Text style={styles.completeText}>Iniciar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.noShowButton}
                      disabled={isProcessing}
                      onPress={() => confirmNoShow(item.id)}
                    >
                      <Text style={styles.noShowText}>No asistio</Text>
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      disabled={isProcessing}
                      onPress={() => confirmDelete(item.id)}
                    >
                      <Text style={styles.deleteText}>Eliminar</Text>
                    </Pressable>
                  </View>
                ) : null}

                {item.status === "en_progreso" ? (
                  <View style={styles.actionsRow}>
                    <Pressable
                      style={styles.completeButton}
                      disabled={isProcessing}
                      onPress={() => {
                        void updateAppointmentStatus(item.id, "completado");
                      }}
                    >
                      <Text style={styles.completeText}>Completar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.noShowButton}
                      disabled={isProcessing}
                      onPress={() => confirmNoShow(item.id)}
                    >
                      <Text style={styles.noShowText}>No asistio</Text>
                    </Pressable>
                    <Pressable
                      style={styles.deleteButton}
                      disabled={isProcessing}
                      onPress={() => confirmDelete(item.id)}
                    >
                      <Text style={styles.deleteText}>Eliminar</Text>
                    </Pressable>
                  </View>
                ) : null}

                {item.status === "completado" ||
                item.status === "no_asistio" ? (
                  <Pressable
                    style={styles.deleteButtonStandalone}
                    disabled={isProcessing}
                    onPress={() => confirmDelete(item.id)}
                  >
                    <Text style={styles.deleteText}>Eliminar</Text>
                  </Pressable>
                ) : null}

                {item.status === "completado" ? (
                  <Text style={styles.statusDone}>Completado</Text>
                ) : null}

                {item.status === "no_asistio" ? (
                  <Text style={styles.statusNoShow}>No asistio</Text>
                ) : null}
              </View>
            </View>
          ),
        )}
      </ScrollView>

      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>Total hoy</Text>
        <Text style={styles.summaryValue}>{totalHoyLabel}</Text>
      </View>

      <Pressable
        style={styles.fab}
        onPress={() => router.push("/barber/clients-management")}
      >
        <MaterialIcons name="add" size={28} color="#3c2f00" />
      </Pressable>

      <BarberRoleNav mode="barber" current="agenda" />
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
    paddingBottom: 190,
    gap: 10,
  },
  dayTitle: { color: "#e5e2e1", fontSize: 30, fontWeight: "800" },
  daySubtitle: { color: "#d0c5af", fontSize: 12, marginBottom: 6 },
  syncCalendarButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  syncCalendarText: { color: "#241a00", fontSize: 12, fontWeight: "800" },
  skeletonList: {
    gap: 10,
  },
  skeletonCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  skeletonTime: {
    width: 56,
    height: 22,
    marginTop: 2,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
  },
  skeletonLinePrimary: {
    height: 16,
    width: "65%",
  },
  skeletonLineSecondary: {
    height: 12,
    width: "45%",
  },
  skeletonActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  skeletonAction: {
    height: 34,
    width: 94,
    borderRadius: 9,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    flexDirection: "row",
    gap: 10,
  },
  cardActive: {
    backgroundColor: "#2a2a2a",
    borderColor: "rgba(212,175,55,0.4)",
  },
  time: { color: "#d0c5af", fontSize: 16, fontWeight: "700", width: 56 },
  timeActive: { color: "#f2ca50", fontSize: 19, fontWeight: "800" },
  cardBody: { flex: 1 },
  name: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  service: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  completeButton: {
    minHeight: 34,
    borderRadius: 9,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
  },
  completeText: { color: "#3c2f00", fontSize: 12, fontWeight: "800" },
  noShowButton: {
    minHeight: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.35)",
    backgroundColor: "rgba(147,0,10,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
  },
  noShowText: { color: "#ffb4ab", fontSize: 12, fontWeight: "700" },
  deleteButton: {
    minHeight: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.35)",
    backgroundColor: "rgba(147,0,10,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
  },
  deleteButtonStandalone: {
    marginTop: 10,
    minHeight: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.35)",
    backgroundColor: "rgba(147,0,10,0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
  },
  deleteText: { color: "#ffb4ab", fontSize: 12, fontWeight: "700" },
  statusDone: {
    marginTop: 9,
    color: "#7ecb99",
    fontSize: 12,
    fontWeight: "700",
  },
  statusNoShow: {
    marginTop: 9,
    color: "#ffb4ab",
    fontSize: 12,
    fontWeight: "700",
  },
  summaryBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(42,42,42,0.96)",
    borderTopWidth: 1,
    borderTopColor: "rgba(77,70,53,0.25)",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryLabel: {
    color: "#d0c5af",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: { color: "#f2ca50", fontSize: 22, fontWeight: "800" },
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
});
