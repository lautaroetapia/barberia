import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useState } from "react";
import {
    ImageBackground,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getFavoriteShops, toggleFavoriteShop } from "@/lib/favorites";

const MAP_BG_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBXgwhuCuUG5-2SjKMlHcDbtz8HpqLDGz7AXPJfY1eNcOX8djunn_5afjCU3ye98w1MVguEdqWUzZMF-Ik0MjfWasPOnpbsp-MMUCLAHva1OLbcT4aTQpJP6w0DUv-A1-Co6M2rO5OthVRVrflD3fI-HHduMhXk1yk4aXKvqzGMQl6SgKf0JjIuJZpsavtG8pi978FJCIQ15vDAA91mNIwhqEwNG0qtYS7f43sogd50Vm-og7ovX7JGAH4gzoxi-uoqh-8vWjcysyPc";

const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB5K5kdbyuEE_FlvnVdNnzEKphuX61-x7ZOaZe2Ra9MI9HCdhZysRZi31zDYGwXSotfERsL82PB8ZxiZ3JDIFXHQxdVxZWGsyfBCzesIO2Oj9jmMffDenCrZrM0taYgQP_rwe5h3UPAR8wC6qyGJ1tynpypJeOjJBpQFe1u1AT8MwHwj5PVszkuK0KoVIyEpDgekvO029AeaTR3wj0fyFW8wQ_CEGzbAFVMlkZjQBxxBbunx2D0reO1j_TwSu4N5ebAc6Ky-uNVxZvQ";

const mapAteliers = [
  {
    id: "shop-1",
    name: "Atelier Palermo",
    address: "Av. Santa Fe 3200",
    rating: "4.8",
    reviews: "124",
    top: "32%",
    left: "25%",
  },
  {
    id: "shop-2",
    name: "Atelier Belgrano",
    address: "Cabildo 1850",
    rating: "4.7",
    reviews: "96",
    top: "49%",
    right: "24%",
  },
  {
    id: "shop-3",
    name: "Atelier Recoleta",
    address: "Av. Pueyrredon 2100",
    rating: "4.9",
    reviews: "203",
    left: "50%",
    bottom: "34%",
  },
] as const;

