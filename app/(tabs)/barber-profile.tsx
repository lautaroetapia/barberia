import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getFavoriteBarbers, toggleFavoriteBarber } from "@/lib/favorites";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ClientBarberProfileScreen() {
  const params = useLocalSearchParams<{
    barberId?: string;
    barberName?: string;
    barberRole?: string;
    barberBranch?: string;
    barberImage?: string;
    shopId?: string;
    shopName?: string;
  }>();

  const barberId = pickFirst(params.barberId) ?? "barber-any";
  const barberName = pickFirst(params.barberName) ?? "Barbero";
  const barberRole = pickFirst(params.barberRole) ?? "Especialista";
  const barberBranch = pickFirst(params.barberBranch) ?? "Atelier";
  const barberImage =
    pickFirst(params.barberImage) ??
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop";
  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? barberBranch;
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFavoriteState = async () => {
      const favorites = await getFavoriteBarbers();

      if (!isMounted) {
        return;
      }

      setIsFavorite(favorites.some((item) => item.id === barberId));
    };

    void loadFavoriteState();

    return () => {
      isMounted = false;
    };
  }, [barberId]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#e5e2e1" />
        </Pressable>
        <Text style={styles.headerTitle}>Perfil del barbero</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Image
            source={{ uri: barberImage }}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={styles.name}>{barberName}</Text>
          <Text style={styles.role}>{barberRole}</Text>
          <Text style={styles.branch}>{barberBranch}</Text>

          <View style={styles.ratingWrap}>
            <MaterialIcons name="star" size={16} color="#f2ca50" />
            <Text style={styles.ratingText}>4.9 · 120 reseñas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.chipsWrap}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Fade</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Barba</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Toalla caliente</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre su trabajo</Text>
          <Text style={styles.bioText}>
            Perfil detallista, enfocado en estilos modernos y acabados prolijos
            para cada cliente.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.favoriteButton}
          onPress={() => {
            void toggleFavoriteBarber({
              id: barberId,
              name: barberName,
              role: barberRole,
              branch: barberBranch,
              image: barberImage,
              shopId,
            }).then((result) => setIsFavorite(result.isFavorite));
          }}
        >
          <MaterialIcons
            name={isFavorite ? "favorite" : "favorite-border"}
            size={18}
            color="#f2ca50"
          />
          <Text style={styles.favoriteButtonText}>
            {isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.reserveButton}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/booking-service",
              params: {
                shopId,
                shopName,
                preselectedBarberId: barberId,
                preselectedBarberName: barberName,
              },
            })
          }
        >
          <Text style={styles.reserveButtonText}>
            Reservar con este barbero
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#e5e2e1", fontSize: 20, fontWeight: "800" },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 130,
    gap: 14,
  },
  heroCard: {
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 4,
  },
  avatar: { width: 92, height: 92, borderRadius: 46, marginBottom: 6 },
  name: { color: "#e5e2e1", fontSize: 24, fontWeight: "800" },
  role: { color: "#f2ca50", fontSize: 14, fontWeight: "600" },
  branch: { color: "#d0c5af", fontSize: 12 },
  ratingWrap: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  ratingText: { color: "#d0c5af", fontSize: 13 },
  section: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
    gap: 10,
  },
  sectionTitle: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(242,202,80,0.35)",
    backgroundColor: "rgba(242,202,80,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: { color: "#f2ca50", fontSize: 12, fontWeight: "600" },
  bioText: { color: "#d0c5af", fontSize: 13, lineHeight: 20 },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(14,14,14,0.96)",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 22,
    gap: 10,
  },
  favoriteButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(242,202,80,0.45)",
    backgroundColor: "#1c1b1b",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  favoriteButtonText: {
    color: "#f2ca50",
    fontSize: 13,
    fontWeight: "700",
  },
  reserveButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  reserveButtonText: { color: "#241a00", fontSize: 15, fontWeight: "800" },
});
