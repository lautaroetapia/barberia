import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Dimensions,
    ImageBackground,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    type DimensionValue,
} from "react-native";

import { getPublicBarbershops } from "@/lib/booking-catalog";
import { getFavoriteShops, toggleFavoriteShop } from "@/lib/favorites";
import { supabase } from "@/lib/supabase";
import { getUserAvatarUri } from "@/lib/user-avatar";

const { width } = Dimensions.get("window");

const MAP_BG_URI =
  "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000";
const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB5K5kdbyuEE_FlvnVdNnzEKphuX61-x7ZOaZe2Ra9MI9HCdhZysRZi31zDYGwXSotfERsL82PB8ZxiZ3JDIFXHQxdVxZWGsyfBCzesIO2Oj9jmMffDenCrZrM0taYgQP_rwe5h3UPAR8wC6qyGJ1tynpypJeOjJBpQFe1u1AT8MwHwj5PVszkuK0KoVIyEpDgekvO029AeaTR3wj0fyFW8wQ_CEGzbAFVMlkZjQBxxBbunx2D0reO1j_TwSu4N5ebAc6Ky-uNVxZvQ";

type MapAtelier = {
  id: string;
  name: string;
  address: string;
  rating: string;
  reviews: string;
  image: string;
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
};

export default function MapViewScreen() {
  const [ateliers, setAteliers] = useState<MapAtelier[]>([]);
  const [showSelectedCard, setShowSelectedCard] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>([]);
  const [avatarUri, setAvatarUri] = useState(AVATAR_URI);

  // --- CARGAR BARBERIAS Y FAVORITOS ---
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadData = async () => {
        const shops = await getPublicBarbershops();
        if (isMounted && shops) {
          const mapped = shops.map((shop, i) => {
            const positions: {
              top?: DimensionValue;
              left?: DimensionValue;
              right?: DimensionValue;
              bottom?: DimensionValue;
            }[] = [
              { top: "35%", left: "20%" },
              { top: "25%", right: "15%" },
              { left: "45%", bottom: "45%" },
              { top: "50%", left: "10%" },
              { bottom: "30%", right: "25%" },
            ];
            const pos = positions[i % positions.length];
            return {
              id: shop.id,
              name: shop.name,
              address: shop.address,
              rating: shop.rating,
              reviews: shop.reviews,
              image: shop.logoUrl,
              ...pos,
            };
          });
          setAteliers(mapped);
          if (!selectedShopId && mapped.length > 0) {
            setSelectedShopId(mapped[0].id);
          }
        }

        const favorites = await getFavoriteShops();
        if (isMounted) setFavoriteShopIds(favorites.map((item) => item.id));
      };
      void loadData();
      return () => {
        isMounted = false;
      };
    }, []),
  );

  // --- CARGAR USUARIO ---
  useEffect(() => {
    let isMounted = true;
    const applyUserData = async (user: User | null) => {
      setAvatarUri(getUserAvatarUri(user, AVATAR_URI));
    };

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted) void applyUserData(data.user ?? null);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedAtelier =
    ateliers.find((a) => a.id === selectedShopId) ?? ateliers[0];

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={{ uri: MAP_BG_URI }}
        style={styles.mapBackground}
      >
        <View style={styles.mapOverlay} />
      </ImageBackground>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.brand}>
          NAVAJA <Text style={styles.gold}>DORADA</Text>
        </Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      </View>

      {/* SELECTOR MAPA/LISTA */}
      <View style={styles.toggleWrap}>
        <BlurView intensity={30} tint="dark" style={styles.toggleContainer}>
          <Pressable
            style={styles.toggleActive}
            onPress={() => router.replace("/(tabs)/explore")}
          >
            <Text style={styles.toggleActiveText}>Mapa</Text>
          </Pressable>
          <Pressable
            style={styles.toggleInactive}
            onPress={() => router.replace("/(tabs)/services-list")}
          >
            <Text style={styles.toggleInactiveText}>Lista</Text>
          </Pressable>
        </BlurView>
      </View>

      {/* PIN LAYER */}
      <View style={styles.pinLayer} pointerEvents="box-none">
        {ateliers.map((atelier) => {
          const isSelected =
            selectedAtelier && atelier.id === selectedAtelier.id;
          return (
            <Pressable
              key={atelier.id}
              style={[
                styles.pinWrap,
                {
                  top: atelier.top,
                  left: atelier.left,
                  right: atelier.right,
                  bottom: atelier.bottom,
                },
              ]}
              onPress={() => {
                setSelectedShopId(atelier.id);
                setShowSelectedCard(true);
              }}
            >
              <View style={[styles.pinDot, isSelected && styles.pinDotActive]}>
                <MaterialIcons
                  name="content-cut"
                  size={isSelected ? 18 : 14}
                  color={isSelected ? "#000" : "#D4AF37"}
                />
              </View>
              {isSelected && <View style={styles.pinPulse} />}
            </Pressable>
          );
        })}
      </View>

      {/* TARJETA DETALLE SELECCIONADO */}
      {showSelectedCard && selectedAtelier && (
        <View style={styles.cardContainer}>
          <BlurView intensity={80} tint="dark" style={styles.selectedCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.cardTitle}>{selectedAtelier.name}</Text>
                <View style={styles.cardAddressRow}>
                  <MaterialIcons name="location-on" size={12} color="#D4AF37" />
                  <Text style={styles.cardAddress}>
                    {selectedAtelier.address}
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => {
                  toggleFavoriteShop(selectedAtelier).then((res) =>
                    setFavoriteShopIds(res.favorites.map((f) => f.id)),
                  );
                }}
                style={styles.favCircle}
              >
                <MaterialIcons
                  name={
                    favoriteShopIds.includes(selectedAtelier.id)
                      ? "favorite"
                      : "favorite-border"
                  }
                  size={20}
                  color="#D4AF37"
                />
              </Pressable>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="star" size={14} color="#D4AF37" />
                <Text style={styles.statText}>
                  {selectedAtelier.rating} ({selectedAtelier.reviews})
                </Text>
              </View>
              <Text style={styles.statDivider}>•</Text>
              <Text style={styles.openText}>ABIERTO</Text>
            </View>

            <Pressable
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/booking-service",
                  params: { shopId: selectedAtelier.id },
                })
              }
            >
              <Text style={styles.actionButtonText}>VER SERVICIOS</Text>
              <MaterialIcons name="chevron-right" size={20} color="#000" />
            </Pressable>
          </BlurView>
        </View>
      )}

      {/* --- MENU INFERIOR COMPLETO --- */}
      <View style={styles.bottomNavContainer}>
        <BlurView intensity={90} tint="dark" style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)")}
          >
            <MaterialIcons name="content-cut" size={22} color="#555" />
            <Text style={styles.navText}>Atelier</Text>
          </Pressable>

          <View style={styles.navItem}>
            <View style={styles.activeIndicator}>
              <MaterialIcons name="grid-view" size={22} color="#000" />
            </View>
            <Text style={styles.navTextActive}>Servicios</Text>
          </View>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/bookings")}
          >
            <MaterialIcons name="event-note" size={22} color="#555" />
            <Text style={styles.navText}>Turnos</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push("/(tabs)/profile")}
          >
            <MaterialIcons name="person-outline" size={22} color="#555" />
            <Text style={styles.navText}>Perfil</Text>
          </Pressable>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  mapBackground: { ...StyleSheet.absoluteFillObject },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  gold: { color: "#D4AF37", fontWeight: "900" },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  brand: { color: "#FFF", fontSize: 18, letterSpacing: 2, fontWeight: "300" },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4AF37",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },

  toggleWrap: { alignItems: "center", marginTop: 15, zIndex: 10 },
  toggleContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  toggleActive: {
    paddingHorizontal: 25,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
  },
  toggleActiveText: { color: "#000", fontWeight: "700", fontSize: 12 },
  toggleInactive: { paddingHorizontal: 25, paddingVertical: 8 },
  toggleInactiveText: { color: "#888", fontWeight: "600", fontSize: 12 },

  pinLayer: { ...StyleSheet.absoluteFillObject },
  pinWrap: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#121212",
    borderWidth: 2,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDotActive: {
    backgroundColor: "#D4AF37",
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  pinPulse: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },

  cardContainer: { position: "absolute", bottom: 140, left: 20, right: 20 },
  selectedCard: {
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  cardAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardAddress: { color: "#AAA", fontSize: 12 },
  favCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    gap: 10,
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: "#FFF", fontSize: 12, fontWeight: "600" },
  statDivider: { color: "#444" },
  openText: { color: "#00C851", fontSize: 11, fontWeight: "800" },
  actionButton: {
    backgroundColor: "#D4AF37",
    height: 50,
    borderRadius: 18,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionButtonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1,
  },

  bottomNavContainer: { position: "absolute", bottom: 35, left: 20, right: 20 },
  bottomNav: {
    flexDirection: "row",
    borderRadius: 35,
    paddingHorizontal: 10,
    paddingVertical: 12,
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
  navText: { color: "#777", fontSize: 10, fontWeight: "600", marginTop: 2 },
  navTextActive: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
});
