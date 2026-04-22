import { getFeaturedBarbers } from "@/lib/booking-catalog";
import { getFavoriteBarbers, toggleFavoriteBarber } from "@/lib/favorites";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function FeaturedBarbersScreen() {
  const [favoriteBarberIds, setFavoriteBarberIds] = useState<string[]>([]);
  const [barbers, setBarbers] = useState<
    Awaited<ReturnType<typeof getFeaturedBarbers>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(() => {
    let isMounted = true;
    const loadFavorites = async () => {
      const favorites = await getFavoriteBarbers();
      if (isMounted) setFavoriteBarberIds(favorites.map((item) => item.id));
    };
    loadFavorites();
    return () => {
      isMounted = false;
    };
  });

  useEffect(() => {
    let isMounted = true;
    const loadBarbers = async () => {
      setIsLoading(true);
      const items = await getFeaturedBarbers();
      if (isMounted) {
        setBarbers(items);
        setIsLoading(false);
      }
    };

    void loadBarbers();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER PREMIUM */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-backspace" size={28} color="#D4AF37" />
        </Pressable>
        <Text style={styles.headerTitle}>Maestros</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionSubtitle}>
          Selección de élite para tu estilo
        </Text>

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#D4AF37" />
            <Text style={styles.emptyText}>
              Cargando barberos desde Supabase...
            </Text>
          </View>
        ) : barbers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="person-off" size={34} color="#333" />
            <Text style={styles.emptyText}>
              Todavía no hay barberos activos disponibles.
            </Text>
          </View>
        ) : (
          barbers.map((barber) => (
            <View key={barber.id} style={styles.card}>
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: barber.avatarUrl }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              </View>

              <View style={styles.body}>
                <Text style={styles.name}>{barber.name}</Text>
                <Text style={styles.role}>{barber.specialty}</Text>

                {barber.rating ? (
                  <View style={styles.ratingRow}>
                    <MaterialIcons name="star" size={14} color="#D4AF37" />
                    <Text style={styles.ratingText}>{barber.rating}</Text>
                    <Text style={styles.reviewsText}>({barber.reviews})</Text>
                  </View>
                ) : null}

                <View style={styles.branchRow}>
                  <MaterialIcons name="location-on" size={12} color="#555" />
                  <Text style={styles.branch}>{barber.shopName}</Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={styles.favoriteButton}
                  onPress={() => {
                    void toggleFavoriteBarber({
                      id: barber.id,
                      name: barber.name,
                      role: barber.specialty,
                      branch: barber.shopName,
                      image: barber.avatarUrl,
                      shopId: barber.shopId,
                    }).then((result) => {
                      setFavoriteBarberIds(
                        result.favorites.map((item) => item.id),
                      );
                    });
                  }}
                >
                  <MaterialIcons
                    name={
                      favoriteBarberIds.includes(barber.id)
                        ? "favorite"
                        : "favorite-border"
                    }
                    size={22}
                    color="#D4AF37"
                  />
                </Pressable>

                <Pressable
                  style={styles.profileButton}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/barber-profile",
                      params: {
                        barberId: barber.id,
                        barberName: barber.name,
                        barberRole: barber.specialty,
                        barberBranch: barber.shopName,
                        barberImage: barber.avatarUrl,
                        shopId: barber.shopId,
                        shopName: barber.shopName,
                      },
                    })
                  }
                >
                  <Text style={styles.profileButtonText}>Perfil</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { width: 44, height: 44, justifyContent: "center" },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerSpacer: { width: 44 },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  sectionSubtitle: {
    color: "#555",
    fontSize: 14,
    marginBottom: 20,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    fontSize: 13,
    maxWidth: 260,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  avatarWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "#D4AF37",
    padding: 2,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 32 },

  body: { flex: 1, paddingHorizontal: 16 },
  name: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  role: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
    textTransform: "uppercase",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 4,
  },
  ratingText: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  reviewsText: { color: "#555", fontSize: 13 },

  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  branch: { color: "#888", fontSize: 12 },

  actions: { alignItems: "center", gap: 12 },
  favoriteButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  profileButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D4AF37",
  },
  profileButtonText: { color: "#D4AF37", fontSize: 12, fontWeight: "800" },
});
