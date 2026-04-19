import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Skeleton } from "@/components/ui/skeleton";
import { getFavoriteBarbers, toggleFavoriteBarber } from "@/lib/favorites";
import { supabase } from "@/lib/supabase";

const getDisplayName = (user: User | null) => {
  if (!user) {
    return "Cliente";
  }

  const displayNameFromMeta =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.user_metadata?.given_name;

  if (typeof displayNameFromMeta === "string" && displayNameFromMeta.trim()) {
    return displayNameFromMeta.trim();
  }

  if (user.email) {
    return user.email.split("@")[0] ?? "Cliente";
  }

  return "Cliente";
};

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState("Cliente");
  const [isHomeLoading, setIsHomeLoading] = useState(true);
  const [showNextTurnCard, setShowNextTurnCard] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [notificationsModalVisible, setNotificationsModalVisible] =
    useState(false);
  const [favoriteBarberIds, setFavoriteBarberIds] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
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
    }, []),
  );

  const notifications = [
    {
      id: "1",
      title: "Recordatorio de turno",
      body: "Tu proximo turno es el 15 Oct a las 10:30 AM.",
      time: "Hace 2 h",
    },
    {
      id: "2",
      title: "Promocion activa",
      body: "Esta semana tienes 10% OFF en corte + barba.",
      time: "Ayer",
    },
  ];

  useEffect(() => {
    let isMounted = true;

    const applyUserData = (user: User | null) => {
      setDisplayName(getDisplayName(user));
    };

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!isMounted) {
          return;
        }

        applyUserData(data.user ?? null);
        setIsHomeLoading(false);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        applyUserData(null);
        setIsHomeLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      applyUserData(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const featuredBarbers = [
    {
      id: "1",
      barberId: "barber-mateo",
      name: "Mateo",
      role: "Master Barber",
      branch: "Atelier Palermo",
      shopId: "shop-1",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuArBcyyrUmsG-RrzPKo-y7lWSVmTZZitta3L4K2EKrKLllgTDFQ-vCxvX9fuFYV7bLwCVDc0x8mQXnSkLApvH5qVzVBZEKOfZ7dnjLWTd66WEEztQrkqxJZ0DqqFFozFw_7gvIPuKibDtgd3S9qf5ZHLEYQDW1UUea4yWaXNEvO8vRi-FBc1dX5Kov2jQE9rM4-iSL4fQllOXJkQOkMZjXpa74GxotlqP9YqhXxbZb1pmGtqpyywzZ4xQ7o_O-zNHBK1uczsk4Gnj9R",
      featured: true,
    },
    {
      id: "2",
      barberId: "barber-julian",
      name: "Julian",
      role: "Experto en Barba",
      branch: "Atelier Palermo",
      shopId: "shop-1",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCLAEqJ3muO7atMDm6-C9wVeO-iqCnlSAPEcglWhQhTsWTsAFoEIAvrbIjg_ZLN9VAPSyhGl327AEvxC6RNfuveiZArbZBOwa0i5e1rlmYHVZMLimA7_mGKoL8S0g8m7TdPwQNVgprwcbaPHwJn8Bdw4GvFLxJMUXRZY5GVc_aeI-rkuYUQGq7F6WdvHXT2KcosX0Tf0k0BsokedtoWZAjE7mtMAwOs6vgIc1FhXqxzrQ8R8eIU-XRPGMCoN_uNwh10eNKVkQOYdVBR",
      featured: false,
    },
    {
      id: "3",
      barberId: "barber-lucas",
      name: "Enzo",
      role: "Corte Clasico",
      branch: "Atelier Belgrano",
      shopId: "shop-2",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDGsasiihcc7rMarO3IyXCEilyMyuL04ZmAih17eKroXiHVKv1Vk3zx1o-ALy2OMB5SARlXZcTnmg_4-ipf8ktrH7YL9e1Vuyrj8r5mrNogd9fRPDv32jFwZnbAxcF5nWb_CfDlf_FyRAQpuvWYrzAQPcdL8lAEdEme3BRdmQnTO904dNfew8Uywkt_iGRPS4FkbFXXoNYDUyb6oPG5EpCYfeV98nC5rw94_F-Fp3sAHVRSSdXIynppClCvRhJt1cB-QLwAJArEneWJ",
      featured: false,
    },
  ];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCenter}>
          <Text style={styles.brandTitle}>NAVAJA DORADA</Text>
          {isHomeLoading ? (
            <Skeleton style={styles.greetingSkeleton} borderRadius={6} />
          ) : (
            <Text style={styles.greeting}>Hola, {displayName}</Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <Pressable
            style={styles.notificationButton}
            onPress={() => router.push("/(tabs)/favorites")}
          >
            <MaterialIcons name="favorite" size={20} color="#f2ca50" />
          </Pressable>

          <Pressable
            style={styles.notificationButton}
            onPress={() => setNotificationsModalVisible(true)}
          >
            <MaterialIcons name="notifications" size={20} color="#f2ca50" />
            {notifications.length ? (
              <View style={styles.notificationDot} />
            ) : null}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu proximo turno</Text>

          {isHomeLoading ? (
            <View style={styles.nextTurnCardSkeleton}>
              <View style={styles.leftAccent} />
              <View style={styles.nextTurnTopRow}>
                <View style={styles.nextTurnTextSkeletonWrap}>
                  <Skeleton style={styles.serviceTitleSkeleton} />
                  <Skeleton style={styles.dateSkeleton} />
                </View>

                <View style={styles.barberBadgeSkeleton}>
                  <Skeleton style={styles.badgeAvatar} borderRadius={14} />
                  <Skeleton style={styles.badgeNameSkeleton} borderRadius={6} />
                </View>
              </View>

              <View style={styles.turnActionsRow}>
                <Skeleton style={styles.actionButtonSkeleton} />
                <Skeleton style={styles.actionButtonSkeleton} />
              </View>
            </View>
          ) : showNextTurnCard ? (
            <View style={styles.nextTurnCard}>
              <View style={styles.leftAccent} />

              <View style={styles.nextTurnTopRow}>
                <View>
                  <Text style={styles.serviceTitle}>Corte Atelier</Text>
                  <View style={styles.dateRow}>
                    <MaterialIcons
                      name="calendar-today"
                      size={14}
                      color="#d0c5af"
                    />
                    <Text style={styles.dateText}>15 Oct, 10:30 AM</Text>
                  </View>
                </View>

                <View style={styles.barberBadge}>
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuApM6kbXFa4PcgRJQRB7p-JfBdL0DaX53ssvglgFwYNfyAWo25lbX33-nsZOisb050oKn0-JEBNbwrPMPWVD04vT2DoT0VKiaHM7bugI50OyuRS06UWnGbFsgysG8yDC-484hGpUlsF9wjA029ki__gODuIehuc-tSQx24hOr8REAkY3QcDxan3NYN-ePruYdsRwh8MvsftoewPgJsa99S_Qo7hM7Ag8aUJpnAJ9k7q6feXROY02d_s3gZjcMP3VoXRcJt1uUXQvdGW",
                    }}
                    style={styles.badgeAvatar}
                    contentFit="cover"
                  />
                  <Text style={styles.badgeName}>Mateo</Text>
                </View>
              </View>

              <View style={styles.turnActionsRow}>
                <Pressable
                  style={styles.goldActionButton}
                  onPress={() => router.push("/(tabs)/bookings")}
                >
                  <Text style={styles.goldActionButtonText}>Ver Detalles</Text>
                </Pressable>
                <Pressable
                  style={styles.darkActionButton}
                  onPress={() => setCancelModalVisible(true)}
                >
                  <Text style={styles.darkActionButtonText}>Cancelar</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.emptyTurnCard}>
              <Text style={styles.emptyTurnTitle}>
                No tienes turnos activos
              </Text>
              <Text style={styles.emptyTurnText}>
                Reserva uno nuevo cuando quieras.
              </Text>
            </View>
          )}
        </View>

        <Pressable
          style={styles.reserveButton}
          onPress={() => router.push("/(tabs)/services-list")}
        >
          <View>
            <Text style={styles.reserveTitle}>Reservar turno</Text>
            <Text style={styles.reserveSubtitle}>
              Encuentra tu espacio en el Atelier
            </Text>
          </View>

          <View style={styles.reserveIconWrap}>
            <MaterialIcons name="add-circle" size={34} color="#fdf6df" />
          </View>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredTitle}>Barberos destacados</Text>
            {isHomeLoading ? (
              <Skeleton style={styles.featuredLinkSkeleton} borderRadius={6} />
            ) : (
              <Pressable
                onPress={() => router.push("/(tabs)/featured-barbers")}
              >
                <Text style={styles.featuredLink}>Ver todos</Text>
              </Pressable>
            )}
          </View>

          {isHomeLoading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {[0, 1].map((item) => (
                <View key={item} style={styles.barberCard}>
                  <View style={styles.favoriteBarberButton}>
                    <Skeleton
                      style={styles.favoriteIconSkeleton}
                      borderRadius={9}
                    />
                  </View>

                  <View style={styles.barberImageBorder}>
                    <Skeleton style={styles.barberImage} borderRadius={44} />
                  </View>

                  <Skeleton style={styles.barberNameSkeleton} />
                  <Skeleton style={styles.barberRoleSkeleton} />
                  <Skeleton style={styles.barberBranchSkeleton} />

                  <Skeleton style={styles.profileButtonSkeleton} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredList}
            >
              {featuredBarbers.map((barber) => (
                <View key={barber.id} style={styles.barberCard}>
                  <Pressable
                    style={styles.favoriteBarberButton}
                    onPress={() => {
                      void toggleFavoriteBarber({
                        id: barber.barberId,
                        name: barber.name,
                        role: barber.role,
                        branch: barber.branch,
                        image: barber.image,
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
                        favoriteBarberIds.includes(barber.barberId)
                          ? "favorite"
                          : "favorite-border"
                      }
                      size={18}
                      color="#f2ca50"
                    />
                  </Pressable>

                  <View
                    style={[
                      styles.barberImageBorder,
                      barber.featured
                        ? styles.barberImageBorderFeatured
                        : styles.barberImageBorderRegular,
                    ]}
                  >
                    <Image
                      source={{ uri: barber.image }}
                      style={styles.barberImage}
                      contentFit="cover"
                    />
                  </View>

                  <Text style={styles.barberName}>{barber.name}</Text>
                  <Text
                    style={[
                      styles.barberRole,
                      barber.featured
                        ? styles.barberRoleFeatured
                        : styles.barberRoleRegular,
                    ]}
                  >
                    {barber.role}
                  </Text>
                  <Text style={styles.barberBranch}>{barber.branch}</Text>

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
          )}
        </View>
      </ScrollView>

      <Modal
        visible={notificationsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.notificationsHeaderRow}>
              <Text style={styles.modalTitle}>Notificaciones</Text>
              <Pressable onPress={() => setNotificationsModalVisible(false)}>
                <MaterialIcons name="close" size={20} color="#d0c5af" />
              </Pressable>
            </View>

            {notifications.map((notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <Text style={styles.notificationTitle}>
                  {notification.title}
                </Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            ))}

            {!notifications.length ? (
              <Text style={styles.modalBody}>
                No tienes notificaciones nuevas.
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancelar turno</Text>
            <Text style={styles.modalBody}>
              Estas seguro de que quieres cancelar tu proximo turno?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setCancelModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmButton}
                onPress={() => {
                  setShowNextTurnCard(false);
                  setCancelModalVisible(false);
                }}
              >
                <Text style={styles.modalConfirmText}>Si, cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomNav}>
        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <MaterialIcons name="content-cut" size={22} color="#d4af37" />
          <Text style={styles.navTextActive}>Atelier</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push("/(tabs)/explore")}
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
    height: 88,
    paddingTop: 20,
    paddingHorizontal: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#131313",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandTitle: {
    color: "#d4af37",
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: 3,
    fontWeight: "800",
  },
  greeting: {
    marginTop: 2,
    color: "#d0c5af",
    fontSize: 13,
  },
  greetingSkeleton: {
    marginTop: 4,
    width: 104,
    height: 14,
  },
  notificationButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#d4af37",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 130,
    gap: 22,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "700",
  },
  nextTurnCard: {
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    padding: 18,
    paddingLeft: 20,
    overflow: "hidden",
  },
  nextTurnCardSkeleton: {
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    padding: 18,
    paddingLeft: 20,
    overflow: "hidden",
  },
  nextTurnTextSkeletonWrap: {
    flex: 1,
    gap: 8,
  },
  serviceTitleSkeleton: {
    width: "72%",
    height: 28,
  },
  dateSkeleton: {
    width: "52%",
    height: 14,
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#d4af37",
  },
  nextTurnTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 18,
  },
  serviceTitle: {
    color: "#f2ca50",
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "700",
    marginBottom: 3,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: "#d0c5af",
    fontSize: 13,
  },
  barberBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  badgeAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  badgeName: {
    color: "#e5e2e1",
    fontSize: 13,
    fontWeight: "500",
  },
  barberBadgeSkeleton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  badgeNameSkeleton: {
    width: 54,
    height: 12,
  },
  turnActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  goldActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  goldActionButtonText: {
    color: "#3c2f00",
    fontSize: 16,
    fontWeight: "600",
  },
  darkActionButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  darkActionButtonText: {
    color: "#d0c5af",
    fontSize: 16,
    fontWeight: "600",
  },
  actionButtonSkeleton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
  },
  emptyTurnCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
    backgroundColor: "#1c1b1b",
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 6,
  },
  emptyTurnTitle: {
    color: "#e5e2e1",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyTurnText: {
    color: "#d0c5af",
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "800",
  },
  notificationsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  notificationItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
    backgroundColor: "#131313",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  notificationTitle: {
    color: "#e5e2e1",
    fontSize: 14,
    fontWeight: "700",
  },
  notificationBody: {
    color: "#d0c5af",
    fontSize: 12,
    lineHeight: 18,
  },
  notificationTime: {
    color: "#a99f8c",
    fontSize: 11,
  },
  modalBody: {
    color: "#d0c5af",
    fontSize: 13,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancelButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4d4635",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    color: "#d0c5af",
    fontSize: 13,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: "#241a00",
    fontSize: 13,
    fontWeight: "800",
  },
  reserveButton: {
    borderRadius: 18,
    backgroundColor: "#d4af37",
    minHeight: 110,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reserveTitle: {
    color: "#3c2f00",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: 4,
  },
  reserveSubtitle: {
    color: "rgba(60, 47, 0, 0.75)",
    fontSize: 14,
  },
  reserveIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(60, 47, 0, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  featuredTitle: {
    color: "#e5e2e1",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "800",
  },
  featuredLink: {
    color: "#f2ca50",
    fontSize: 13,
    fontWeight: "500",
  },
  featuredLinkSkeleton: {
    width: 58,
    height: 14,
  },
  featuredList: {
    gap: 12,
    paddingTop: 2,
    paddingBottom: 4,
    paddingRight: 16,
  },
  barberCard: {
    position: "relative",
    width: 280,
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.2)",
    paddingHorizontal: 22,
    paddingVertical: 20,
    alignItems: "center",
  },
  favoriteBarberButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(14,14,14,0.72)",
  },
  favoriteIconSkeleton: {
    width: 18,
    height: 18,
  },
  barberImageBorder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    padding: 3,
    marginBottom: 12,
  },
  barberImageBorderFeatured: {
    borderColor: "rgba(242, 202, 80, 0.4)",
  },
  barberImageBorderRegular: {
    borderColor: "#353535",
  },
  barberImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },
  barberName: {
    color: "#e5e2e1",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "700",
  },
  barberNameSkeleton: {
    width: "45%",
    height: 22,
    marginTop: 2,
  },
  barberRole: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "500",
  },
  barberRoleFeatured: {
    color: "#f2ca50",
  },
  barberRoleRegular: {
    color: "#d0c5af",
  },
  barberRoleSkeleton: {
    width: "52%",
    height: 14,
    marginTop: 4,
  },
  barberBranch: {
    marginTop: 2,
    marginBottom: 12,
    color: "#a99f8c",
    fontSize: 12,
  },
  barberBranchSkeleton: {
    width: "62%",
    height: 12,
    marginTop: 6,
    marginBottom: 12,
  },
  profileButton: {
    width: "100%",
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: "#1c1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  profileButtonText: {
    color: "#e5e2e1",
    fontSize: 13,
    fontWeight: "500",
  },
  profileButtonSkeleton: {
    width: "100%",
    minHeight: 38,
    borderRadius: 10,
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
    color: "#d4af37",
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
