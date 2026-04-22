import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { getPublicBarbershops } from "@/lib/booking-catalog";
import { getFavoriteShops, toggleFavoriteShop } from "@/lib/favorites";
import { getOwnedBarbershopProfile } from "@/lib/owned-barbershop";
import { supabase } from "@/lib/supabase";
import { getUserAvatarUri } from "@/lib/user-avatar";

// Utilidad para obtener el nombre completo del usuario
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
  return user.email ? user.email.split("@")[0] : "Usuario";
};

export default function ServicesListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("Usuario");
  const [isLoadingShops, setIsLoadingShops] = useState(true);
  const [shopsError, setShopsError] = useState("");
  const [ateliers, setAteliers] = useState<
    Array<{
      id: string;
      name: string;
      address: string;
      rating: string;
      reviews: string;
      image: string;
      isOwned?: boolean;
    }>
  >([]);

  // CARGAR FAVORITOS
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      getFavoriteShops().then((favorites) => {
        if (isMounted) setFavoriteShopIds(favorites.map((item) => item.id));
      });
      return () => {
        isMounted = false;
      };
    }, []),
  );

  // CARGAR AVATAR Y NOMBRE USUARIO
  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }
        setAvatarUri(getUserAvatarUri(data.user, ""));
        setDisplayName(getDisplayName(data.user ?? null));
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setAvatarUri("");
        setDisplayName("Usuario");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadShops = async () => {
      setIsLoadingShops(true);
      setShopsError("");

      try {
        const [shops, ownedShop] = await Promise.all([
          getPublicBarbershops(),
          getOwnedBarbershopProfile(),
        ]);

        const nextShops = [...shops];
        if (ownedShop?.name.trim() && ownedShop.address.trim()) {
          const ownedName = ownedShop.name.trim();
          const ownedAddress = ownedShop.address.trim();
          const ownedShopId = ownedShop.id?.trim();
          const alreadyIncluded = nextShops.some(
            (shop) =>
              shop.name.trim().toLowerCase() === ownedName.toLowerCase() ||
              shop.address.trim().toLowerCase() === ownedAddress.toLowerCase(),
          );

          if (!alreadyIncluded && ownedShopId) {
            nextShops.unshift({
              id: ownedShopId,
              name: ownedName,
              address: ownedAddress,
              rating: "5.0",
              reviews: "0",
              logoUrl: ownedShop.imageUri,
              isOwned: true,
            });
          }
        }

        if (!isMounted) {
          return;
        }

        setAteliers(
          nextShops.map((shop) => ({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            rating: shop.rating,
            reviews: shop.reviews,
            image: shop.logoUrl,
            isOwned: shop.isOwned,
          })),
        );
      } catch {
        if (!isMounted) {
          return;
        }
        setAteliers([]);
        setShopsError("No pudimos cargar barberías. Intenta nuevamente.");
      } finally {
        if (isMounted) {
          setIsLoadingShops(false);
        }
      }
    };

    void loadShops();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredAteliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return ateliers.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.address.toLowerCase().includes(q),
    );
  }, [ateliers, searchQuery]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Hola, {displayName}</Text>
          <Text style={styles.brandTitle}>
            NAVAJA <Text style={styles.gold}>DORADA</Text>
          </Text>
        </View>
        <Pressable
          style={styles.avatarContainer}
          onPress={() => router.push("/(tabs)/profile")}
        >
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {displayName
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase() || "U"}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SELECTOR MAPA/LISTA */}
        <View style={styles.toggleWrap}>
          <BlurView intensity={20} tint="dark" style={styles.toggleContainer}>
            <Pressable
              style={styles.toggleInactive}
              onPress={() => router.replace("/(tabs)/explore")}
            >
              <Text style={styles.toggleInactiveText}>Mapa</Text>
            </Pressable>
            <View style={styles.toggleActive}>
              <Text style={styles.toggleActiveText}>Lista</Text>
            </View>
          </BlurView>
        </View>

        {/* BUSCADOR */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color="#D4AF37" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre o ubicación..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Ateliers <Text style={styles.gold}>Premium</Text>
        </Text>

        {/* LISTA DE TARJETAS */}
        <View style={styles.listWrap}>
          {isLoadingShops ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyText}>Cargando barberías...</Text>
            </View>
          ) : null}

          {!isLoadingShops && shopsError ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyText}>{shopsError}</Text>
            </View>
          ) : null}

          {filteredAteliers.map((atelier) => (
            <Pressable
              key={atelier.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/booking-service",
                  params: { shopId: atelier.id },
                })
              }
            >
              {atelier.image ? (
                <Image
                  source={{ uri: atelier.image }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.cardImageFallback}>
                  <MaterialIcons name="storefront" size={24} color="#D4AF37" />
                </View>
              )}

              <View style={styles.cardInfo}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {atelier.name}
                  </Text>
                  <Pressable
                    onPress={() =>
                      toggleFavoriteShop(atelier).then((res) =>
                        setFavoriteShopIds(res.favorites.map((f) => f.id)),
                      )
                    }
                    style={styles.favBtn}
                  >
                    <MaterialIcons
                      name={
                        favoriteShopIds.includes(atelier.id)
                          ? "favorite"
                          : "favorite-border"
                      }
                      size={18}
                      color="#D4AF37"
                    />
                  </Pressable>
                </View>

                <Text style={styles.cardAddress} numberOfLines={1}>
                  {atelier.address}
                </Text>

                <View style={styles.cardMeta}>
                  {atelier.isOwned ? (
                    <View style={styles.metaBadgeOwned}>
                      <MaterialIcons name="verified" size={12} color="#000" />
                      <Text style={styles.metaTextOwned}>Tu barbería</Text>
                    </View>
                  ) : null}
                  <View style={styles.metaBadge}>
                    <MaterialIcons name="star" size={12} color="#D4AF37" />
                    <Text style={styles.metaText}>{atelier.rating}</Text>
                  </View>
                </View>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={20}
                color="#333"
                style={{ marginLeft: 5 }}
              />
            </Pressable>
          ))}
        </View>

        {!isLoadingShops && !shopsError && filteredAteliers.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={40} color="#333" />
            <Text style={styles.emptyText}>
              No encontramos resultados para "{searchQuery}"
            </Text>
          </View>
        )}
      </ScrollView>

      {/* --- MENU INFERIOR 4 BOTONES --- */}
      <View style={styles.navContainer}>
        <BlurView intensity={90} tint="dark" style={styles.bottomNav}>
          <View style={styles.navItem}>
            <View style={styles.activeIndicator}>
              <MaterialIcons name="content-cut" size={22} color="#000" />
            </View>
            <Text style={styles.navLabelActive}>Atelier</Text>
          </View>

          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)/services-list")}
          >
            <MaterialIcons name="grid-view" size={24} color="#555" />
            <Text style={styles.navLabel}>Servicios</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/bookings")}
          >
            <MaterialIcons name="event-note" size={24} color="#555" />
            <Text style={styles.navLabel}>Turnos</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <MaterialIcons name="person-outline" size={24} color="#555" />
            <Text style={styles.navLabel}>Perfil</Text>
          </Pressable>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  welcomeText: {
    color: "#666",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  brandTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 1,
  },
  gold: { color: "#D4AF37" },
  avatarContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: "#D4AF37",
    padding: 2,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 20 },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: { color: "#D4AF37", fontSize: 14, fontWeight: "800" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 150 },

  toggleWrap: { alignItems: "center", marginVertical: 20 },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 25,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  toggleInactive: { paddingHorizontal: 24, paddingVertical: 8 },
  toggleInactiveText: { color: "#666", fontWeight: "700", fontSize: 13 },
  toggleActive: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    backgroundColor: "#D4AF37",
    borderRadius: 20,
  },
  toggleActiveText: { color: "#000", fontWeight: "800", fontSize: 13 },

  searchContainer: { marginBottom: 25 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    borderColor: "#222",
  },
  searchInput: { flex: 1, color: "#FFF", marginLeft: 10, fontSize: 15 },

  sectionTitle: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
    letterSpacing: -0.5,
  },

  listWrap: { gap: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
    alignItems: "center",
  },
  cardImage: { width: 85, height: 85, borderRadius: 16 },
  cardImageFallback: {
    width: 85,
    height: 85,
    borderRadius: 16,
    backgroundColor: "#161616",
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardName: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  favBtn: { padding: 5 },
  cardAddress: { color: "#666", fontSize: 13, marginTop: 2 },
  cardMeta: { flexDirection: "row", marginTop: 12, gap: 10 },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metaText: { color: "#FFF", fontSize: 11, fontWeight: "700" },
  metaBadgeOwned: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4AF37",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  metaTextOwned: { color: "#000", fontSize: 11, fontWeight: "800" },

  emptyStateCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
    backgroundColor: "#111",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: "#444", marginTop: 10, textAlign: "center" },

  navContainer: {
    position: "absolute",
    bottom: 35,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 35,
    overflow: "hidden",
    backgroundColor: "rgba(20, 20, 20, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  navItem: { alignItems: "center", minWidth: 65 },
  activeIndicator: {
    backgroundColor: "#D4AF37",
    width: 48,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  navLabel: { color: "#666", fontSize: 10, fontWeight: "600", marginTop: 2 },
  navLabelActive: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
});
