import {
    getClientAppointmentHistory,
    type ClientAppointmentCard,
} from "@/lib/booking-catalog";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";

const AVATAR_URI = "https://i.pravatar.cc/150?u=lautaro";

export default function BookingsHistoryScreen() {
  const [history, setHistory] = useState<ClientAppointmentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratedIds, setRatedIds] = useState<string[]>([]);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "info" | "error",
  });

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getClientAppointmentHistory()
      .then((data) => {
        if (mounted) setHistory(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleRate = (id: string) => {
    setToast({
      visible: true,
      type: "success",
      message: "Gracias por calificar este turno.",
    });
    setRatedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

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
              source={{ uri: AVATAR_URI }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
        </View>

        <View style={styles.mainContainer}>
          <Text style={styles.pageTitle}>Mis Turnos</Text>

          {/* --- TABS --- */}
          <View style={styles.tabsNav}>
            <Pressable
              style={styles.tabInactive}
              onPress={() => router.replace("/(tabs)/bookings")}
            >
              \<Text style={styles.tabInactiveText}>Activos</Text>
            </Pressable>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Historial</Text>
              <View style={styles.tabUnderline} />
            </View>
          </View>

          {/* --- LISTA HISTORIAL --- */}
          <View style={styles.listWrap}>
            {loading ? (
              <Text
                style={{ color: "#999", textAlign: "center", marginTop: 40 }}
              >
                Cargando historial...
              </Text>
            ) : history.length === 0 ? (
              <Text
                style={{ color: "#999", textAlign: "center", marginTop: 40 }}
              >
                No tienes historial de turnos.
              </Text>
            ) : (
              history.map((item) => {
                const isRated = item.stars > 0 || ratedIds.includes(item.id);
                const isCanceled =
                  item.status === "Cancelado" || item.status === "No-show";

                return (
                  <View
                    key={item.id}
                    style={[styles.card, isCanceled && styles.cardCanceled]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.titleColumn}>
                        <Text
                          style={[
                            styles.serviceTitle,
                            isCanceled && styles.textFaded,
                          ]}
                        >
                          {item.service}
                        </Text>
                        <Text style={styles.barberText}>Con {item.barber}</Text>
                      </View>
                      <View style={styles.infoColumn}>
                        <Text style={styles.dateText}>{item.date}</Text>
                        <Text
                          style={[
                            styles.statusLabel,
                            { color: item.statusColor },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    {item.status === "Completado" && (
                      <View style={styles.ratingSection}>
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <MaterialIcons
                              key={star}
                              name="star"
                              size={18}
                              color={
                                (isRated ? item.stars || 5 : 0) >= star
                                  ? "#D4AF37"
                                  : "#222"
                              }
                            />
                          ))}
                        </View>

                        {!isRated && item.canRate ? (
                          <Pressable
                            style={styles.btnRate}
                            onPress={() => handleRate(item.id)}
                          >
                            <Text style={styles.btnRateText}>CALIFICAR</Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.ratedLabel}>
                            {isRated ? "CALIFICADO" : "SIN CALIFICAR"}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
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
            \
            <MaterialIcons name="content-cut" size={24} color="#555" />
            <Text style={styles.navText}>Atelier</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)/explore")}
          >
            \
            <MaterialIcons name="grid-view" size={24} color="#555" />
            <Text style={styles.navText}>Servicios</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)/bookings")}
          >
            \
            <View style={styles.activeIndicator}>
              <MaterialIcons name="event-available" size={22} color="#000" />
            </View>
            <Text style={styles.navTextActive}>Turnos</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/profile")}
          >
            \
            <MaterialIcons name="person-outline" size={24} color="#555" />
            <Text style={styles.navText}>Perfil</Text>
          </Pressable>
        </BlurView>
      </View>
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

  listWrap: { gap: 12 },
  card: {
    backgroundColor: "#161616",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#222",
  },
  cardCanceled: { opacity: 0.5 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  titleColumn: { flex: 1 },
  serviceTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  textFaded: { color: "#AAA", textDecorationLine: "line-through" },
  barberText: { color: "#666", fontSize: 13 },
  infoColumn: { alignItems: "flex-end" },
  dateText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  statusLabel: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  ratingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  starsRow: { flexDirection: "row", gap: 4 },
  btnRate: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  btnRateText: { color: "#000", fontSize: 10, fontWeight: "900" },
  ratedLabel: {
    color: "#444",
    fontSize: 10,
    fontWeight: "700",
    fontStyle: "italic",
  },

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
});
