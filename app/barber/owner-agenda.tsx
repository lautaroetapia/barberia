import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { getOwnerServices, type OwnerService } from "@/lib/owner-services";

const weekDays = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type TimeSectionKey = "morning" | "afternoon" | "night";

const timeSections: {
  key: TimeSectionKey;
  label: string;
}[] = [
  { key: "morning", label: "Manana" },
  { key: "afternoon", label: "Tarde" },
  { key: "night", label: "Noche" },
];

export default function OwnerAgendaScreen() {
  const now = new Date();
  const initialSection: TimeSectionKey =
    now.getHours() < 12
      ? "morning"
      : now.getHours() < 18
        ? "afternoon"
        : "night";

  const [dayOffset, setDayOffset] = useState(0);
  const [selectedTimeSection, setSelectedTimeSection] =
    useState<TimeSectionKey>(initialSection);
  const [appointments, setAppointments] = useState<OwnerAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newClient, setNewClient] = useState("");
  const [newTime, setNewTime] = useState("");
  const [services, setServices] = useState<OwnerService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [serviceSelectorOpen, setServiceSelectorOpen] = useState(false);
  const [timeSelectorOpen, setTimeSelectorOpen] = useState(false);
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

  const dateData = useMemo(() => {
    return {
      dayName: weekDays[selectedDate.getDay()],
      dayNumber: selectedDate.getDate(),
      monthName: monthNames[selectedDate.getMonth()],
    };
  }, [selectedDate]);

  useEffect(() => {
    let isMounted = true;
    const loadAppointments = async () => {
      setIsLoading(true);
      const storedAppointments = await getOwnerAppointmentsByDate(selectedDate);
      if (!isMounted) return;
      setAppointments(storedAppointments);
      setIsLoading(false);
    };
    void loadAppointments();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  const selectedService = useMemo(
    () => services.find((item) => item.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );

  const timeToMinutes = useCallback((time: string) => {
    const [hhText, mmText] = time.split(":");
    const hh = Number(hhText);
    const mm = Number(mmText);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) {
      return null;
    }
    return hh * 60 + mm;
  }, []);

  const resolveTimeSection = useCallback(
    (time: string): TimeSectionKey => {
      const minutes = timeToMinutes(time);
      if (minutes === null) {
        return "night";
      }

      if (minutes >= 360 && minutes < 720) {
        return "morning";
      }

      if (minutes >= 720 && minutes < 1080) {
        return "afternoon";
      }

      return "night";
    },
    [timeToMinutes],
  );

  const requiredBlocks = useMemo(() => {
    const duration = Number(selectedService?.duration ?? 30);
    if (!Number.isFinite(duration) || duration <= 0) {
      return 1;
    }
    return Math.ceil(duration / 30);
  }, [selectedService]);

  const openAddModal = async () => {
    const loaded = await getOwnerServices();
    const activeServices = loaded.filter((item) => item.active);
    setServices(activeServices);
    setSelectedServiceId((current) => {
      const stillExists = activeServices.some((item) => item.id === current);
      if (stillExists) {
        return current;
      }
      return activeServices[0]?.id || "";
    });
    setNewTime("");
    setServiceSelectorOpen(true);
    setTimeSelectorOpen(false);
    setAddModalVisible(true);

    if (!activeServices.length) {
      setToast({
        visible: true,
        message: "No hay servicios activos para agendar.",
        type: "error",
      });
    }
  };

  const closeAddModal = () => {
    setAddModalVisible(false);
    setNewClient("");
    setNewTime("");
    setServiceSelectorOpen(false);
    setTimeSelectorOpen(false);
  };

  const availableStartTimes = useMemo(() => {
    const sorted = [...appointments].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
    const result: string[] = [];

    for (let start = 0; start < sorted.length; start += 1) {
      const first = sorted[start];
      if (first.status !== "libre") {
        continue;
      }

      const baseMinute = timeToMinutes(first.time);
      if (baseMinute === null) {
        continue;
      }

      let ok = true;
      for (let step = 0; step < requiredBlocks; step += 1) {
        const slot = sorted[start + step];
        if (!slot || slot.status !== "libre") {
          ok = false;
          break;
        }

        const slotMinute = timeToMinutes(slot.time);
        if (slotMinute === null || slotMinute !== baseMinute + step * 30) {
          ok = false;
          break;
        }
      }

      if (ok) {
        result.push(first.time);
      }
    }

    return result;
  }, [appointments, requiredBlocks, timeToMinutes]);

  const visibleAppointments = useMemo(
    () => appointments.filter((item) => item.status !== "bloqueado"),
    [appointments],
  );

  const groupedAppointments = useMemo(() => {
    return timeSections.map((section) => ({
      ...section,
      items: visibleAppointments.filter(
        (item) => resolveTimeSection(item.time) === section.key,
      ),
    }));
  }, [resolveTimeSection, visibleAppointments]);

  const activeGroupedAppointments = useMemo(
    () =>
      groupedAppointments.filter(
        (section) => section.key === selectedTimeSection,
      ),
    [groupedAppointments, selectedTimeSection],
  );

  const groupedAvailableStartTimes = useMemo(() => {
    return timeSections.map((section) => ({
      ...section,
      items: availableStartTimes.filter(
        (time) => resolveTimeSection(time) === section.key,
      ),
    }));
  }, [availableStartTimes, resolveTimeSection]);

  const canSaveManualAppointment =
    Boolean(newClient.trim()) &&
    Boolean(selectedService) &&
    Boolean(newTime.trim()) &&
    availableStartTimes.includes(newTime.trim()) &&
    !isProcessing;

  // Handlers (markInProgress, markNoShow, deleteAppointment, handleAddAppointment permanecen iguales en lógica)
  const markInProgress = async (id: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const nextAppointments: OwnerAppointment[] = appointments.map((item) =>
      item.id === id ? { ...item, status: "en_progreso" } : item,
    );
    setAppointments(nextAppointments);
    await saveOwnerAppointmentsByDate(selectedDate, nextAppointments);
    setToast({ visible: true, message: "Turno iniciado", type: "success" });
    setIsProcessing(false);
  };

  const markNoShow = async (id: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const nextAppointments: OwnerAppointment[] = appointments.map((item) =>
      item.id === id ? { ...item, status: "no_asistio" } : item,
    );
    setAppointments(nextAppointments);
    await saveOwnerAppointmentsByDate(selectedDate, nextAppointments);
    setToast({
      visible: true,
      message: "Marcado como no asistió",
      type: "info",
    });
    setIsProcessing(false);
  };

  const confirmDelete = (id: string) => {
    Alert.alert("Eliminar turno", "¿Deseas quitar este turno de la agenda?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const next = appointments.filter((a) => a.id !== id);
          setAppointments(next);
          await saveOwnerAppointmentsByDate(selectedDate, next);
        },
      },
    ]);
  };

  const handleAddAppointment = async () => {
    if (!newClient.trim() || !selectedService || !newTime.trim()) {
      setToast({
        visible: true,
        message: "Completa todos los campos",
        type: "error",
      });
      return;
    }

    if (!availableStartTimes.includes(newTime.trim())) {
      setToast({
        visible: true,
        message: "El horario no es válido para un bloque consecutivo.",
        type: "error",
      });
      return;
    }

    setIsProcessing(true);
    const sorted = [...appointments].sort((a, b) =>
      a.time.localeCompare(b.time),
    );
    const startIndex = sorted.findIndex((item) => item.time === newTime.trim());

    if (startIndex === -1) {
      setToast({
        visible: true,
        message: "Horario no encontrado",
        type: "error",
      });
      setIsProcessing(false);
      return;
    }

    const targetIds = sorted
      .slice(startIndex, startIndex + requiredBlocks)
      .map((item) => item.id);

    const firstId = targetIds[0];
    const next: OwnerAppointment[] = appointments
      .map((item) => {
        if (!targetIds.includes(item.id)) {
          return item;
        }

        if (item.id === firstId) {
          return {
            ...item,
            client: newClient.trim(),
            service: selectedService.serviceName,
            status: "pendiente" as const,
          };
        }

        return {
          ...item,
          client: "Bloqueado",
          service: `Bloque ${selectedService.serviceName}`,
          status: "bloqueado" as const,
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    setAppointments(next);
    await saveOwnerAppointmentsByDate(selectedDate, next);
    setAddModalVisible(false);
    setNewClient("");
    setNewTime("");
    setToast({
      visible: true,
      message: `Turno agregado (${requiredBlocks} bloque(s) de 30 min)`,
      type: "success",
    });
    setIsProcessing(false);
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* HEADER PREMIUM */}
      <View style={styles.headerContainer}>
        <View style={styles.topRow}>
          <Pressable
            style={styles.menuBtn}
            onPress={() => router.replace("/barber/owner-more-settings")}
          >
            <MaterialIcons name="notes" size={26} color="#d4af37" />
          </Pressable>
          <Text style={styles.brandTitle}>AGENDA</Text>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLleSA-Lg0D-i1xnyNZBfM_20VjtcTg9K03sBcQObgygOMEqRkjNP7RpPb1ieDZ9q7BOKKQYaXazN36uekOYvwqFaDWY5w4e73uBIw5ggMhfO10cDTaInO4ABEKzWhhSWigzO7FjQW4SvjYtR6p5lthpVkPawQmjQamF9LuwbNOB9YEtHmkQii4mqaHJtl9B-_10h_mIX8cMUvITC5l-3lz21FqgRxPpdnHtZRiity7wZBryrbJLIkvV2oa2DkcMmUU20fAXlxX58Z",
            }}
            style={styles.headerAvatar}
          />
        </View>

        <View style={styles.calendarStrip}>
          <Pressable
            style={styles.navBtn}
            onPress={() => setDayOffset((d) => d - 1)}
          >
            <MaterialIcons name="keyboard-arrow-left" size={28} color="#666" />
          </Pressable>
          <View style={styles.dateFocus}>
            <Text style={styles.dateFocusDay}>{dateData.dayName}</Text>
            <Text style={styles.dateFocusMain}>
              {dateData.dayNumber} {dateData.monthName}
            </Text>
          </View>
          <Pressable
            style={styles.navBtn}
            onPress={() => setDayOffset((d) => d + 1)}
          >
            <MaterialIcons name="keyboard-arrow-right" size={28} color="#666" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryBadge}>
            <Text style={styles.summaryText}>
              {
                appointments.filter(
                  (a) => a.status !== "libre" && a.status !== "bloqueado",
                ).length
              }{" "}
              Citas hoy
            </Text>
          </View>
          <Text style={styles.locationText}>Sede Centro</Text>
        </View>

        <View style={styles.timeFilterRow}>
          {timeSections.map((section) => {
            const isActive = section.key === selectedTimeSection;
            return (
              <Pressable
                key={section.key}
                style={[
                  styles.timeFilterButton,
                  isActive && styles.timeFilterButtonActive,
                ]}
                onPress={() => setSelectedTimeSection(section.key)}
              >
                <Text
                  style={[
                    styles.timeFilterButtonText,
                    isActive && styles.timeFilterButtonTextActive,
                  ]}
                >
                  {section.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <Skeleton style={{ width: 50, height: 20, borderRadius: 4 }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton
                    style={{ width: "70%", height: 18, borderRadius: 4 }}
                  />
                  <Skeleton
                    style={{ width: "40%", height: 14, borderRadius: 4 }}
                  />
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            {activeGroupedAppointments.map((section) => (
              <View key={section.key} style={styles.scheduleSection}>
                <Text style={styles.scheduleSectionTitle}>{section.label}</Text>
                {section.items.map((item, index) => (
                  <View key={item.id} style={styles.timelineItem}>
                    <View style={styles.timeSection}>
                      <Text
                        style={[
                          styles.timeText,
                          item.status === "libre" && styles.timeMuted,
                        ]}
                      >
                        {item.time}
                      </Text>
                      <View
                        style={[
                          styles.timelineNode,
                          item.status !== "libre" && styles.nodeActive,
                        ]}
                      />
                      {index !== section.items.length - 1 && (
                        <View style={styles.timelineConnector} />
                      )}
                    </View>

                    <View
                      style={[
                        styles.appointmentCard,
                        item.status === "en_progreso" && styles.cardProgress,
                        item.status === "libre" && styles.cardLibre,
                      ]}
                    >
                      <View style={styles.cardHeader}>
                        <View style={styles.cardInfo}>
                          <Text
                            style={[
                              styles.clientName,
                              item.status === "libre" && styles.textLibre,
                            ]}
                          >
                            {item.client}
                          </Text>
                          <Text style={styles.serviceName}>{item.service}</Text>
                        </View>
                        {item.status !== "libre" && (
                          <Pressable onPress={() => confirmDelete(item.id)}>
                            <MaterialIcons
                              name="more-vert"
                              size={20}
                              color="#444"
                            />
                          </Pressable>
                        )}
                      </View>

                      {item.status === "pendiente" && (
                        <View style={styles.actionRow}>
                          <Pressable
                            style={styles.btnNoShow}
                            onPress={() => markNoShow(item.id)}
                          >
                            <Text style={styles.btnNoShowText}>Faltó</Text>
                          </Pressable>
                          <Pressable
                            style={styles.btnStart}
                            onPress={() => markInProgress(item.id)}
                          >
                            <Text style={styles.btnStartText}>Iniciar</Text>
                            <MaterialIcons
                              name="play-arrow"
                              size={16}
                              color="#000"
                            />
                          </Pressable>
                        </View>
                      )}

                      {item.status === "en_progreso" && (
                        <View style={styles.progressBadge}>
                          <View style={styles.pulseDot} />
                          <Text style={styles.progressText}>TRABAJANDO</Text>
                        </View>
                      )}

                      {item.status === "no_asistio" && (
                        <Text style={styles.noShowLabel}>Ausente</Text>
                      )}
                    </View>
                  </View>
                ))}
                {!section.items.length ? (
                  <View style={styles.emptySectionState}>
                    <Text style={styles.emptySectionText}>
                      No hay turnos en este bloque.
                    </Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* FAB AGREGAR */}
      <Pressable style={styles.fab} onPress={() => void openAddModal()}>
        <LinearGradient
          colors={["#d4af37", "#f2ca50"]}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={30} color="#000" />
        </LinearGradient>
      </Pressable>

      {/* MODAL BOTTOM SHEET STYLE */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Nuevo Turno Manual</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cliente</Text>
              <TextInput
                style={styles.sheetInput}
                placeholder="Nombre del cliente"
                placeholderTextColor="#444"
                value={newClient}
                onChangeText={setNewClient}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Servicio</Text>
              {!services.length ? (
                <View style={styles.emptySelectorState}>
                  <Text style={styles.helperText}>
                    No tienes servicios activos para seleccionar.
                  </Text>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => {
                      setAddModalVisible(false);
                      router.push("/barber/edit-service");
                    }}
                  >
                    <Text style={styles.linkButtonText}>Ir a Servicios</Text>
                  </Pressable>
                </View>
              ) : null}
              {services.length ? (
                <>
                  <Pressable
                    style={[
                      styles.selectorButton,
                      serviceSelectorOpen && styles.selectorButtonActive,
                    ]}
                    onPress={() => {
                      setServiceSelectorOpen((current) => !current);
                      setTimeSelectorOpen(false);
                    }}
                  >
                    <View style={styles.selectorButtonTextWrap}>
                      <Text style={styles.selectorButtonLabel}>
                        Elegir servicio
                      </Text>
                      <Text style={styles.selectorButtonValue}>
                        {selectedService
                          ? `${selectedService.serviceName} · ${selectedService.duration} min`
                          : "Selecciona un servicio activo"}
                      </Text>
                    </View>
                    <MaterialIcons
                      name={serviceSelectorOpen ? "expand-less" : "expand-more"}
                      size={24}
                      color="#d4af37"
                    />
                  </Pressable>

                  {serviceSelectorOpen ? (
                    <View style={styles.selectorPanel}>
                      {services.map((service) => {
                        const selected = service.id === selectedServiceId;
                        return (
                          <Pressable
                            key={service.id}
                            style={[
                              styles.selectorOption,
                              selected && styles.selectorOptionSelected,
                            ]}
                            onPress={() => {
                              setSelectedServiceId(service.id);
                              setNewTime("");
                              setTimeSelectorOpen(true);
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.selectorOptionTitle,
                                  selected &&
                                    styles.selectorOptionTitleSelected,
                                ]}
                              >
                                {service.serviceName}
                              </Text>
                              <Text style={styles.selectorOptionMeta}>
                                {service.category} · {service.duration} min · $
                                {service.price}
                              </Text>
                            </View>
                            {selected ? (
                              <MaterialIcons
                                name="check-circle"
                                size={20}
                                color="#d4af37"
                              />
                            ) : (
                              <MaterialIcons
                                name="chevron-right"
                                size={20}
                                color="#555"
                              />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Horario</Text>
              <Text style={styles.helperText}>
                Turnos requeridos: {requiredBlocks} bloque(s) de 30 min
              </Text>
              <Pressable
                style={[
                  styles.selectorButton,
                  !selectedService && styles.selectorButtonDisabled,
                  timeSelectorOpen && styles.selectorButtonActive,
                ]}
                disabled={!selectedService}
                onPress={() => {
                  if (!selectedService) {
                    return;
                  }
                  setTimeSelectorOpen((current) => !current);
                  setServiceSelectorOpen(false);
                }}
              >
                <View style={styles.selectorButtonTextWrap}>
                  <Text style={styles.selectorButtonLabel}>Elegir horario</Text>
                  <Text style={styles.selectorButtonValue}>
                    {newTime || "Selecciona un horario disponible"}
                  </Text>
                </View>
                <MaterialIcons
                  name={timeSelectorOpen ? "expand-less" : "expand-more"}
                  size={24}
                  color={selectedService ? "#d4af37" : "#555"}
                />
              </Pressable>

              {timeSelectorOpen ? (
                <View style={styles.selectorPanel}>
                  {groupedAvailableStartTimes.map((section) => (
                    <View key={section.key} style={styles.modalTimeSection}>
                      <Text style={styles.modalTimeSectionTitle}>
                        {section.label}
                      </Text>
                      {section.items.map((time) => {
                        const selected = newTime === time;
                        return (
                          <Pressable
                            key={time}
                            style={[
                              styles.selectorOption,
                              selected && styles.selectorOptionSelected,
                            ]}
                            onPress={() => setNewTime(time)}
                          >
                            <Text
                              style={[
                                styles.selectorOptionTitle,
                                selected && styles.selectorOptionTitleSelected,
                              ]}
                            >
                              {time}
                            </Text>
                            {selected ? (
                              <MaterialIcons
                                name="check-circle"
                                size={20}
                                color="#d4af37"
                              />
                            ) : null}
                          </Pressable>
                        );
                      })}
                    </View>
                  ))}
                  {!availableStartTimes.length ? (
                    <View style={styles.timeChipDisabled}>
                      <Text style={styles.timeChipDisabledText}>
                        Sin horarios disponibles
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              {selectedService && !availableStartTimes.length ? (
                <Text style={styles.helperText}>
                  No hay bloques consecutivos disponibles para este servicio.
                </Text>
              ) : null}
            </View>

            <View style={styles.sheetActions}>
              <Pressable style={styles.sheetBtnCancel} onPress={closeAddModal}>
                <Text style={styles.sheetBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.sheetBtnConfirm,
                  !canSaveManualAppointment && styles.sheetBtnConfirmDisabled,
                ]}
                disabled={!canSaveManualAppointment}
                onPress={handleAddAppointment}
              >
                <Text style={styles.sheetBtnConfirmText}>Guardar Turno</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <BarberRoleNav mode="owner" current="agenda" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  headerContainer: {
    paddingTop: 50,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
    paddingBottom: 15,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  menuBtn: { width: 40 },
  brandTitle: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 4,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },

  calendarStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
  },
  navBtn: { padding: 5 },
  dateFocus: { alignItems: "center" },
  dateFocusDay: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateFocusMain: { color: "#FFF", fontSize: 20, fontWeight: "900" },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },
  summaryBadge: {
    backgroundColor: "rgba(212,175,55,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  summaryText: { color: "#d4af37", fontSize: 12, fontWeight: "800" },
  locationText: { color: "#444", fontSize: 12, fontWeight: "700" },
  timeFilterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  timeFilterButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121212",
  },
  timeFilterButtonActive: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(212,175,55,0.2)",
  },
  timeFilterButtonText: {
    color: "#777",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  timeFilterButtonTextActive: {
    color: "#f2ca50",
  },

  timelineContainer: { paddingLeft: 10 },
  scheduleSection: { marginBottom: 24 },
  scheduleSectionTitle: {
    color: "#d4af37",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  timelineItem: { flexDirection: "row", marginBottom: 15, minHeight: 80 },
  timeSection: { width: 60, alignItems: "center", paddingTop: 5 },
  timeText: { color: "#FFF", fontSize: 14, fontWeight: "900" },
  timeMuted: { color: "#333" },
  timelineNode: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#222",
    marginTop: 8,
    zIndex: 2,
  },
  nodeActive: {
    backgroundColor: "#d4af37",
    shadowColor: "#d4af37",
    shadowRadius: 5,
    shadowOpacity: 0.5,
    elevation: 5,
  },
  timelineConnector: {
    position: "absolute",
    top: 35,
    bottom: -20,
    width: 2,
    backgroundColor: "#1A1A1A",
  },

  appointmentCard: {
    flex: 1,
    backgroundColor: "#111",
    marginLeft: 15,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  cardLibre: {
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderColor: "#222",
  },
  cardProgress: { borderColor: "#d4af3733", backgroundColor: "#161410" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: { flex: 1 },
  clientName: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  textLibre: { color: "#333" },
  serviceName: { color: "#666", fontSize: 12, marginTop: 2, fontWeight: "600" },

  actionRow: { flexDirection: "row", gap: 10, marginTop: 15 },
  btnNoShow: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  btnNoShowText: { color: "#666", fontSize: 12, fontWeight: "700" },
  btnStart: {
    flex: 1.5,
    height: 38,
    backgroundColor: "#d4af37",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  btnStartText: { color: "#000", fontSize: 12, fontWeight: "900" },

  progressBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d4af37",
  },
  progressText: { color: "#d4af37", fontSize: 10, fontWeight: "900" },
  noShowLabel: {
    color: "#ff4444",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 12,
    textTransform: "uppercase",
  },
  emptySectionState: {
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D0D0D",
  },
  emptySectionText: { color: "#666", fontSize: 12, fontWeight: "700" },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 90,
    borderRadius: 30,
    elevation: 8,
    shadowColor: "#d4af37",
    shadowRadius: 15,
    shadowOpacity: 0.3,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingContainer: { gap: 15 },
  skeletonCard: {
    flexDirection: "row",
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 20,
    gap: 15,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 25,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 15 },
  inputLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginLeft: 5,
  },
  helperText: { color: "#777", fontSize: 11, marginTop: 6, marginLeft: 5 },
  emptySelectorState: {
    borderWidth: 1,
    borderColor: "#2a2a2a",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#0A0A0A",
    marginBottom: 8,
  },
  linkButton: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#d4af37",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkButtonText: { color: "#f2ca50", fontSize: 12, fontWeight: "800" },
  selectorButton: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorButtonActive: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(212,175,55,0.14)",
  },
  selectorButtonDisabled: {
    opacity: 0.55,
  },
  selectorButtonTextWrap: { flex: 1, paddingRight: 12 },
  selectorButtonLabel: {
    color: "#777",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  selectorButtonValue: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  selectorPanel: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0B0B0B",
    padding: 10,
    gap: 8,
  },
  selectorOption: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  selectorOptionSelected: {
    borderColor: "#d4af37",
    backgroundColor: "rgba(212,175,55,0.14)",
  },
  selectorOptionTitle: { color: "#ddd", fontSize: 13, fontWeight: "800" },
  selectorOptionTitleSelected: { color: "#f2ca50" },
  selectorOptionMeta: { color: "#777", fontSize: 11, marginTop: 3 },
  modalTimeSection: { gap: 8 },
  modalTimeSectionTitle: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginTop: 2,
    marginBottom: 2,
  },
  timeChipDisabled: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    backgroundColor: "#0A0A0A",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  timeChipDisabledText: { color: "#666", fontSize: 12, fontWeight: "700" },
  sheetInput: {
    backgroundColor: "#0A0A0A",
    borderRadius: 15,
    height: 55,
    paddingHorizontal: 15,
    color: "#FFF",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  sheetActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  sheetBtnCancel: {
    flex: 1,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  sheetBtnCancelText: { color: "#666", fontWeight: "800" },
  sheetBtnConfirm: {
    flex: 2,
    height: 55,
    backgroundColor: "#d4af37",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBtnConfirmDisabled: {
    backgroundColor: "#6e5f2a",
    opacity: 0.6,
  },
  sheetBtnConfirmText: { color: "#000", fontWeight: "900" },
});
