import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppToast } from "@/components/ui/app-toast";

const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDr2iu-Ibw2D9WqIviY12Ng8sofH5KqdBlrd6DnME1ESeElBgzqTektMzn8em1gtlT07r8XQKDvCb8jhkZ4KzCaIBmIPNn7167mSwGVUZS6reG2hcSvPCKpjpiPsp5rRrkq1NHzX6zJM0X9Y_CLZc62EdOMv-v2-mjiS6G9rC30lU2ANO90zSvfLITkknSLSL7MJVYsctBDhUHkqe0OC74xZZVNoLWHdio3Rqr2LtlCNKst1sPwsog39Mh8r8pB_BgJI-3fGDmH5bfY";

const historyItems = [
  {
    id: "1",
    service: "Corte de Autor",
    barber: "Mateo",
    date: "10 Oct",
    status: "Completado",
    statusColor: "#4ade80",
    canRate: true,
    stars: 0,
  },
  {
    id: "2",
    service: "Ritual de Barba",
    barber: "Julian",
    date: "25 Sep",
    status: "Completado",
    statusColor: "#4ade80",
    canRate: false,
    stars: 5,
  },
  {
    id: "3",
    service: "Corte & Barba",
    barber: "Enzo",
    date: "12 Sep",
    status: "Cancelado",
    statusColor: "#ffb4ab",
    canRate: false,
    stars: 0,
  },
  {
    id: "4",
    service: "Perfilado de Cejas",
    barber: "Mateo",
    date: "01 Sep",
    status: "No-show",
    statusColor: "#9a9485",
    canRate: false,
    stars: 0,
  },
];

export default function BookingsHistoryScreen() {
  const [ratedIds, setRatedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

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
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.header}>
        <Text style={styles.brandTitle}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: AVATAR_URI }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Mis Turnos</Text>
        </View>

        <View style={styles.tabsNav}>
          <Pressable
            style={styles.tabInactive}
            onPress={() => router.replace("/(tabs)/bookings")}
          >
            <Text style={styles.tabInactiveText}>Activos</Text>
          </Pressable>
          <Pressable style={styles.tabActive}>
            <Text style={styles.tabActiveText}>Historial</Text>
            <View style={styles.tabUnderline} />
          </Pressable>
        </View>

        <View style={styles.listWrap}>
          {historyItems.map((item) => {
            const isRated = item.stars > 0 || ratedIds.includes(item.id);

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  item.status === "Cancelado" && styles.cardSoft,
                  item.status === "No-show" && styles.cardFaded,
                ]}
              >
                {item.id === "1" ? <View style={styles.cardAccent} /> : null}

                <View style={styles.rowTop}>
                  <View>
                    <Text style={styles.serviceTitle}>{item.service}</Text>
                    <Text style={styles.barberText}>Con {item.barber}</Text>
                  </View>

                  <View style={styles.rightTop}>
                    <Text style={styles.dateText}>{item.date}</Text>
                    <Text
                      style={[styles.statusText, { color: item.statusColor }]}
                    >
                      {item.status}
                    </Text>
                  </View>
                </View>

                {item.status === "Completado" ? (
                  <View style={styles.bottomRow}>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <MaterialIcons
                          key={star}
                          name="star"
                          size={16}
                          color={
                            (isRated ? 5 : item.stars) >= star
                              ? "#f2ca50"
                              : "rgba(242, 202, 80, 0.42)"
                          }
                        />
                      ))}
                    </View>

                    {!isRated && item.canRate ? (
                      <Pressable
                        style={styles.rateButton}
                        onPress={() => handleRate(item.id)}
                      >
                        <Text style={styles.rateButtonText}>Calificar</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.ratedText}>Calificado</Text>
                    )}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/(tabs)")}
        >
          <MaterialIcons name="content-cut" size={22} color="#7f7766" />
          <Text style={styles.navText}>Atelier</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/(tabs)/explore")}
        >
          <MaterialIcons name="dry-cleaning" size={22} color="#7f7766" />
          <Text style={styles.navText}>Services</Text>
        </Pressable>

        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <MaterialIcons name="event-available" size={22} color="#d4af37" />
          <Text style={styles.navTextActive}>Bookings</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <MaterialIcons name="person" size={22} color="#7f7766" />
          <Text style={styles.navText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
  },
  header: {
    height: 66,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandTitle: {
    color: "#d4af37",
    fontSize: 21,
    letterSpacing: 3,
    fontWeight: "800",
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  pageHeader: {
    marginTop: 10,
    marginBottom: 12,
  },
  pageTitle: {
    color: "#e5e2e1",
    fontSize: 38,
    lineHeight: 42,
    fontWeight: "800",
  },
  tabsNav: {
    flexDirection: "row",
    gap: 26,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 70, 53, 0.25)",
    marginBottom: 20,
  },
  tabActive: {
    paddingBottom: 10,
  },
  tabActiveText: {
    color: "#f2ca50",
    fontSize: 14,
    fontWeight: "500",
  },
  tabUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: "#f2ca50",
  },
  tabInactive: {
    paddingBottom: 10,
  },
  tabInactiveText: {
    color: "#d0c5af",
    fontSize: 14,
    fontWeight: "500",
  },
  listWrap: {
    gap: 14,
  },
  card: {
    backgroundColor: "#1c1b1b",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
  },
  cardSoft: {
    opacity: 0.78,
  },
  cardFaded: {
    opacity: 0.56,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#f2ca50",
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingLeft: 8,
  },
  serviceTitle: {
    color: "#e5e2e1",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
    marginBottom: 2,
  },
  barberText: {
    color: "#d0c5af",
    fontSize: 14,
  },
  rightTop: {
    alignItems: "flex-end",
  },
  dateText: {
    color: "#e5e2e1",
    fontSize: 19,
    fontWeight: "700",
  },
  statusText: {
    marginTop: 2,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  bottomRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 70, 53, 0.25)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingLeft: 8,
  },
  starsRow: {
    flexDirection: "row",
    gap: 1,
  },
  rateButton: {
    minHeight: 34,
    borderRadius: 9,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
  },
  rateButtonText: {
    color: "#3c2f00",
    fontSize: 12,
    fontWeight: "600",
  },
  ratedText: {
    color: "#d0c5af",
    fontSize: 12,
    fontStyle: "italic",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(19, 19, 19, 0.94)",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 28,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  navItem: {
    minWidth: 76,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  navItemActive: {
    backgroundColor: "#2a2a2a",
  },
  navText: {
    marginTop: 4,
    color: "#7f7766",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "500",
  },
  navTextActive: {
    marginTop: 4,
    color: "#d4af37",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: "700",
  },
});
