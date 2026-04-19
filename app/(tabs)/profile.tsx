import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { clearStoredActiveRole, setStoredActiveRole } from "@/lib/active-role";
import { getRoleVisibilityForUser } from "@/lib/role-visibility";
import { supabase } from "@/lib/supabase";
import {
    getGoogleAvatarFromProviderToken,
    getUserAvatarUri,
    isGoogleUser,
} from "@/lib/user-avatar";

const HEADER_AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCphtdoqwaFQVM7H747ghqdhr3GH0BfL3_X_DiIJ2xcQalZwkGKOpKbPmd8D1ApBvgdzdUF5YDjHkAHP6LUYXseFBULK4fw-mQIe5m6QQGOSlZK5AyRtnbDn0DhENAQDJ-_L-baCwgRBHMwK4JPgL_XzA-Ig66cvruwjC_KVXvp1yUb9-mQUDnM8BTyavUXnjIXDmOC2Cq8-wYyBh7p_nkRoQvNwHhf97y-NYF9eOv4EB_4_xdnN7QYJ0kPG_4UJuzR5YQU1r0_jiqX";

const getDisplayName = (user: User | null) => {
  if (!user) {
    return "Sin nombre";
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
    return user.email.split("@")[0] ?? "Sin nombre";
  }

  return "Sin nombre";
};

const getPhone = (user: User | null) => {
  if (!user) {
    return "Sin telefono";
  }

  const phoneFromMeta = user.user_metadata?.phone;
  if (typeof phoneFromMeta === "string" && phoneFromMeta.trim()) {
    return phoneFromMeta.trim();
  }

  if (user.phone) {
    return user.phone;
  }

  return "Sin telefono";
};

