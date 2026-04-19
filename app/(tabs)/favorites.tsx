import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
    getFavoriteBarbers,
    getFavoriteShops,
    removeFavoriteBarber,
    removeFavoriteShop,
    type FavoriteBarber,
    type FavoriteShop,
} from "@/lib/favorites";

export default function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<"barberias" | "barberos">(
    "barberias",
  );
  const [favoriteShops, setFavoriteShops] = useState<FavoriteShop[]>([]);
  const [favoriteBarbers, setFavoriteBarbers] = useState<FavoriteBarber[]>([]);

  useFocusEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      const [shops, barbers] = await Promise.all([
        getFavoriteShops(),
        getFavoriteBarbers(),
      ]);

      if (!isMounted) {
        return;
      }

      setFavoriteShops(shops);
      setFavoriteBarbers(barbers);
    };

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  });

  const handleRemoveShop = (shopId: string) => {
    void removeFavoriteShop(shopId).then((nextFavorites) => {
      setFavoriteShops(nextFavorites);
    });
  };

  const handleRemoveBarber = (barberId: string) => {
    void removeFavoriteBarber(barberId).then((nextFavorites) => {
      setFavoriteBarbers(nextFavorites);
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#d4af37" />
          </Pressable>
          <Text style={styles.headerTitle}>Mis Favoritos</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabWrap}>
          <Pressable
            style={
              activeTab === "barberias" ? styles.tabActive : styles.tabInactive
            }
            onPress={() => setActiveTab("barberias")}
          >
            <Text
              style={
                activeTab === "barberias"
                  ? styles.tabActiveText
                  : styles.tabInactiveText
              }
            >
              Barberias
            </Text>
          </Pressable>
          <Pressable
            style={
              activeTab === "barberos" ? styles.tabActive : styles.tabInactive
            }
            onPress={() => setActiveTab("barberos")}
          >
            <Text
              style={
                activeTab === "barberos"
                  ? styles.tabActiveText
                  : styles.tabInactiveText
              }
            >
              Barberos
            </Text>
          </Pressable>
        </View>

        {activeTab === "barberias" ? (
          favoriteShops.length ? (
            <View style={styles.cardsWrap}>
              {favoriteShops.map((shop) => (
                <View key={shop.id} style={styles.shopCard}>
                  <View style={styles.shopImageWrap}>
                    <Image
                      source={{
                        uri: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=1200&auto=format&fit=crop",
                      }}
                      style={styles.shopImage}
                      contentFit="cover"
                    />
                    <Pressable
                      style={styles.overlayFavoriteButton}
                      onPress={() => handleRemoveShop(shop.id)}
                    >
                      <MaterialIcons
                        name="favorite"
                        size={20}
                        color="#f2ca50"
                      />
                    </Pressable>
                  </View>

                  <View style={styles.shopBody}>
                    <View style={styles.shopTopRow}>
                      <Text style={styles.shopTitle}>{shop.name}</Text>
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={13} color="#f2ca50" />
                        <Text style={styles.ratingText}>4.8</Text>
                      </View>
                    </View>

                    <View style={styles.locationRow}>
                      <MaterialIcons
                        name="location-on"
                        size={14}
                        color="#d0c5af"
                      />
                      <Text style={styles.shopAddress}>{shop.address}</Text>
                    </View>

                    <Pressable
                      style={styles.primaryButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/booking-service",
                          params: {
                            shopId: shop.id,
                            shopName: shop.name,
                          },
                        })
                      }
                    >
                      <Text style={styles.primaryButtonText}>
                        Ver servicios
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="favorite-border" size={34} color="#99907c" />
              <Text style={styles.emptyText}>
                No tienes barberias favoritas.
              </Text>
            </View>
          )
        ) : favoriteBarbers.length ? (
          <View style={styles.barbersSection}>
            <Text style={styles.barbersSectionTitle}>
              Tus Maestros Favoritos
            </Text>
            <View style={styles.barberList}>
              {favoriteBarbers.map((barber) => (
                <View key={barber.id} style={styles.barberCard}>
                  <Image
                    source={{ uri: barber.image }}
                    style={styles.barberAvatar}
                    contentFit="cover"
                  />

                  <View style={styles.barberBody}>
                    <Text style={styles.barberName}>{barber.name}</Text>
                    <Text style={styles.barberRole}>{barber.role}</Text>

                    <Pressable
                      style={styles.reserveLink}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/barber-profile",
                          params: {
                            barberId: barber.id,
                            barberName: barber.name,
                            barberRole: barber.role,
                            barberBranch: barber.branch,
                            barberImage: barber.image,
                            shopId: barber.shopId ?? "shop-1",
                            shopName: barber.branch,
                          },
                        })
                      }
                    >
                      <Text style={styles.reserveLinkText}>Reservar</Text>
                    </Pressable>
                  </View>

                  <Pressable
                    style={styles.overlayFavoriteButton}
                    onPress={() => handleRemoveBarber(barber.id)}
                  >
                    <MaterialIcons name="favorite" size={20} color="#f2ca50" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="favorite-border" size={34} color="#99907c" />
            <Text style={styles.emptyText}>No tienes barberos favoritos.</Text>
          </View>
        )}
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
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(19, 19, 19, 0.92)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#d4af37",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  headerSpacer: {
    width: 36,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
    gap: 16,
  },
  tabWrap: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 70, 53, 0.2)",
  },
  tabActive: {
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#d4af37",
    marginRight: 24,
  },
  tabInactive: {
    paddingBottom: 10,
    marginRight: 24,
  },
  tabActiveText: {
    color: "#f2ca50",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tabInactiveText: {
    color: "#7f7766",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardsWrap: {
    gap: 12,
  },
  shopCard: {
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
  },
  shopImageWrap: {
    height: 140,
    position: "relative",
  },
  shopImage: {
    width: "100%",
    height: "100%",
  },
  overlayFavoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(19,19,19,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },
  shopBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  shopTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  shopTitle: {
    color: "#e5e2e1",
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    color: "#f2ca50",
    fontSize: 11,
    fontWeight: "700",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  shopAddress: {
    color: "#d0c5af",
    fontSize: 12,
    flex: 1,
  },
  primaryButton: {
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#241a00",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  barbersSection: {
    gap: 10,
  },
  barbersSectionTitle: {
    color: "#d0c5af",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  barberList: {
    gap: 10,
  },
  barberCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    position: "relative",
  },
  barberAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  barberBody: {
    flex: 1,
  },
  barberName: {
    color: "#e5e2e1",
    fontSize: 16,
    fontWeight: "800",
  },
  barberRole: {
    color: "#d0c5af",
    fontSize: 12,
    marginTop: 2,
  },
  reserveLink: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  reserveLinkText: {
    color: "#f2ca50",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyState: {
    minHeight: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: "#d0c5af",
    fontSize: 13,
  },
});
