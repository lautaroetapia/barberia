import {
    cancelClientAppointment,
    getClientActiveAppointments,
    type ClientAppointmentCard,
} from "@/lib/booking-catalog";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import { getUserAvatarUri } from "@/lib/user-avatar";

const AVATAR_URI = "https://i.pravatar.cc/150?u=lautaro";

export default function BookingsScreen() {
  const [avatarUri, setAvatarUri] = useState(AVATAR_URI);
  const [appointments, setAppointments] = useState<ClientAppointmentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setAvatarUri(getUserAvatarUri(data.user ?? null, AVATAR_URI));
    });

    setLoading(true);
    getClientActiveAppointments()
      .then((data) => {
        if (mounted) setAppointments(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCancel = async (id: string) => {
    try {
      const result = await cancelClientAppointment(id);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setCancelModalVisible(false);
      Alert.alert(
        "Turno cancelado",
        result.penaltyApplies
          ? `La cancelación quedó registrada. Como faltan menos de ${result.freeCancellationHours} horas, puede aplicar cargo según políticas de la barbería.`
          : "Tu turno fue cancelado sin cargo.",
      );
    } catch (error) {
      Alert.alert(
        "No se pudo cancelar",
        error instanceof Error
          ? error.message
          : "Intentalo de nuevo en unos segundos.",
      );
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- HEADER LIMPIO (Sin botones extras) --- */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.brandTitle}>
              NAVAJA <Text style={styles.goldText}>DORADA</Text>
            </Text>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
        </View>

        {/* --- CONTENIDO --- */}
        <View style={styles.mainContainer}>
          <Text style={styles.pageTitle}>Mis Turnos</Text>

          <View style={styles.tabsNav}>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Activos</Text>
              <View style={styles.tabUnderline} />
            </View>
            <Pressable
              style={styles.tabInactive}
              onPress={() => router.replace("/(tabs)/bookings-history")}
            >
              <Text style={styles.tabInactiveText}>Historial</Text>
            </Pressable>
          </View>

          <View style={styles.listWrap}>
            {loading ? (
              <Text
                style={{ color: "#999", textAlign: "center", marginTop: 40 }}
              >
                Cargando turnos...
              </Text>
            ) : appointments.length === 0 ? (
              <Text
                style={{ color: "#999", textAlign: "center", marginTop: 40 }}
              >
                No tienes turnos activos.
              </Text>
            ) : (
              appointments.map((item) => (
                <View key={item.id} style={styles.card}>
                  <View style={styles.cardMain}>
                    <View style={styles.serviceHeader}>
                      <View style={styles.iconBox}>
                        <MaterialIcons
                          name={item.icon as any}
                          size={22}
                          color="#D4AF37"
                        />
                      </View>
                      <View style={styles.titleColumn}>
                        <Text style={styles.serviceTitle}>{item.service}</Text>
                        <Text style={styles.statusText}>
                          ✓ {item.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.detailsGrid}>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="event" size={14} color="#555" />
                        <Text style={styles.detailText}>
                          {item.date} • {item.time}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <MaterialIcons name="person" size={14} color="#555" />
                        <Text style={styles.detailText}>{item.barber}</Text>
                      </View>
                    </View>
                    <View style={styles.actionsRow}>
                      <Pressable
                        style={styles.btnReschedule}
                        onPress={() =>
                          router.push({
                            pathname: "/(tabs)/booking-time",
                            params: {
                              appointmentId: item.id,
                              isReschedule: "1",
                              shopId: item.shopId,
                              serviceId: item.serviceId,
                              barberId: item.barberId,
                              serviceName: item.service,
                              serviceDuration: item.serviceDurationMinutes
                                ? String(item.serviceDurationMinutes)
                                : undefined,
                            },
                          })
                        }
                      >
                        <Text style={styles.btnRescheduleText}>
                          Reprogramar
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setSelectedAppointmentId(item.id);
                          setCancelModalVisible(true);
                        }}
                      >
                        <Text style={styles.btnCancelText}>Cancelar</Text>
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.cardQR}>
                    <MaterialIcons
                      name="qr-code-2"
                      size={40}
                      color="#D4AF37"
                      style={{ opacity: 0.5 }}
                    />
                    <Text style={styles.qrLabel}>CHECK-IN</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* --- MENU INFERIOR FIJO --- */}
      <View style={styles.bottomNavContainer}>
        <BlurView intensity={90} tint="dark" style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)")}
          >
            <MaterialIcons name="content-cut" size={24} color="#555" />
            <Text style={styles.navText}>Atelier</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)/explore")}
          >
            <MaterialIcons name="grid-view" size={24} color="#555" />
            <Text style={styles.navText}>Servicios</Text>
          </Pressable>
          <View style={styles.navItem}>
            <View style={styles.activeIndicator}>
              <MaterialIcons name="event-available" size={22} color="#000" />
            </View>
            <Text style={styles.navTextActive}>Turnos</Text>
          </View>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <MaterialIcons name="person-outline" size={24} color="#555" />
            <Text style={styles.navText}>Perfil</Text>
          </Pressable>
        </BlurView>
      </View>

      {/* --- MODAL CANCELACIÓN --- */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Cancelar Turno?</Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalBtnBack}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>VOLVER</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnConfirm}
                onPress={() => {
                  if (selectedAppointmentId)
                    void handleCancel(selectedAppointmentId);
                }}
              >
                <Text style={[styles.modalBtnText, { color: "#000" }]}>
                  SÍ, CANCELAR
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  goldText: { color: "#D4AF37", fontWeight: "900" },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 15,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandTitle: {
    color: "#FFF",
    fontSize: 14,
    letterSpacing: 3,
    fontWeight: "400",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },

  scrollContent: { paddingBottom: 150 },
  mainContainer: { paddingHorizontal: 24 },
  pageTitle: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 20,
  },

  tabsNav: {
    flexDirection: "row",
    gap: 25,
    marginBottom: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#161616",
  },
  tabActive: { paddingBottom: 12 },
  tabActiveText: { color: "#D4AF37", fontSize: 15, fontWeight: "700" },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#D4AF37",
  },
  tabInactive: { paddingBottom: 12 },
  tabInactiveText: { color: "#555", fontSize: 15, fontWeight: "500" },

  listWrap: { gap: 0 },

  card: {
    flexDirection: "row",
    backgroundColor: "#161616",
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
  },
  cardMain: { flex: 1, padding: 18 },
  serviceHeader: { flexDirection: "row", gap: 12, marginBottom: 15 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#221C0E",
    alignItems: "center",
    justifyContent: "center",
  },
  titleColumn: { flex: 1, justifyContent: "center" },
  serviceTitle: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  statusText: {
    color: "#4CAF50",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 2,
  },
  detailsGrid: { gap: 6, marginBottom: 15 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { color: "#888", fontSize: 13 },
  actionsRow: { flexDirection: "row", gap: 15, alignItems: "center" },
  btnReschedule: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnRescheduleText: { color: "#000", fontSize: 11, fontWeight: "800" },
  btnCancelText: { color: "#555", fontSize: 11, fontWeight: "700" },
  cardQR: {
    width: 70,
    backgroundColor: "#0F0F0F",
    borderLeftWidth: 1,
    borderLeftColor: "#222",
    justifyContent: "center",
    alignItems: "center",
  },
  qrLabel: { color: "#333", fontSize: 7, fontWeight: "900", marginTop: 5 },

  bottomNavContainer: { position: "absolute", bottom: 35, left: 20, right: 20 },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "rgba(20, 20, 20, 0.75)",
    borderRadius: 35,
    paddingVertical: 12,
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
  },
  navItem: { alignItems: "center", minWidth: 65 },
  activeIndicator: {
    backgroundColor: "#D4AF37",
    width: 48,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  navText: { color: "#555", fontSize: 10, fontWeight: "600", marginTop: 2 },
  navTextActive: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    padding: 40,
  },
  modalCard: {
    backgroundColor: "#161616",
    borderRadius: 28,
    padding: 25,
    borderWidth: 1,
    borderColor: "#222",
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 20,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtnBack: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnConfirm: {
    flex: 1,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { color: "#FFF", fontWeight: "800", fontSize: 12 },
});
