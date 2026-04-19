import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { getFavoriteShops, toggleFavoriteShop } from "@/lib/favorites";
import { supabase } from "@/lib/supabase";
import {
    getGoogleAvatarFromProviderToken,
    getUserAvatarUri,
    isGoogleUser,
} from "@/lib/user-avatar";

const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC7Jib8WJJf28MiL9QZlHjmVQ71-EeLJUG5eNdo2uL7djrEoU3gbzFhVN_QYVqdEOFx8zUmVJAkKGbI-FDuHHxzLxcUZuIlrHWtw1QdHK9KFdZ1oTvdmljOtfOxzmam6jlxe0_li39fNXDzNclmrwMB4Oo0giavWQvlmaLZjaUpgpsFoBImIj3LJmVwlssXHuUQEu_qPm5gtN1B1Es2xGaCw5T5A_lpwMPGET4xjX_-0YQvv8JmrTT-ID0YXHOIsx5dfhR_z_GYUWoV";

const ateliers = [
  {
    id: "1",
    name: "El Dorado Classic",
    address: "Av. de la Libertad 124, Roma Nte.",
    rating: "4.9",
    reviews: "128",
    distance: "1.2 km",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNy_lzi9Q7Qvr1H79_n-wkr2s4QGH8bB8pMKKnXmLxpDjGR2NkonLIIH6VHdn2dzVxDlkRLN2no6Woc1jB-kL5Nu9h68TWwf0pWle_nZ6G0zfxVsDtWi8SjZl_xJp0ZBQ0eZhT1WhjVi_HIPYfneeNtux0BvQ6HuRpH8-RAKRCJlwa9w45WttD2U55lsCHPyNDjwtFUcxFsbgZ8VO4_PYyKQkN8-EWZ_9cU1y_0sMsIBB3YtIuOzDKOuO0dPNOfYe80mrp0GzNtKiR",
  },
  {
    id: "2",
    name: "Obsidian Room",
    address: "Callejon del Sastre 45, Condesa",
    rating: "4.8",
    reviews: "94",
    distance: "2.4 km",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDOkx9i8dYIo0qGm3aOK6SZA0mp3wigcQblgS5kuIU8CJGQGAJWy9hafP1IzYTWxdgpGoykh2-KGKQPiIh1zibPdUc1sbZJ2fVvZb7HLRL5-eEpL8W2SdjqzDkAa1gCOi9WsWRN2V1S_WKmMOa0VO4RkFqB9R2r9CPNJ2dOWtmvnHcAp7YZXsENFrbed8Cs6GD1hk7PuwYAEhAv9DkEBMyNxfU-jUrPqxhK-YBXmkvZNTQ6-UHnc7IPLy1JoTA4vI5B5vGTva2PuACp",
  },
  {
    id: "3",
    name: "Gentleman's Quarter",
    address: "Paseo de la Reforma 332, Juarez",
    rating: "5.0",
    reviews: "215",
    distance: "3.1 km",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBx3Ak9fNvSdMlB7Oj73FqvPcK8P9pMqPrvw1WU9a8yDyQwP8onJsUIo_NBEd6A-puFqNX9riDfKwDOQr2rw9raGTmK-9h_cizzXw7jT1ECZSsP8mnDZsERSRpsoEI3dz7bNMiKH6uEDHOhwBhdNMLf7f-ndnVV_mZ_MQ-8xw4BvMrYid1tGTLkcWue5kU7KmVxm742aqcoKvEX7SsxzP7kIeRRV_bqNgPPyM98lMYcN6nqjLLzSUO7LGDyOzpfKHYbvEJg4LSeq5X1",
  },
];

