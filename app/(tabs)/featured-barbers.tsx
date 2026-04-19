import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getFavoriteBarbers, toggleFavoriteBarber } from "@/lib/favorites";

const featuredBarbers = [
  {
    id: "1",
    barberId: "barber-mateo",
    name: "Mateo",
    role: "Master Barber",
    branch: "Atelier Palermo",
    shopId: "shop-1",
    rating: "4.9",
    reviews: "124",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArBcyyrUmsG-RrzPKo-y7lWSVmTZZitta3L4K2EKrKLllgTDFQ-vCxvX9fuFYV7bLwCVDc0x8mQXnSkLApvH5qVzVBZEKOfZ7dnjLWTd66WEEztQrkqxJZ0DqqFFozFw_7gvIPuKibDtgd3S9qf5ZHLEYQDW1UUea4yWaXNEvO8vRi-FBc1dX5Kov2jQE9rM4-iSL4fQllOXJkQOkMZjXpa74GxotlqP9YqhXxbZb1pmGtqpyywzZ4xQ7o_O-zNHBK1uczsk4Gnj9R",
  },
  {
    id: "2",
    barberId: "barber-julian",
    name: "Julian",
    role: "Experto en Barba",
    branch: "Atelier Palermo",
    shopId: "shop-1",
    rating: "4.8",
    reviews: "89",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCLAEqJ3muO7atMDm6-C9wVeO-iqCnlSAPEcglWhQhTsWTsAFoEIAvrbIjg_ZLN9VAPSyhGl327AEvxC6RNfuveiZArbZBOwa0i5e1rlmYHVZMLimA7_mGKoL8S0g8m7TdPwQNVgprwcbaPHwJn8Bdw4GvFLxJMUXRZY5GVc_aeI-rkuYUQGq7F6WdvHXT2KcosX0Tf0k0BsokedtoWZAjE7mtMAwOs6vgIc1FhXqxzrQ8R8eIU-XRPGMCoN_uNwh10eNKVkQOYdVBR",
  },
  {
    id: "3",
    barberId: "barber-lucas",
    name: "Enzo",
    role: "Corte Clasico",
    branch: "Atelier Belgrano",
    shopId: "shop-2",
    rating: "5.0",
    reviews: "210",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDGsasiihcc7rMarO3IyXCEilyMyuL04ZmAih17eKroXiHVKv1Vk3zx1o-ALy2OMB5SARlXZcTnmg_4-ipf8ktrH7YL9e1Vuyrj8r5mrNogd9fRPDv32jFwZnbAxcF5nWb_CfDlf_FyRAQpuvWYrzAQPcdL8lAEdEme3BRdmQnTO904dNfew8Uywkt_iGRPS4FkbFXXoNYDUyb6oPG5EpCYfeV98nC5rw94_F-Fp3sAHVRSSdXIynppClCvRhJt1cB-QLwAJArEneWJ",
  },
  {
    id: "4",
    barberId: "barber-julian",
    name: "Nicolas",
    role: "Fade Artist",
    branch: "Atelier Recoleta",
    shopId: "shop-3",
    rating: "4.7",
    reviews: "76",
    image:
      "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?q=80&w=1000&auto=format&fit=crop",
  },
];

export default function FeaturedBarbersScreen() {
  const [favoriteBarberIds, setFavoriteBarberIds] = useState<string[]>([]);

  useFocusEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      const favorites = await getFavoriteBarbers();

      if (!isMounted) {
        return;
      }

      setFavoriteBarberIds(favorites.map((item) => item.id));
    };

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#e5e2e1" />
        </Pressable>
        <Text style={styles.headerTitle}>Barberos Destacados</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {featuredBarbers.map((barber) => (
          <View key={barber.id} style={styles.card}>
            <Image
              source={{ uri: barber.image }}
              style={styles.avatar}
              contentFit="cover"
            />

            <View style={styles.body}>
              <Text style={styles.name}>{barber.name}</Text>
              <Text style={styles.role}>{barber.role}</Text>
              <Text style={styles.branch}>{barber.branch}</Text>

              <View style={styles.ratingRow}>
                <MaterialIcons name="star" size={13} color="#f2ca50" />
                <Text style={styles.ratingText}>
                  {barber.rating} ({barber.reviews})
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.favoriteButton}
              onPress={() => {
                void toggleFavoriteBarber({
                  id: barber.barberId,
                  name: barber.name,
                  role: barber.role,
                  branch: barber.branch,
                  image: barber.image,
                  shopId: barber.shopId,
                }).then((result) => {
                  setFavoriteBarberIds(result.favorites.map((item) => item.id));
                });
              }}
            >
              <MaterialIcons
                name={
                  favoriteBarberIds.includes(barber.barberId)
                    ? "favorite"
                    : "favorite-border"
                }
                size={17}
                color="#f2ca50"
              />
            </Pressable>

            <Pressable
              style={styles.profileButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/barber-profile",
                  params: {
                    barberId: barber.barberId,
                    barberName: barber.name,
                    barberRole: barber.role,
                    barberBranch: barber.branch,
                    barberImage: barber.image,
                    shopId: barber.shopId,
                    shopName: barber.branch,
                  },
                })
              }
            >
              <Text style={styles.profileButtonText}>Ver perfil</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
  },
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
  headerTitle: {
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "800",
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.22)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  body: { flex: 1 },
  name: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  role: { color: "#f2ca50", fontSize: 12, marginTop: 2 },
  branch: { color: "#d0c5af", fontSize: 11, marginTop: 1 },
  ratingRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: { color: "#d0c5af", fontSize: 11 },
  favoriteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14,14,14,0.6)",
  },
  profileButton: {
    minHeight: 34,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.22)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  profileButtonText: {
    color: "#e5e2e1",
    fontSize: 12,
    fontWeight: "600",
  },
});
