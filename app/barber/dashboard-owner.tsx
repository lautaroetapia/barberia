import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { getOwnedBarbershopProfile } from "@/lib/owned-barbershop";
import {
    getOwnerAppointmentsByDate,
    saveOwnerAppointmentsByDate,
    type OwnerAppointment,
} from "@/lib/owner-agenda";
import { getOwnerServices } from "@/lib/owner-services";

export default function DashboardOwnerScreen() {
  const [barbershopName, setBarbershopName] = useState("Centro");
  const [barbershopImageUri, setBarbershopImageUri] = useState("");
  const [scheduledCount, setScheduledCount] = useState(0);
  const [occupancyPercent, setOccupancyPercent] = useState(0);
  const [estimatedSales, setEstimatedSales] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    OwnerAppointment[]
  >([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<OwnerAppointment | null>(null);
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadOwnedBarbershop = async () => {
      const profile = await getOwnedBarbershopProfile();
      if (!isMounted || !profile?.name.trim()) {
        return;
      }

      setBarbershopName(profile.name.trim());
      setBarbershopImageUri(profile.imageUri ?? "");
    };

    void loadOwnedBarbershop();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadDashboardData = useCallback(async () => {
    const [appointments, services] = await Promise.all([
      getOwnerAppointmentsByDate(new Date()),
      getOwnerServices(),
    ]);

    const scheduled = appointments.filter((item) => item.status !== "libre");
    const totalSlots = Math.max(appointments.length, 1);

    const servicesPriceMap = new Map(
      services.map((item) => [
        item.serviceName.toLowerCase(),
        Number(item.price),
      ]),
    );

    const sales = scheduled.reduce((acc, item) => {
      const guessedPrice =
        servicesPriceMap.get(item.service.toLowerCase()) ??
        Number(services[0]?.price ?? 0) ??
        0;
      return acc + guessedPrice;
    }, 0);

    setScheduledCount(scheduled.length);
    setOccupancyPercent(Math.round((scheduled.length / totalSlots) * 100));
    setEstimatedSales(sales);
    setUpcomingAppointments(scheduled.slice(0, 3));
  }, []);

  const updateSelectedAppointmentStatus = async (
    nextStatus: OwnerAppointment["status"],
  ) => {
    if (!selectedAppointment || isUpdatingAppointment) {
      return;
    }

    setIsUpdatingAppointment(true);

    try {
      const todaysAppointments = await getOwnerAppointmentsByDate(new Date());
      const nextAppointments = todaysAppointments.map((item) =>
        item.id === selectedAppointment.id
          ? { ...item, status: nextStatus }
          : item,
      );

      await saveOwnerAppointmentsByDate(new Date(), nextAppointments);
      setSelectedAppointment(null);
      await loadDashboardData();
    } finally {
      setIsUpdatingAppointment(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadDashboardData();
    }, [loadDashboardData]),
  );

  const formattedSales = useMemo(
    () => `$${estimatedSales.toLocaleString("es-AR")}`,
    [estimatedSales],
  );

  return (
    <View style={styles.screen}>
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
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-gShRIXoAB9uLCNYdDnp5OwO3Buw86RltNYz7jQR7jRoYclyu8mxhPPR_Yq4BG0szG4I-CTRNiTPYxdDsMYztxw4E8s_6ZcD7yjCEWVJHNc-DV5_gqo4JXxOhXVDsHV8wf5m1tmQiLbLdoTfeF_T3B4XAty3Kome2hXGXbmh1uDRuYXU-5I7ZIQGPXKFiLT6MAI-PkHyvocQmmh2bOzPWzp7jlLgmLjDvBPaluMennCUFRiclN6oyA9MMvvlpDu4uteupVxmL5Lmv",
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
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Dueno · {barbershopName}</Text>

        <Pressable
          style={styles.barbershopCard}
          onPress={() => router.push("/barber/owner-barbershop-profile")}
        >
          <View style={styles.barbershopImageWrap}>
            {barbershopImageUri ? (
              <Image
                source={{ uri: barbershopImageUri }}
                style={styles.barbershopImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.barbershopImageFallback}>
                <MaterialIcons name="storefront" size={20} color="#d0c5af" />
              </View>
            )}
          </View>
          <View style={styles.barbershopCardBody}>
            <Text style={styles.barbershopCardTitle}>{barbershopName}</Text>
            <Text style={styles.barbershopCardSubtitle}>
              Barberia principal
            </Text>
          </View>
          <MaterialIcons name="edit" size={18} color="#f2ca50" />
        </Pressable>

        <View style={styles.cardFeatured}>
          <View style={styles.goldLine} />
          <Text style={styles.cardLabel}>Ventas hoy</Text>
          <Text style={styles.cardValue}>{formattedSales}</Text>
          <Text style={styles.cardTrend}>Calculado desde turnos del dia</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Turnos</Text>
            <Text style={styles.kpiValue}>{scheduledCount}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ocupacion</Text>
            <Text style={styles.kpiValue}>{occupancyPercent}%</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Proximos turnos</Text>

        {upcomingAppointments.map((item) => (
          <Pressable
            key={item.id}
            style={styles.appointmentCard}
            onPress={() => setSelectedAppointment(item)}
          >
            <Text style={styles.appointmentTime}>{item.time}</Text>
            <View style={styles.appointmentBody}>
              <Text style={styles.appointmentName}>{item.client}</Text>
              <Text style={styles.appointmentService}>{item.service}</Text>
            </View>
            <MaterialIcons name="more-horiz" size={18} color="#d0c5af" />
          </Pressable>
        ))}

        {!upcomingAppointments.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              No hay turnos proximos para hoy.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(selectedAppointment)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAppointment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Detalle del turno</Text>

            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Hora</Text>
              <Text style={styles.modalInfoValue}>
                {selectedAppointment?.time ?? "-"}
              </Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Cliente</Text>
              <Text style={styles.modalInfoValue}>
                {selectedAppointment?.client ?? "-"}
              </Text>
            </View>
            <View style={styles.modalInfoRow}>
              <Text style={styles.modalInfoLabel}>Servicio</Text>
              <Text style={styles.modalInfoValue}>
                {selectedAppointment?.service ?? "-"}
              </Text>
            </View>

            <Pressable
              style={styles.modalAgendaButton}
              onPress={() => {
                setSelectedAppointment(null);
                router.push("/barber/owner-agenda");
              }}
            >
              <MaterialIcons name="event-note" size={16} color="#241a00" />
              <Text style={styles.modalAgendaButtonText}>Ver en Agenda</Text>
            </Pressable>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  void updateSelectedAppointmentStatus("no_asistio");
                }}
                disabled={isUpdatingAppointment}
              >
                <Text style={styles.modalCancelText}>No asistio</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                onPress={() => {
                  void updateSelectedAppointmentStatus("en_progreso");
                }}
                disabled={isUpdatingAppointment}
              >
                <Text style={styles.modalConfirmText}>
                  {isUpdatingAppointment ? "Actualizando..." : "Iniciar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BarberRoleNav mode="owner" current="dashboard" />
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
    paddingTop: 12,
    paddingBottom: 110,
    gap: 14,
  },
  title: { color: "#e5e2e1", fontSize: 34, fontWeight: "800" },
  subtitle: { color: "#d0c5af", fontSize: 12 },
  barbershopCard: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  barbershopImageWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
  },
  barbershopImage: {
    width: "100%",
    height: "100%",
  },
  barbershopImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  barbershopCardBody: { flex: 1 },
  barbershopCardTitle: {
    color: "#e5e2e1",
    fontSize: 15,
    fontWeight: "700",
  },
  barbershopCardSubtitle: {
    color: "#99907c",
    fontSize: 12,
    marginTop: 2,
  },
  cardFeatured: {
    marginTop: 6,
    borderRadius: 14,
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    overflow: "hidden",
  },
  goldLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#d4af37",
  },
  cardLabel: {
    color: "#d0c5af",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardValue: {
    color: "#e5e2e1",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 4,
  },
  cardTrend: {
    color: "#f2ca50",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
  },
  kpiLabel: {
    color: "#99907c",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  kpiValue: { color: "#e5e2e1", fontSize: 28, fontWeight: "800", marginTop: 6 },
  sectionTitle: {
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 10,
  },
  appointmentCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appointmentTime: {
    color: "#f2ca50",
    fontSize: 16,
    fontWeight: "800",
    width: 52,
  },
  appointmentBody: { flex: 1 },
  appointmentName: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  appointmentService: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    backgroundColor: "#1c1b1b",
    padding: 14,
  },
  emptyText: { color: "#d0c5af", fontSize: 12 },
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
  modalInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalInfoLabel: { color: "#99907c", fontSize: 12 },
  modalInfoValue: { color: "#e5e2e1", fontSize: 14, fontWeight: "700" },
  modalAgendaButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  modalAgendaButtonText: { color: "#241a00", fontSize: 13, fontWeight: "800" },
  modalActions: { flexDirection: "row", gap: 8 },
  modalCancelButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { color: "#ffb4ab", fontSize: 13, fontWeight: "700" },
  modalConfirmButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: { color: "#f2ca50", fontSize: 13, fontWeight: "800" },
});
