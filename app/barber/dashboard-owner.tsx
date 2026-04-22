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
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

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
  const [upcomingAppointments, setUpcomingAppointments] = useState<OwnerAppointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<OwnerAppointment | null>(null);
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);

  // ... (Lógica de carga de datos idéntica a la original para mantener funcionalidad)
  useEffect(() => {
    let isMounted = true;
    const loadOwnedBarbershop = async () => {
      const profile = await getOwnedBarbershopProfile();
      if (!isMounted || !profile?.name.trim()) return;
      setBarbershopName(profile.name.trim());
      setBarbershopImageUri(profile.imageUri ?? "");
    };
    void loadOwnedBarbershop();
    return () => { isMounted = false; };
  }, []);

  const loadDashboardData = useCallback(async () => {
    const [appointments, services] = await Promise.all([
      getOwnerAppointmentsByDate(new Date()),
      getOwnerServices(),
    ]);
    const scheduled = appointments.filter((item) => item.status !== "libre");
    const totalSlots = Math.max(appointments.length, 1);
    const servicesPriceMap = new Map(services.map((item) => [item.serviceName.toLowerCase(), Number(item.price)]));
    const sales = scheduled.reduce((acc, item) => {
      const guessedPrice = servicesPriceMap.get(item.service.toLowerCase()) ?? Number(services[0]?.price ?? 0) ?? 0;
      return acc + guessedPrice;
    }, 0);
    setScheduledCount(scheduled.length);
    setOccupancyPercent(Math.round((scheduled.length / totalSlots) * 100));
    setEstimatedSales(sales);
    setUpcomingAppointments(scheduled.slice(0, 3));
  }, []);

  const updateSelectedAppointmentStatus = async (nextStatus: OwnerAppointment["status"]) => {
    if (!selectedAppointment || isUpdatingAppointment) return;
    setIsUpdatingAppointment(true);
    try {
      const todaysAppointments = await getOwnerAppointmentsByDate(new Date());
      const nextAppointments = todaysAppointments.map((item) =>
        item.id === selectedAppointment.id ? { ...item, status: nextStatus } : item
      );
      await saveOwnerAppointmentsByDate(new Date(), nextAppointments);
      setSelectedAppointment(null);
      await loadDashboardData();
    } finally { setIsUpdatingAppointment(false); }
  };

  useFocusEffect(useCallback(() => { void loadDashboardData(); }, [loadDashboardData]));

  const formattedSales = useMemo(() => `$${estimatedSales.toLocaleString("es-AR")}`, [estimatedSales]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.replace("/barber/owner-more-settings")}>
          <MaterialIcons name="segment" size={26} color="#d4af37" />
        </Pressable>
        <View style={styles.brandContainer}>
          <Text style={styles.brandText}>NAVAJA DORADA</Text>
          <View style={styles.brandDot} />
        </View>
        <Pressable style={styles.avatarWrap} onPress={() => router.push("/(tabs)/profile")}>
          <Image
            source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-gShRIXoAB9uLCNYdDnp5OwO3Buw86RltNYz7jQR7jRoYclyu8mxhPPR_Yq4BG0szG4I-CTRNiTPYxdDsMYztxw4E8s_6ZcD7yjCEWVJHNc-DV5_gqo4JXxOhXVDsHV8wf5m1tmQiLbLdoTfeF_T3B4XAty3Kome2hXGXbmh1uDRuYXU-5I7ZIQGPXKFiLT6MAI-PkHyvocQmmh2bOzPWzp7jlLgmLjDvBPaluMennCUFRiclN6oyA9MMvvlpDu4uteupVxmL5Lmv" }}
            style={styles.avatar}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeHeader}>
          <Text style={styles.title}>Panel General</Text>
          <View style={styles.statusBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>EN VIVO</Text>
          </View>
        </View>

        {/* BARBERSHOP CARD */}
        <Pressable style={styles.shopCard} onPress={() => router.push("/barber/owner-barbershop-profile")}>
          <View style={styles.shopImageContainer}>
            {barbershopImageUri ? (
              <Image source={{ uri: barbershopImageUri }} style={styles.shopImage} contentFit="cover" />
            ) : (
              <MaterialIcons name="storefront" size={22} color="#d4af37" />
            )}
          </View>
          <View style={styles.shopInfo}>
            <Text style={styles.shopName}>{barbershopName}</Text>
            <Text style={styles.shopRole}>Sede Principal</Text>
          </View>
          <View style={styles.editIconCircle}>
            <MaterialIcons name="settings" size={16} color="#000" />
          </View>
        </Pressable>

        {/* SALES CARD */}
        <View style={styles.salesCard}>
          <LinearGradient colors={["#1A1A1A", "#111"]} style={styles.salesGradient}>
            <View style={styles.salesHeader}>
              <Text style={styles.salesLabel}>INGRESOS ESTIMADOS HOY</Text>
              <MaterialIcons name="trending-up" size={18} color="#d4af37" />
            </View>
            <Text style={styles.salesValue}>{formattedSales}</Text>
            <Text style={styles.salesFooter}>Turnos agendados hasta el momento</Text>
          </LinearGradient>
        </View>

        {/* KPI GRID */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>TURNOS</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{scheduledCount}</Text>
              <MaterialIcons name="event" size={20} color="#333" />
            </View>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>OCUPACIÓN</Text>
            <View style={styles.kpiValueRow}>
              <Text style={styles.kpiValue}>{occupancyPercent}%</Text>
              <View style={styles.occupancyTrack}>
                <View style={[styles.occupancyFill, { width: `${occupancyPercent}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* APPOINTMENTS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Siguientes Turnos</Text>
          <Pressable onPress={() => router.push("/barber/owner-agenda")}>
            <Text style={styles.viewAll}>VER AGENDA</Text>
          </Pressable>
        </View>

        <View style={styles.appointmentsContainer}>
          {upcomingAppointments.map((item, index) => (
            <Pressable key={item.id} style={styles.appoCard} onPress={() => setSelectedAppointment(item)}>
              <View style={styles.timeColumn}>
                <Text style={styles.appoTime}>{item.time}</Text>
                <View style={styles.timeLine} />
              </View>
              <View style={styles.appoBody}>
                <Text style={styles.appoClient}>{item.client}</Text>
                <Text style={styles.appoService}>{item.service}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#444" />
            </Pressable>
          ))}

          {!upcomingAppointments.length && (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-busy" size={32} color="#222" />
              <Text style={styles.emptyText}>No hay actividad próxima</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* MODAL DETALLE */}
      <Modal visible={Boolean(selectedAppointment)} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalHeaderTitle}>Acciones de Turno</Text>
            
            <View style={styles.modalDetailBox}>
               <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cliente</Text>
                  <Text style={styles.detailValue}>{selectedAppointment?.client}</Text>
               </View>
               <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Servicio</Text>
                  <Text style={styles.detailValue}>{selectedAppointment?.service}</Text>
               </View>
               <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Horario</Text>
                  <Text style={styles.detailValue}>{selectedAppointment?.time}</Text>
               </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.actionBtnOutline} onPress={() => updateSelectedAppointmentStatus("no_asistio")}>
                <Text style={styles.actionTextCancel}>Marcar Falta</Text>
              </Pressable>
              
              <LinearGradient colors={["#d4af37", "#b8962e"]} style={styles.actionBtnGradient}>
                <Pressable style={styles.actionBtnPress} onPress={() => updateSelectedAppointmentStatus("en_progreso")}>
                  <Text style={styles.actionTextConfirm}>INICIAR SERVICIO</Text>
                </Pressable>
              </LinearGradient>
            </View>

            <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedAppointment(null)}>
              <Text style={styles.modalCloseText}>Cerrar Detalle</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <BarberRoleNav mode="owner" current="dashboard" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  topBar: {
    height: 90,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0F0F0F",
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  iconButton: { width: 40, height: 40, justifyContent: "center" },
  brandContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandText: { color: "#FFF", fontSize: 14, fontWeight: "900", letterSpacing: 4 },
  brandDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#d4af37" },
  avatarWrap: { width: 36, height: 36, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#333" },
  avatar: { width: "100%", height: "100%" },
  
  content: { padding: 20, paddingBottom: 110 },
  welcomeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  title: { color: "#FFF", fontSize: 28, fontWeight: "900" },
  statusBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#1A1300", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: "#332a00" },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#d4af37" },
  statusText: { color: "#d4af37", fontSize: 10, fontWeight: "900" },

  shopCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", padding: 12, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: "#222" },
  shopImageContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#1A1A1A", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  shopImage: { width: "100%", height: "100%" },
  shopInfo: { flex: 1, marginLeft: 12 },
  shopName: { color: "#FFF", fontSize: 16, fontWeight: "800" },
  shopRole: { color: "#666", fontSize: 12, fontWeight: "600" },
  editIconCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#d4af37", alignItems: "center", justifyContent: "center" },

  salesCard: { height: 160, marginBottom: 20, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "#333" },
  salesGradient: { flex: 1, padding: 20, justifyContent: "center" },
  salesHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  salesLabel: { color: "#777", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  salesValue: { color: "#FFF", fontSize: 42, fontWeight: "900", marginVertical: 8 },
  salesFooter: { color: "#d4af37", fontSize: 12, fontWeight: "700", opacity: 0.8 },

  kpiGrid: { flexDirection: "row", gap: 12, marginBottom: 25 },
  kpiCard: { flex: 1, backgroundColor: "#111", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#222" },
  kpiLabel: { color: "#555", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  kpiValueRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  kpiValue: { color: "#FFF", fontSize: 24, fontWeight: "900" },
  occupancyTrack: { width: 40, height: 4, backgroundColor: "#222", borderRadius: 2, overflow: "hidden" },
  occupancyFill: { height: "100%", backgroundColor: "#d4af37" },

  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  sectionTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  viewAll: { color: "#d4af37", fontSize: 12, fontWeight: "900" },

  appointmentsContainer: { gap: 12 },
  appoCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "#1A1A1A" },
  timeColumn: { alignItems: "center", width: 50 },
  appoTime: { color: "#d4af37", fontSize: 14, fontWeight: "900" },
  timeLine: { width: 2, height: 20, backgroundColor: "#222", marginTop: 4 },
  appoBody: { flex: 1, marginLeft: 10 },
  appoClient: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  appoService: { color: "#666", fontSize: 12, marginTop: 2 },

  emptyState: { padding: 40, alignItems: "center", gap: 10 },
  emptyText: { color: "#333", fontSize: 14, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#111", borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40, borderWidth: 1, borderColor: "#222" },
  modalHandle: { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalHeaderTitle: { color: "#FFF", fontSize: 18, fontWeight: "900", textAlign: "center", marginBottom: 20 },
  modalDetailBox: { backgroundColor: "#0A0A0A", borderRadius: 20, padding: 15, gap: 12, marginBottom: 25 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { color: "#555", fontWeight: "700" },
  detailValue: { color: "#FFF", fontWeight: "800" },
  modalActions: { flexDirection: "row", gap: 12 },
  actionBtnOutline: { flex: 1, height: 55, borderRadius: 16, borderWidth: 1, borderColor: "#ff444433", alignItems: "center", justifyContent: "center" },
  actionTextCancel: { color: "#ff4444", fontWeight: "800", fontSize: 13 },
  actionBtnGradient: { flex: 1, height: 55, borderRadius: 16 },
  actionBtnPress: { flex: 1, alignItems: "center", justifyContent: "center" },
  actionTextConfirm: { color: "#000", fontWeight: "900", fontSize: 13 },
  modalCloseBtn: { marginTop: 20, alignSelf: "center" },
  modalCloseText: { color: "#555", fontWeight: "700" },
});