export default function MapViewScreen() {
  const [showSelectedCard, setShowSelectedCard] = useState(true);
  const [selectedShopId, setSelectedShopId] = useState(mapAteliers[0].id);
  const [favoriteShopIds, setFavoriteShopIds] = useState<string[]>([]);

  useFocusEffect(() => {
    let isMounted = true;

    const loadFavorites = async () => {
      const favorites = await getFavoriteShops();

      if (!isMounted) {
        return;
      }

      setFavoriteShopIds(favorites.map((item) => item.id));
    };

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  });

  const selectedAtelier =
    mapAteliers.find((atelier) => atelier.id === selectedShopId) ??
    mapAteliers[0];

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={{ uri: MAP_BG_URI }}
        style={styles.mapBackground}
      >
        <View style={styles.mapOverlay} />
      </ImageBackground>

      <View style={styles.header}>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: AVATAR_URI }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      </View>

      <View style={styles.toggleWrap}>
        <View style={styles.toggleContainer}>
          <Pressable style={styles.toggleActive}>
            <Text style={styles.toggleActiveText}>Mapa</Text>
          </Pressable>
          <Pressable
            style={styles.toggleInactive}
            onPress={() => router.replace("/(tabs)/services-list")}
          >
            <Text style={styles.toggleInactiveText}>Lista</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.pinLayer} pointerEvents="box-none">
        {mapAteliers.map((atelier) => {
          const isSelected = atelier.id === selectedAtelier.id;

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
              <MaterialIcons
                name="location-on"
                size={isSelected ? 42 : 34}
                color={isSelected ? "#d4af37" : "#4d4635"}
              />
              <View
                style={
                  isSelected ? styles.pinShadowLarge : styles.pinShadowSmall
                }
              />
            </Pressable>
          );
        })}
      </View>

      {showSelectedCard ? (
        <View style={styles.selectedCardWrap}>
          <View style={styles.selectedCard}>
            <View style={styles.cardTopRow}>
              <View>
                <Text style={styles.cardTitle}>{selectedAtelier.name}</Text>
                <View style={styles.cardAddressRow}>
                  <MaterialIcons name="map" size={13} color="#d0c5af" />
                  <Text style={styles.cardAddress}>
                    {selectedAtelier.address}
                  </Text>
                </View>
              </View>

              <View style={styles.cardActionsRight}>
                <Pressable
                  style={styles.favoriteButton}
                  onPress={() => {
                    void toggleFavoriteShop({
                      id: selectedAtelier.id,
                      name: selectedAtelier.name,
                      address: selectedAtelier.address,
                    }).then((result) => {
                      setFavoriteShopIds(
                        result.favorites.map((item) => item.id),
                      );
                    });
                  }}
                >
                  <MaterialIcons
                    name={
                      favoriteShopIds.includes(selectedAtelier.id)
                        ? "favorite"
                        : "favorite-border"
                    }
                    size={18}
                    color="#f2ca50"
                  />
                </Pressable>

                <Pressable onPress={() => setShowSelectedCard(false)}>
                  <MaterialIcons name="close" size={20} color="#d0c5af" />
                </Pressable>
              </View>
            </View>

            <View style={styles.ratingRow}>
              <View style={styles.starsRow}>
                <MaterialIcons name="star" size={12} color="#f2ca50" />
                <MaterialIcons name="star" size={12} color="#f2ca50" />
                <MaterialIcons name="star" size={12} color="#f2ca50" />
                <MaterialIcons name="star" size={12} color="#f2ca50" />
                <MaterialIcons name="star-half" size={12} color="#f2ca50" />
              </View>
              <Text style={styles.ratingText}>
                {selectedAtelier.rating} ({selectedAtelier.reviews})
              </Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.openText}>Abierto</Text>
            </View>

            <Pressable
              style={styles.servicesButton}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/booking-service",
                  params: {
                    shopId: selectedAtelier.id,
                    shopName: selectedAtelier.name,
                  },
                })
              }
            >
              <Text style={styles.servicesButtonText}>Ver servicios</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/(tabs)")}
        >
          <MaterialIcons name="content-cut" size={22} color="#7f7766" />
          <Text style={styles.navText}>Atelier</Text>
        </Pressable>

        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <MaterialIcons name="dry-cleaning" size={22} color="#d4af37" />
          <Text style={styles.navTextActive}>Services</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/(tabs)/bookings")}
        >
          <MaterialIcons name="event-available" size={22} color="#7f7766" />
          <Text style={styles.navText}>Bookings</Text>
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
    overflow: "hidden",
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(19, 19, 19, 0.55)",
  },
  header: {
    height: 74,
    paddingTop: 10,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    color: "#d4af37",
    fontSize: 22,
    letterSpacing: 3,
    fontWeight: "800",
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
    backgroundColor: "#353535",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  toggleWrap: {
    alignItems: "center",
    marginTop: 6,
  },
  toggleContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 999,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
  },
  toggleActive: {
    paddingHorizontal: 26,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#d4af37",
  },
  toggleActiveText: {
    color: "#3c2f00",
    fontSize: 13,
    fontWeight: "700",
  },
  toggleInactive: {
    paddingHorizontal: 26,
    paddingVertical: 9,
  },
  toggleInactiveText: {
    color: "#d0c5af",
    fontSize: 13,
    fontWeight: "500",
  },
  pinLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  pinWrap: {
    position: "absolute",
    alignItems: "center",
  },
  pinShadowSmall: {
    marginTop: -2,
    width: 10,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  pinShadowLarge: {
    marginTop: -3,
    width: 12,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  selectedCardWrap: {
    position: "absolute",
    left: "50%",
    bottom: "40%",
    marginLeft: -144,
    width: 288,
  },
  selectedCard: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(53, 53, 53, 0.72)",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  cardActionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  favoriteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14,14,14,0.55)",
  },
  cardTitle: {
    color: "#e5e2e1",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardAddressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  cardAddress: {
    color: "#d0c5af",
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  ratingText: {
    color: "#d0c5af",
    fontSize: 10,
  },
  dot: {
    color: "#4d4635",
    fontSize: 10,
  },
  openText: {
    color: "#d4af37",
    fontSize: 10,
  },
  servicesButton: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
  },
  servicesButtonText: {
    color: "#3c2f00",
    fontSize: 14,
    fontWeight: "700",
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
