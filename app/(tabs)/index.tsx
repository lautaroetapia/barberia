import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
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

import { Skeleton } from "@/components/ui/skeleton";
import {
    cancelClientAppointment,
    getClientActiveAppointments,
    getClientAppointmentHistory,
    type ClientAppointmentCard,
} from "@/lib/booking-catalog";
import { getFavoriteBarbers, toggleFavoriteBarber } from "@/lib/favorites";
import { supabase } from "@/lib/supabase";

const getDisplayName = (user: User | null) => {
  if (!user) return "Usuario";
  const displayNameFromMeta =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.user_metadata?.given_name;

  if (typeof displayNameFromMeta === "string" && displayNameFromMeta.trim()) {
    return displayNameFromMeta.trim();
  }
  if (user.email) return user.email;
  return "Usuario";
};

type HomeNotification = {
  id: string;
  title: string;
  body: string;
};

const buildNotificationsFromAppointments = (
  nextAppointment: ClientAppointmentCard | null,
  history: ClientAppointmentCard[],
) => {
  const items: HomeNotification[] = [];

  if (nextAppointment) {
    items.push({
      id: `next-${nextAppointment.id}`,
      title: "Proximo turno confirmado",
      body: `${nextAppointment.service} • ${nextAppointment.date}, ${nextAppointment.time}`,
    });
  }

  history.slice(0, 3).forEach((appointment) => {
    items.push({
      id: `history-${appointment.id}`,
      title: `Turno ${appointment.status.toLowerCase()}`,
      body: `${appointment.service} • ${appointment.date}, ${appointment.time}`,
    });
  });

  return items;
};

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState("Cliente");
  const [isHomeLoading, setIsHomeLoading] = useState(true);
  const [isNextTurnLoading, setIsNextTurnLoading] = useState(true);
  const [nextTurn, setNextTurn] = useState<ClientAppointmentCard | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [isCancellingTurn, setIsCancellingTurn] = useState(false);
  const [favoriteBarberIds, setFavoriteBarberIds] = useState<string[]>([]);
  const [notificationsModalVisible, setNotificationsModalVisible] =
    useState(false);
  const [notifications, setNotifications] = useState<HomeNotification[]>([]);

  const [featuredBarbers, setFeaturedBarbers] = useState([]);
  const [isBarbersLoading, setIsBarbersLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadBarbers = async () => {
      setIsBarbersLoading(true);
      try {
        const barbers =
          await require("@/lib/booking-catalog").getFeaturedBarbers();
        if (isMounted) setFeaturedBarbers(barbers);
      } finally {
        if (isMounted) setIsBarbersLoading(false);
      }
    };
    loadBarbers();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadAppointmentsData = useCallback(async () => {
    setIsNextTurnLoading(true);

    try {
      const [activeAppointments, historyAppointments] = await Promise.all([
        getClientActiveAppointments(),
        getClientAppointmentHistory(),
      ]);

      const nextAppointment = activeAppointments[0] ?? null;
      setNextTurn(nextAppointment);
      setNotifications(
        buildNotificationsFromAppointments(
          nextAppointment,
          historyAppointments,
        ),
      );
    } finally {
      setIsNextTurnLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAppointmentsData();
    }, [loadAppointmentsData]),
  );

  const handleCancelAppointment = useCallback(async () => {
    if (!nextTurn || isCancellingTurn) {
      return;
    }

    setIsCancellingTurn(true);

    try {
      const result = await cancelClientAppointment(nextTurn.id);

      setCancelModalVisible(false);
      await loadAppointmentsData();
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
    } finally {
      setIsCancellingTurn(false);
    }
  }, [isCancellingTurn, loadAppointmentsData, nextTurn]);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadFavorites = async () => {
        const favorites = await getFavoriteBarbers();
        if (isMounted) setFavoriteBarberIds(favorites.map((item) => item.id));
      };
      void loadFavorites();
      return () => {
        isMounted = false;
      };
    }, []),
  );

  useEffect(() => {
    let isMounted = true;
    const applyUserData = (user: User | null) => {
      setDisplayName(getDisplayName(user));
    };

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (isMounted) {
          applyUserData(data.user ?? null);
          setIsHomeLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          applyUserData(null);
          setIsHomeLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) applyUserData(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- HEADER REDISEÑADO --- */}
        <View style={styles.header}>
          {/* Fila superior: Marca e Iconos */}
          <View style={styles.headerTopRow}>
            <Text style={styles.brandTitle}>
              NAVAJA <Text style={styles.goldText}>DORADA</Text>
            </Text>
            <View style={styles.headerActions}>
              <Pressable
                style={styles.iconCircle}
                onPress={() => router.push("/(tabs)/favorites")}
              >
                <MaterialIcons
                  name="favorite-border"
                  size={18}
                  color="#D4AF37"
                />
              </Pressable>
              <Pressable
                style={styles.iconCircle}
                onPress={() => setNotificationsModalVisible(true)}
              >
                <MaterialIcons
                  name="notifications-none"
                  size={20}
                  color="#D4AF37"
                />
                {notifications.length > 0 ? (
                  <View style={styles.notificationDot} />
                ) : null}
              </Pressable>
            </View>
          </View>

          {/* Fila inferior: Saludo y Nombre completo */}
          <View style={styles.greetingContainer}>
            {isHomeLoading ? (
              <Skeleton style={styles.greetingSkeleton} />
            ) : (
              <Text style={styles.greetingText}>
                Hola, <Text style={styles.customerName}>{displayName}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* --- SECCIÓN PRÓXIMO TURNO --- */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tu Próximo Turno</Text>
            {nextTurn && (
              <View style={styles.liveIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveText}>
                  {nextTurn.status.toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {isHomeLoading || isNextTurnLoading ? (
            <Skeleton style={styles.ticketCardSkeleton} />
          ) : nextTurn ? (
            <View style={styles.ticketCard}>
              <View style={styles.ticketInfo}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.serviceName}>{nextTurn.service}</Text>
                  <Text style={styles.priceTag}>{nextTurn.status}</Text>
                </View>
                <View style={styles.detailsRow}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="event" size={14} color="#D4AF37" />
                    <Text style={styles.detailText}>
                      {nextTurn.date}, {nextTurn.time}
                    </Text>
                  </View>
                  <View style={styles.dividerDot} />
                  <View style={styles.detailItem}>
                    <MaterialIcons name="person" size={14} color="#D4AF37" />
                    <Text style={styles.detailText}>{nextTurn.barber}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.ticketActions}>
                <Pressable
                  style={[
                    styles.btnSecondary,
                    isCancellingTurn && styles.disabledAction,
                  ]}
                  onPress={() => setCancelModalVisible(true)}
                  disabled={isCancellingTurn}
                >
                  <Text style={styles.btnSecondaryText}>
                    {isCancellingTurn ? "CANCELANDO..." : "CANCELAR"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.btnPrimary}
                  onPress={() => router.push("/(tabs)/bookings")}
                >
                  <Text style={styles.btnPrimaryText}>VER DETALLES</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tienes turnos pendientes</Text>
            </View>
          )}
        </View>

        {/* --- BOTÓN HERO RESERVAR --- */}
        <Pressable
          style={({ pressed }) => [
            styles.reserveHero,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => router.push("/(tabs)/services-list")}
        >
          <View style={styles.reserveContent}>
            <Text style={styles.reserveLabel}>EXPERIENCIA COMPLETA</Text>
            <Text style={styles.reserveTitleText}>RESERVAR{"\n"}TURNO</Text>
            <View style={styles.reserveBadge}>
              <Text style={styles.reserveBadgeText}>DISPONIBLE AHORA</Text>
            </View>
          </View>
          <View style={styles.heroIconWrap}>
            <FontAwesome5 name="cut" size={40} color="rgba(0,0,0,0.1)" />
            <View style={styles.plusIcon}>
              <MaterialIcons name="add" size={24} color="#D4AF37" />
            </View>
          </View>
        </Pressable>

        {/* --- BARBEROS DESTACADOS --- */}
        <View style={[styles.section, { marginBottom: 40 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Barberos del Atelier</Text>
            <Pressable onPress={() => router.push("/(tabs)/featured-barbers")}>
              <Text style={styles.viewAllText}>Ver todos</Text>
            </Pressable>
          </View>

          {isBarbersLoading ? (
            <Skeleton style={{ height: 120, width: "100%" }} />
          ) : featuredBarbers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay barberos destacados</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {featuredBarbers.map((barber) => (
                <View key={barber.id} style={styles.barberCard}>
                  <View style={styles.cardHeader}>
                    <View style={styles.barberAvatarWrap}>
                      <Image
                        source={{ uri: barber.avatarUrl }}
                        style={styles.barberImg}
                      />
                      <View style={styles.ratingBadge}>
                        <MaterialIcons name="star" size={10} color="#D4AF37" />
                        <Text style={styles.ratingText}>4.9</Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.favBtn}
                      onPress={() => {
                        toggleFavoriteBarber({
                          id: barber.id,
                          name: barber.name,
                          role: barber.specialty,
                          branch: barber.shopName || "",
                          image: barber.avatarUrl,
                          shopId: barber.shopId || "",
                        }).then((res) =>
                          setFavoriteBarberIds(res.favorites.map((f) => f.id)),
                        );
                      }}
                    >
                      <MaterialIcons
                        name={
                          favoriteBarberIds.includes(barber.id)
                            ? "favorite"
                            : "favorite-border"
                        }
                        size={18}
                        color="#D4AF37"
                      />
                    </Pressable>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.barberNameText}>{barber.name}</Text>
                    <Text style={styles.barberSpecialty}>
                      {barber.specialty}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.btnSmall}
                    onPress={() => router.push("/(tabs)/barber-profile")}
                  >
                    <Text style={styles.btnSmallText}>PERFIL</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* --- BOTTOM NAV --- */}
      <View style={styles.bottomNavContainer}>
        <BlurView intensity={90} tint="dark" style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)")}
          >
            <View style={styles.activeIndicator}>
              <MaterialIcons name="content-cut" size={22} color="#000" />
            </View>
            <Text style={styles.navTextActive}>Atelier</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)/explore")}
          >
            <MaterialIcons name="grid-view" size={24} color="#555" />
            <Text style={styles.navText}>Servicios</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/bookings")}
          >
            <MaterialIcons name="event-note" size={24} color="#555" />
            <Text style={styles.navText}>Turnos</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <MaterialIcons name="person-outline" size={24} color="#555" />
            <Text style={styles.navText}>Perfil</Text>
          </Pressable>
        </BlurView>
      </View>

      {/* --- MODAL NOTIFICACIONES --- */}
      <Modal
        visible={notificationsModalVisible}
        transparent
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Notificaciones</Text>
            {notifications.length > 0 ? (
              <ScrollView
                style={styles.notificationList}
                contentContainerStyle={styles.notificationListContent}
                showsVerticalScrollIndicator={false}
              >
                {notifications.map((item) => (
                  <View key={item.id} style={styles.notificationCard}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationText}>{item.body}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.modalBody}>
                Aun no tienes notificaciones de turnos.
              </Text>
            )}
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalBtnCancel}
                onPress={() => setNotificationsModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>CERRAR</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- MODAL CANCELACIÓN --- */}
      <Modal visible={cancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>¿Cancelar Turno?</Text>
            <Text style={styles.modalBody}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalBtnCancel}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalBtnText}>VOLVER</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnConfirm}
                onPress={handleCancelAppointment}
                disabled={isCancellingTurn}
              >
                <Text style={[styles.modalBtnText, { color: "#000" }]}>
                  {isCancellingTurn ? "CANCELANDO..." : "SÍ, CANCELAR"}
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

  // --- NUEVOS ESTILOS DE HEADER ---
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  brandTitle: {
    color: "#FFF",
    fontSize: 14,
    letterSpacing: 3,
    fontWeight: "400",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#D4AF37",
    borderWidth: 1.5,
    borderColor: "#161616",
  },
  greetingContainer: {
    width: "100%",
  },
  greetingText: {
    color: "#666",
    fontSize: 26,
    fontWeight: "400",
    lineHeight: 34,
  },
  customerName: {
    color: "#FFF",
    fontWeight: "800",
    textTransform: "capitalize",
  },
  greetingSkeleton: { width: "80%", height: 35, borderRadius: 8 },

  // --- RESTO DE ESTILOS ---
  scrollContent: { paddingBottom: 160 },
  section: { marginTop: 25, paddingHorizontal: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  viewAllText: { color: "#D4AF37", fontSize: 13, fontWeight: "600" },

  ticketCard: {
    backgroundColor: "#161616",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
  },
  ticketCardSkeleton: { width: "100%", height: 160, borderRadius: 24 },
  ticketInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
    borderStyle: "dashed",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  serviceName: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  priceTag: { color: "#D4AF37", fontSize: 16, fontWeight: "800" },
  detailsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { color: "#888", fontSize: 13 },
  dividerDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#333" },
  ticketActions: { flexDirection: "row", padding: 12, gap: 10 },
  btnPrimary: {
    flex: 1.5,
    backgroundColor: "#D4AF37",
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnPrimaryText: { color: "#000", fontWeight: "800", fontSize: 12 },
  btnSecondary: {
    flex: 1,
    backgroundColor: "#222",
    height: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSecondaryText: { color: "#FFF", fontWeight: "700", fontSize: 11 },
  emptyCard: {
    padding: 30,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyText: { color: "#555", fontSize: 14 },

  reserveHero: {
    backgroundColor: "#D4AF37",
    marginHorizontal: 24,
    marginTop: 30,
    borderRadius: 28,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  reserveContent: { flex: 1 },
  reserveLabel: {
    color: "rgba(0,0,0,0.4)",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  reserveTitleText: {
    color: "#000",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 34,
    marginTop: 5,
  },
  reserveBadge: {
    backgroundColor: "rgba(0,0,0,0.08)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 15,
  },
  reserveBadgeText: { color: "#000", fontSize: 9, fontWeight: "800" },
  heroIconWrap: {
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  horizontalList: { paddingLeft: 0, marginTop: 5 },
  barberCard: {
    backgroundColor: "#161616",
    width: 170,
    borderRadius: 24,
    padding: 15,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  barberAvatarWrap: { position: "relative" },
  barberImg: { width: 65, height: 65, borderRadius: 20 },
  ratingBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "#000",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  favBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { marginVertical: 15 },
  barberNameText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  barberSpecialty: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  btnSmall: {
    backgroundColor: "#222",
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  btnSmallText: { color: "#FFF", fontSize: 10, fontWeight: "800" },

  bottomNavContainer: {
    position: "absolute",
    bottom: 35,
    left: 20,
    right: 20,
    zIndex: 100,
  },
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
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    padding: 24,
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
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  modalBody: {
    color: "#888",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 25,
  },
  notificationList: {
    maxHeight: 280,
    marginTop: 14,
    marginBottom: 18,
  },
  notificationListContent: {
    gap: 10,
  },
  notificationCard: {
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#101010",
  },
  notificationTitle: {
    color: "#F3F3F3",
    fontSize: 13,
    fontWeight: "700",
  },
  notificationText: {
    color: "#9B9B9B",
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtnCancel: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnConfirm: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { color: "#FFF", fontWeight: "800", fontSize: 12 },

  liveIndicator: { flexDirection: "row", alignItems: "center", gap: 6 },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00C851",
  },
  liveText: { color: "#00C851", fontSize: 10, fontWeight: "800" },
});