const getInitials = (name: string) => {
  const words = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  if (!words.length) {
    return "--";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
};

export default function ProfileScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Sin nombre");
  const [email, setEmail] = useState("Sin email");
  const [phone, setPhone] = useState("Sin telefono");
  const [headerAvatarUri, setHeaderAvatarUri] = useState(HEADER_AVATAR_URI);
  const [hasBarberRole, setHasBarberRole] = useState(false);
  const [hasOwnerRole, setHasOwnerRole] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  useEffect(() => {
    let isMounted = true;

    const applyUserData = async (user: User | null) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user ?? null;
      const userForAvatar = sessionUser ?? user;

      setDisplayName(getDisplayName(userForAvatar));
      setEmail(userForAvatar?.email ?? "Sin email");
      setPhone(getPhone(userForAvatar));

      const resolvedAvatar = getUserAvatarUri(userForAvatar, HEADER_AVATAR_URI);
      setHeaderAvatarUri(resolvedAvatar);

      const visibility = await getRoleVisibilityForUser(userForAvatar);
      setHasOwnerRole(visibility.hasOwnerRole);
      setHasBarberRole(visibility.hasBarberRole);

      if (!isGoogleUser(userForAvatar)) {
        return;
      }

      const googleAvatar = await getGoogleAvatarFromProviderToken(
        sessionData.session?.provider_token,
      );

      if (!isMounted || !googleAvatar) {
        return;
      }

      setHeaderAvatarUri(googleAvatar);
    };

    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        if (!isMounted) {
          return;
        }

        await applyUserData(data.user ?? null);

        if (isMounted) {
          setIsProfileLoading(false);
        }
      })
      .catch(async () => {
        if (!isMounted) {
          return;
        }

        await applyUserData(null);

        if (isMounted) {
          setIsProfileLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) {
        return;
      }

      await applyUserData(session?.user ?? null);

      if (isMounted) {
        setIsProfileLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const performSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setIsSigningOut(false);
      setToast({ visible: true, type: "error", message: error.message });
      return;
    }

    await clearStoredActiveRole();

    router.replace("/auth/login");
  };

  const handleSignOut = () => {
    if (isSigningOut) {
      return;
    }

    Alert.alert("Cerrar sesion", "Quieres cerrar sesion ahora?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesion",
        style: "destructive",
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  };

  const switchToRole = async (role: "cliente" | "barbero" | "dueno") => {
    if (role === "barbero" && !hasBarberRole) {
      setToast({
        visible: true,
        type: "info",
        message: "Tu cuenta no tiene perfil de barbero.",
      });
      return;
    }

    if (role === "dueno" && !hasOwnerRole) {
      setToast({
        visible: true,
        type: "info",
        message: "Tu cuenta no tiene perfil de dueño.",
      });
      return;
    }

    await setStoredActiveRole(role);

    if (role === "cliente") {
      router.replace("/(tabs)");
      return;
    }

    if (role === "barbero") {
      router.replace("/barber/barber-my-agenda");
      return;
    }

    router.replace("/barber/dashboard-owner");
  };

  return (
    <View style={styles.screen}>
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.header}>
        <Text style={styles.brandTitle}>NAVAJA DORADA</Text>

        <View style={styles.headerAvatarWrap}>
          <Image
            source={{ uri: headerAvatarUri }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircleOuter}>
            <View style={styles.avatarCircleInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          </View>

          <Pressable
            style={styles.avatarEditButton}
            onPress={() => router.push("/(tabs)/edit-profile")}
          >
            <MaterialIcons name="edit" size={16} color="#d0c5af" />
          </Pressable>
        </View>

        <View style={styles.formSection}>
          {isProfileLoading ? (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <Skeleton style={styles.fieldSkeleton} />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Skeleton style={styles.fieldSkeleton} />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Telefono</Text>
                <Skeleton style={styles.fieldSkeleton} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Nombre</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={displayName}
                  placeholder="Nombre"
                  placeholderTextColor="transparent"
                  editable={false}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={email}
                  placeholder="Email"
                  placeholderTextColor="transparent"
                  editable={false}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Telefono</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  placeholder="Telefono"
                  placeholderTextColor="transparent"
                  editable={false}
                />
              </View>
            </>
          )}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis perfiles</Text>

          <View style={styles.profileCardActive}>
            <View style={styles.activeAccent} />

            <View style={styles.profileCardContent}>
              <View style={styles.profileCardLeft}>
                <View style={styles.profileIconWrapActive}>
                  <MaterialIcons name="person" size={20} color="#f2ca50" />
                </View>

                <View>
                  <Text style={styles.activeProfileTitle}>
                    Cliente <Text style={styles.activeTag}>(activo)</Text>
                  </Text>
                  <Text style={styles.activeProfileSubtitle}>
                    Cuenta principal
                  </Text>
                </View>
              </View>

              <MaterialIcons name="check-circle" size={20} color="#f2ca50" />
            </View>
          </View>

          {hasBarberRole ? (
            <Pressable
              style={styles.profileCardSecondary}
              onPress={() => {
                void switchToRole("barbero");
              }}
            >
              <View style={styles.profileCardLeft}>
                <View style={styles.profileIconWrapSecondary}>
                  <MaterialIcons name="content-cut" size={20} color="#d0c5af" />
                </View>
                <Text style={styles.secondaryProfileText}>
                  Barbero · Navaja Centro
                </Text>
              </View>

              <MaterialIcons name="arrow-forward" size={18} color="#99907c" />
            </Pressable>
          ) : null}

          {hasOwnerRole ? (
            <Pressable
              style={styles.profileCardSecondary}
              onPress={() => {
                void switchToRole("dueno");
              }}
            >
              <View style={styles.profileCardLeft}>
                <View style={styles.profileIconWrapSecondary}>
                  <MaterialIcons name="storefront" size={20} color="#d0c5af" />
                </View>
                <Text style={styles.secondaryProfileText}>
                  Dueño · Navaja Centro
                </Text>
              </View>

              <MaterialIcons name="arrow-forward" size={18} color="#99907c" />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.actionsSection}>
          <Pressable
            style={styles.primaryActionButton}
            onPress={() => router.push("/(tabs)/register-barbershop")}
          >
            <MaterialIcons name="add-business" size={18} color="#f2ca50" />
            <Text style={styles.primaryActionText}>Registrar mi Barberia</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryActionButton}
            onPress={() => router.push("/barber/join-barbershop")}
          >
            <MaterialIcons name="link" size={18} color="#d0c5af" />
            <Text style={styles.secondaryActionText}>Vincular invitacion</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryActionButton}
            onPress={() => router.push("/(tabs)/diagnostics")}
          >
            <MaterialIcons name="bug-report" size={18} color="#d0c5af" />
            <Text style={styles.secondaryActionText}>
              Diagnostico de cuenta
            </Text>
          </Pressable>
        </View>
        <View style={styles.logoutWrap}>
          <Pressable
            style={styles.logoutButton}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            <MaterialIcons name="logout" size={18} color="#ffb4ab" />
            <Text style={styles.logoutText}>
              {isSigningOut ? "Cerrando sesion..." : "Cerrar sesion"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

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

        <Pressable
          style={styles.navItem}
          onPress={() => router.replace("/(tabs)/bookings")}
        >
          <MaterialIcons name="event-available" size={22} color="#7f7766" />
          <Text style={styles.navText}>Bookings</Text>
        </Pressable>

        <Pressable style={[styles.navItem, styles.navItemActive]}>
          <MaterialIcons name="person" size={22} color="#d4af37" />
          <Text style={styles.navTextActive}>Profile</Text>
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
  headerAvatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    backgroundColor: "#2a2a2a",
  },
  headerAvatar: {
    width: "100%",
    height: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 138,
    gap: 28,
  },
  avatarSection: {
    marginTop: 6,
    alignItems: "center",
  },
  avatarCircleOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#d4af37",
    padding: 4,
  },
  avatarCircleInner: {
    flex: 1,
    borderRadius: 52,
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#131313",
  },
  avatarInitials: {
    color: "#f2ca50",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  avatarEditButton: {
    position: "absolute",
    right: "37%",
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    borderWidth: 2,
    borderColor: "#131313",
    alignItems: "center",
    justifyContent: "center",
  },
  formSection: {
    gap: 16,
  },
  fieldWrap: {
    minHeight: 62,
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#99907c",
    paddingBottom: 2,
  },
  fieldLabel: {
    color: "#99907c",
    fontSize: 13,
    marginBottom: -2,
  },
  fieldSkeleton: {
    height: 32,
    marginTop: 7,
    marginBottom: 5,
  },
  fieldInput: {
    color: "#e5e2e1",
    fontSize: 20,
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: "#e5e2e1",
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "700",
  },
  profileCardActive: {
    minHeight: 78,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    overflow: "hidden",
  },
  activeAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#f2ca50",
  },
  profileCardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
    paddingLeft: 16,
  },
  profileCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  profileIconWrapActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#131313",
    alignItems: "center",
    justifyContent: "center",
  },
  activeProfileTitle: {
    color: "#f2ca50",
    fontSize: 17,
    fontWeight: "600",
  },
  activeTag: {
    color: "#d0c5af",
    fontSize: 11,
    fontWeight: "400",
  },
  activeProfileSubtitle: {
    marginTop: 2,
    color: "#d0c5af",
    fontSize: 13,
  },
  profileCardSecondary: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  profileIconWrapSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#20201f",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryProfileText: {
    color: "#e5e2e1",
    fontSize: 16,
    fontWeight: "500",
  },
  favoriteTabsWrap: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: "#1c1b1b",
    borderRadius: 12,
    padding: 4,
  },
  favoriteTabActive: {
    flex: 1,
    minHeight: 38,
    borderRadius: 9,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteTabActiveText: {
    color: "#e5e2e1",
    fontSize: 14,
    fontWeight: "500",
  },
  favoriteTabInactive: {
    flex: 1,
    minHeight: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  favoriteTabInactiveText: {
    color: "#d0c5af",
    fontSize: 14,
    fontWeight: "500",
  },
  emptyFavoriteState: {
    minHeight: 138,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.25)",
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyFavoriteText: {
    color: "#d0c5af",
    fontSize: 14,
  },
  favoriteListWrap: {
    gap: 10,
  },
  favoriteCard: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  favoriteCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  favoriteIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#131313",
  },
  favoriteAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  favoriteTitle: {
    color: "#e5e2e1",
    fontSize: 15,
    fontWeight: "700",
  },
  favoriteSubtitle: {
    marginTop: 1,
    color: "#d0c5af",
    fontSize: 12,
  },
  favoriteAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsSection: {
    gap: 12,
  },
  primaryActionButton: {
    minHeight: 54,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f2ca50",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryActionText: {
    color: "#f2ca50",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryActionButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryActionText: {
    color: "#d0c5af",
    fontSize: 16,
    fontWeight: "500",
  },
  logoutWrap: {
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 70, 53, 0.25)",
    alignItems: "center",
  },
  logoutButton: {
    minHeight: 42,
    borderRadius: 99,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: "#ffb4ab",
    fontSize: 16,
    fontWeight: "500",
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