export default function ServicesListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [avatarUri, setAvatarUri] = useState(AVATAR_URI);
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

  useEffect(() => {
    let isMounted = true;

    const applyUserData = async (user: User | null) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user ?? null;
      const userForAvatar = sessionUser ?? user;

      const resolvedAvatar = getUserAvatarUri(userForAvatar, AVATAR_URI);
      setAvatarUri(resolvedAvatar);

      if (!isGoogleUser(userForAvatar)) {
        return;
      }

      const googleAvatar = await getGoogleAvatarFromProviderToken(
        sessionData.session?.provider_token,
      );

      if (!isMounted || !googleAvatar) {
        return;
      }

      setAvatarUri(googleAvatar);
    };

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        void applyUserData(data.user ?? null);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        void applyUserData(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      void applyUserData(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const filteredAteliers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return ateliers;
    }

    return ateliers.filter(
      (atelier) =>
        atelier.name.toLowerCase().includes(normalizedQuery) ||
        atelier.address.toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>NAVAJA DORADA</Text>
        <Image
          source={{ uri: avatarUri }}
          style={styles.avatar}
          contentFit="cover"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggleWrap}>
          <View style={styles.toggleContainer}>
            <Pressable
              style={styles.toggleInactive}
              onPress={() => router.replace("/(tabs)/explore")}
            >
              <Text style={styles.toggleInactiveText}>Mapa</Text>
            </Pressable>
            <Pressable style={styles.toggleActive}>
              <Text style={styles.toggleActiveText}>Lista</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons
            name="search"
            size={21}
            color="rgba(208, 197, 175, 0.45)"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar barberia..."
            placeholderTextColor="rgba(208, 197, 175, 0.42)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Ateliers Disponibles</Text>
          <Text style={styles.subtitle}>Cerca de ti</Text>
        </View>

        <View style={styles.listWrap}>
          {filteredAteliers.map((atelier) => (
            <Pressable
              key={atelier.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/booking-service",
                  params: {
                    shopId: atelier.id,
                    shopName: atelier.name,
                  },
                })
              }
            >
              <View style={styles.cardAccent} />

              <Pressable
                style={styles.favoriteButton}
                onPress={() => {
                  void toggleFavoriteShop({
                    id: atelier.id,
                    name: atelier.name,
                    address: atelier.address,
                  }).then((result) => {
                    setFavoriteShopIds(result.favorites.map((item) => item.id));
                  });
                }}
              >
                <MaterialIcons
                  name={
                    favoriteShopIds.includes(atelier.id)
                      ? "favorite"
                      : "favorite-border"
                  }
                  size={18}
                  color="#f2ca50"
                />
              </Pressable>

              <Image
                source={{ uri: atelier.image }}
                style={styles.cardImage}
                contentFit="cover"
              />

              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{atelier.name}</Text>
                <Text style={styles.cardAddress}>{atelier.address}</Text>

                <View style={styles.metaRow}>
                  <View style={styles.metaGroup}>
                    <MaterialIcons name="star" size={14} color="#f2ca50" />
                    <Text style={styles.metaText}>
                      {atelier.rating}{" "}
                      <Text style={styles.metaMuted}>({atelier.reviews})</Text>
                    </Text>
                  </View>

                  <View style={styles.metaDot} />

                  <View style={styles.metaGroup}>
                    <MaterialIcons
                      name="location-on"
                      size={14}
                      color="#9f9685"
                    />
                    <Text style={styles.metaText}>{atelier.distance}</Text>
                  </View>
                </View>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={23}
                color="rgba(208, 197, 175, 0.35)"
              />
            </Pressable>
          ))}

          {!filteredAteliers.length ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Sin resultados</Text>
              <Text style={styles.emptyStateText}>
                Prueba con otro nombre o direccion.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable
          style={[styles.navItem, styles.navItemActive]}
          onPress={() => router.replace("/(tabs)")}
        >
          <MaterialIcons name="content-cut" size={22} color="#d4af37" />
          <Text style={styles.navTextActive}>Atelier</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/(tabs)/explore")}
        >
          <MaterialIcons name="dry-cleaning" size={22} color="#7f7766" />
          <Text style={styles.navText}>Services</Text>
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#d4af37",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  toggleWrap: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 14,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
  },
  toggleInactive: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 999,
  },
  toggleInactiveText: {
    color: "#d0c5af",
    fontSize: 13,
    fontWeight: "500",
  },
  toggleActive: {
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#f2ca50",
  },
  toggleActiveText: {
    color: "#3c2f00",
    fontSize: 13,
    fontWeight: "700",
  },
  searchWrap: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#0e0e0e",
    borderBottomWidth: 2,
    borderBottomColor: "rgba(153, 144, 124, 0.35)",
    justifyContent: "center",
    paddingLeft: 44,
    paddingRight: 12,
    marginBottom: 18,
  },
  searchIcon: {
    position: "absolute",
    left: 14,
    top: 16,
  },
  searchInput: {
    color: "#e5e2e1",
    fontSize: 15,
    paddingVertical: 10,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#e5e2e1",
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  subtitle: {
    color: "#d0c5af",
    fontSize: 13,
  },
  listWrap: {
    gap: 12,
  },
  card: {
    position: "relative",
    minHeight: 100,
    borderRadius: 16,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden",
  },
  favoriteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(14,14,14,0.72)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  cardAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#f2ca50",
  },
  cardImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    color: "#e5e2e1",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
  },
  cardAddress: {
    marginTop: 2,
    color: "rgba(208, 197, 175, 0.72)",
    fontSize: 12,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: "#d0c5af",
    fontSize: 12,
  },
  metaMuted: {
    color: "rgba(208, 197, 175, 0.52)",
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 99,
    backgroundColor: "#4d4635",
  },
  emptyStateCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
    backgroundColor: "#1c1b1b",
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    gap: 4,
  },
  emptyStateTitle: {
    color: "#e5e2e1",
    fontSize: 16,
    fontWeight: "700",
  },
  emptyStateText: {
    color: "#d0c5af",
    fontSize: 12,
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
