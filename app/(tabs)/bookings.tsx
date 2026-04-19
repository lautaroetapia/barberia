import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { supabase } from "@/lib/supabase";
import {
    getGoogleAvatarFromProviderToken,
    getUserAvatarUri,
    isGoogleUser,
} from "@/lib/user-avatar";

const AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1YhrTCrd0bBDg8Qq3RhGAcsd1ccZG6siygWSpzrk-jtGA9zBkmRrDn_nilt0AU5hIou1Adz_XxhHAfmPNDyfN-YUUHEaIxlWNAnMKoM8BO1K-KGxaAOk7jVcmuTGxJdAWyULThRYJKp1qJORnAWSXJXaT3m7SKfyREiaQfNfTtKcMH6HsUCu_hpB0sIYJmbVYfkLcmpJzFhYF35GzlwzpozF25BljKWOKI-GPXLSfsD1pvsVJPd4pP9KCHYd8OElFCTkeEJ5IZ_zr";

const initialActiveAppointments = [
  {
    id: "1",
    icon: "content-cut",
    service: "Corte de Autor",
    date: "15 de Octubre",
    time: "10:30 AM",
    branch: "Atelier Palermo",
    barber: "Mateo",
  },
  {
    id: "2",
    icon: "face-retouching-natural",
    service: "Ritual de Barba",
    date: "28 de Octubre",
    time: "18:00 PM",
    branch: "Atelier Recoleta",
    barber: "Julian",
  },
];

export default function BookingsScreen() {
  const params = useLocalSearchParams<{
    updatedAppointmentId?: string;
    updatedDate?: string;
    updatedTime?: string;
  }>();

  const [appointments, setAppointments] = useState(initialActiveAppointments);
  const [avatarUri, setAvatarUri] = useState(AVATAR_URI);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const updatedAppointmentId =
      typeof params.updatedAppointmentId === "string"
        ? params.updatedAppointmentId
        : undefined;
    const updatedDate =
      typeof params.updatedDate === "string" ? params.updatedDate : undefined;
    const updatedTime =
      typeof params.updatedTime === "string" ? params.updatedTime : undefined;

    if (!updatedAppointmentId || !updatedDate || !updatedTime) {
      return;
    }

    setAppointments((prev) =>
      prev.map((item) =>
        item.id === updatedAppointmentId
          ? {
              ...item,
              date: updatedDate,
              time: updatedTime,
            }
          : item,
      ),
    );
  }, [params.updatedAppointmentId, params.updatedDate, params.updatedTime]);

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

  const openCancelModal = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setCancelModalVisible(true);
  };

  const closeCancelModal = () => {
    setCancelModalVisible(false);
    setSelectedAppointmentId(null);
  };

  const confirmCancelAppointment = () => {
    if (!selectedAppointmentId) {
      closeCancelModal();
      return;
    }

    setAppointments((prev) =>
      prev.filter((item) => item.id !== selectedAppointmentId),
    );
    closeCancelModal();
  };

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
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Mis Turnos</Text>
        </View>

        <View style={styles.tabsNav}>
          <Pressable style={styles.tabActive}>
            <Text style={styles.tabActiveText}>Activos</Text>
            <View style={styles.tabUnderline} />
          </Pressable>
          <Pressable
            style={styles.tabInactive}
            onPress={() => router.replace("/(tabs)/bookings-history")}
          >
            <Text style={styles.tabInactiveText}>Historial</Text>
          </Pressable>
        </View>

        <View style={styles.listWrap}>
          {appointments.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardAccent} />

              <View style={styles.cardRow}>
                <View style={styles.leftColumn}>
                  <View style={styles.titleRow}>
                    <MaterialIcons
                      name={item.icon as any}
                      size={20}
                      color="#f2ca50"
                    />
                    <Text style={styles.serviceTitle}>{item.service}</Text>
                  </View>

                  <View style={styles.detailsWrap}>
                    <View style={styles.detailRow}>
                      <MaterialIcons
                        name="calendar-today"
                        size={18}
                        color="#d0c5af"
                      />
                      <Text style={styles.detailText}>{item.date}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons
                        name="schedule"
                        size={18}
                        color="#d0c5af"
                      />
                      <Text style={styles.detailText}>{item.time}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons
                        name="storefront"
                        size={18}
                        color="#d0c5af"
                      />
                      <Text style={styles.detailText}>{item.branch}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="person" size={18} color="#d0c5af" />
                      <Text style={styles.detailText}>{item.barber}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.rightColumn}>
                  <View style={styles.qrBox}>
                    <MaterialIcons
                      name="qr-code-2"
                      size={42}
                      color="rgba(208, 197, 175, 0.48)"
                    />
                    <Text style={styles.qrText}>CHECK-IN</Text>
                  </View>

                  <View style={styles.actionsWrap}>
                    <Pressable
                      style={styles.outlineButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/booking-time",
                          params: {
                            appointmentId: item.id,
                            isReschedule: "1",
                            shopId: item.id,
                            shopName: item.branch,
                            serviceId: "service-haircut",
                            barberId: "barber-any",
                          },
                        })
                      }
                    >
                      <Text style={styles.outlineButtonText}>Reprogramar</Text>
                    </Pressable>
                    <Pressable
                      style={styles.ghostButton}
                      onPress={() => openCancelModal(item.id)}
                    >
                      <Text style={styles.ghostButtonText}>Cancelar</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {!appointments.length ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>
                No tienes turnos activos
              </Text>
              <Text style={styles.emptyStateText}>
                Puedes reservar uno nuevo cuando quieras.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancelar turno</Text>
            <Text style={styles.modalBody}>
              Estas seguro de que quieres cancelar este turno?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={closeCancelModal}
              >
                <Text style={styles.modalCancelText}>No</Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmButton}
                onPress={confirmCancelAppointment}
              >
                <Text style={styles.modalConfirmText}>Si, cancelar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  pageHeader: {
    marginTop: 12,
    marginBottom: 18,
  },
  pageTitle: {
    color: "#e5e2e1",
    fontSize: 39,
    lineHeight: 43,
    fontWeight: "800",
  },
  tabsNav: {
    flexDirection: "row",
    gap: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#20201f",
    marginBottom: 18,
  },
  tabActive: {
    paddingBottom: 12,
  },
  tabActiveText: {
    color: "#f2ca50",
    fontSize: 15,
    fontWeight: "600",
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
    paddingBottom: 12,
  },
  tabInactiveText: {
    color: "#d0c5af",
    fontSize: 15,
    fontWeight: "500",
  },
  listWrap: {
    gap: 14,
  },
  card: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    overflow: "hidden",
  },
  cardAccent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
    backgroundColor: "#d4af37",
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  leftColumn: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  serviceTitle: {
    color: "#e5e2e1",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "700",
  },
  detailsWrap: {
    gap: 10,
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  detailText: {
    color: "#d0c5af",
    fontSize: 15,
  },
  rightColumn: {
    width: 124,
    borderLeftWidth: 1,
    borderLeftColor: "#1c1b1b",
    paddingLeft: 12,
    alignItems: "stretch",
  },
  qrBox: {
    width: "100%",
    height: 122,
    borderRadius: 10,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  qrText: {
    color: "#d0c5af",
    fontSize: 10,
    letterSpacing: 1.4,
  },
  actionsWrap: {
    marginTop: 12,
    gap: 8,
  },
  outlineButton: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4d4635",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButtonText: {
    color: "#f2ca50",
    fontSize: 13,
    fontWeight: "500",
  },
  ghostButton: {
    minHeight: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonText: {
    color: "#d0c5af",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyStateCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
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
