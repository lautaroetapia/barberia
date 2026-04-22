import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { APP_ROLES } from "@/constants/app-config";
import { clearStoredActiveRole, setStoredActiveRole } from "@/lib/active-role";
import { getRoleVisibilityForUser } from "@/lib/role-visibility";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { getUserAvatarUri } from "@/lib/user-avatar";

const getInitials = (name: string) => {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??"
  );
};

export default function ProfileScreen() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [displayName, setDisplayName] = useState("Usuario");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [hasBarberRole, setHasBarberRole] = useState(false);
  const [hasOwnerRole, setHasOwnerRole] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "info" | "error",
  });

  useEffect(() => {
    let isMounted = true;

    const applyUserState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        setIsAuthenticated(false);
        setDisplayName("Usuario");
        setEmail("");
        setPhone("");
        setAvatarUri(null);
        setHasOwnerRole(false);
        setHasBarberRole(false);
        setIsLoadingUser(false);
        return;
      }

      setIsAuthenticated(true);

      setDisplayName(
        user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuario",
      );
      setEmail(user.email || "");
      setPhone(user.user_metadata?.phone || "Sin teléfono");

      const uri = getUserAvatarUri(user, "");
      setAvatarUri(uri);

      const visibility = await getRoleVisibilityForUser(user);
      setHasOwnerRole(visibility.hasOwnerRole);
      setHasBarberRole(visibility.hasBarberRole);
      setIsLoadingUser(false);
    };

    void applyUserState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        setIsAuthenticated(false);
        setDisplayName("Usuario");
        setEmail("");
        setPhone("");
        setAvatarUri(null);
        setHasOwnerRole(false);
        setHasBarberRole(false);
        setIsLoadingUser(false);
        return;
      }

      setIsAuthenticated(true);
      setDisplayName(
        session.user.user_metadata?.full_name ||
          session.user.email?.split("@")[0] ||
          "Usuario",
      );
      setEmail(session.user.email || "");
      setPhone(session.user.user_metadata?.phone || "Sin teléfono");
      setAvatarUri(getUserAvatarUri(session.user, ""));
      setIsLoadingUser(false);

      void getRoleVisibilityForUser(session.user).then((visibility) => {
        if (!isMounted) {
          return;
        }
        setHasOwnerRole(visibility.hasOwnerRole);
        setHasBarberRole(visibility.hasBarberRole);
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const performSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      }

      await clearStoredActiveRole();
      router.replace("/auth/login");
    } catch {
      setToast({
        visible: true,
        message: "No se pudo cerrar sesión. Inténtalo de nuevo.",
        type: "error",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Quieres salir de la cuenta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  };

  if (isLoadingUser) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <Text style={styles.brandTitle}>
            NAVAJA <Text style={styles.goldText}>DORADA</Text>
          </Text>
        </View>

        <View style={styles.loggedOutContainer}>
          <Text style={styles.loggedOutTitle}>
            Inicia sesión para ver tu perfil
          </Text>
          <Text style={styles.loggedOutDescription}>
            Accede para gestionar tus turnos, favoritos y datos personales.
          </Text>
          <Pressable
            style={styles.loginButton}
            onPress={() => router.replace("/auth/login")}
          >
            <MaterialIcons name="login" size={18} color="#111" />
            <Text style={styles.loginButtonText}>Iniciar sesión</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.header}>
        <Text style={styles.brandTitle}>
          NAVAJA <Text style={styles.goldText}>DORADA</Text>
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* --- PERFIL / AVATAR --- */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.mainAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {getInitials(displayName)}
                </Text>
              </View>
            )}
            <Pressable
              style={styles.editBadge}
              onPress={() => router.push("/(tabs)/edit-profile")}
            >
              <MaterialIcons name="edit" size={16} color="#000" />
            </Pressable>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        {/* --- ACCIONES DE NEGOCIO (Los botones que faltaban) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Gestión de Barbería</Text>
          <View style={styles.actionRowContainer}>
            <Pressable
              style={styles.mainActionButton}
              onPress={() => router.push("/(tabs)/register-barbershop")}
            >
              <View style={styles.actionIconCircle}>
                <MaterialIcons name="add-business" size={20} color="#D4AF37" />
              </View>
              <Text style={styles.actionButtonText}>Registrar mi Barbería</Text>
            </Pressable>

            <Pressable
              style={styles.secondaryActionButton}
              onPress={() => router.push("/barber/join-barbershop")}
            >
              <MaterialIcons name="link" size={18} color="#D4AF37" />
              <Text style={styles.secondaryActionText}>
                Vincular Invitación
              </Text>
            </Pressable>
          </View>
        </View>

        {/* --- ROLES --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Cambiar Perfil</Text>

          <View style={[styles.roleCard, styles.roleCardActive]}>
            <View style={styles.roleIconActive}>
              <MaterialIcons name="person" size={20} color="#000" />
            </View>
            <Text style={styles.roleTitleActive}>Cliente (Activo)</Text>
            <MaterialIcons name="check-circle" size={20} color="#D4AF37" />
          </View>

          {hasBarberRole && (
            <Pressable
              style={styles.roleCard}
              onPress={async () => {
                await setStoredActiveRole(APP_ROLES.BARBER);
                router.replace("/barber/barber-my-agenda");
              }}
            >
              <View style={styles.roleIcon}>
                <MaterialIcons name="content-cut" size={20} color="#D4AF37" />
              </View>
              <Text style={styles.roleTitle}>Panel de Barbero</Text>
              <MaterialIcons name="chevron-right" size={20} color="#333" />
            </Pressable>
          )}

          {hasOwnerRole && (
            <Pressable
              style={styles.roleCard}
              onPress={async () => {
                await setStoredActiveRole(APP_ROLES.OWNER);
                router.replace("/barber/dashboard-owner");
              }}
            >
              <View style={styles.roleIcon}>
                <MaterialIcons name="storefront" size={20} color="#D4AF37" />
              </View>
              <Text style={styles.roleTitle}>Panel de Dueño</Text>
              <MaterialIcons name="chevron-right" size={20} color="#333" />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[styles.logoutBtn, isSigningOut && styles.logoutBtnDisabled]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color="#FF5252" />
          ) : (
            <MaterialIcons name="logout" size={18} color="#FF5252" />
          )}
          <Text style={styles.logoutBtnText}>
            {isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* --- MENU INFERIOR FIJO --- */}
      <View style={styles.bottomNavContainer}>
        <BlurView intensity={90} tint="dark" style={styles.bottomNav}>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)")}
          >
            <MaterialIcons name="content-cut" size={24} color="#555" />
            <Text style={styles.navText}>Atelier</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)/explore")}
          >
            <MaterialIcons name="grid-view" size={24} color="#555" />
            <Text style={styles.navText}>Servicios</Text>
          </Pressable>
          <Pressable
            style={styles.navItem}
            onPress={() => router.replace("/(tabs)/bookings")}
          >
            <MaterialIcons name="event-available" size={24} color="#555" />
            <Text style={styles.navText}>Turnos</Text>
          </Pressable>
          <View style={styles.navItem}>
            <View style={styles.activeIndicator}>
              <MaterialIcons name="person" size={22} color="#000" />
            </View>
            <Text style={styles.navTextActive}>Perfil</Text>
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    justifyContent: "center",
    alignItems: "center",
  },
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  goldText: { color: "#D4AF37", fontWeight: "800" },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 10,
    alignItems: "center",
  },
  brandTitle: {
    color: "#FFF",
    fontSize: 14,
    letterSpacing: 3,
    fontWeight: "300",
  },

  scrollContent: { paddingHorizontal: 24, paddingBottom: 150 },

  profileHeader: { alignItems: "center", marginTop: 20, marginBottom: 30 },
  avatarContainer: { width: 100, height: 100, marginBottom: 15 },
  mainAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#161616",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  avatarInitials: { color: "#D4AF37", fontSize: 30, fontWeight: "800" },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#D4AF37",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0A0A0A",
  },
  userName: { color: "#FFF", fontSize: 22, fontWeight: "800" },
  userEmail: { color: "#666", fontSize: 13, marginTop: 4 },

  loggedOutContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: "center",
  },
  loggedOutTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  loggedOutDescription: {
    color: "#777",
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 24,
    textAlign: "center",
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#D4AF37",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  loginButtonText: {
    color: "#111",
    fontSize: 15,
    fontWeight: "800",
  },

  section: { marginBottom: 25 },
  sectionLabel: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 15,
    textTransform: "uppercase",
  },

  // Estilos de los botones nuevos
  actionRowContainer: { gap: 12 },
  mainActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#D4AF3744",
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#221C0E",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  actionButtonText: { color: "#FFF", fontSize: 15, fontWeight: "700" },

  secondaryActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#222",
    borderRadius: 15,
  },
  secondaryActionText: { color: "#D4AF37", fontSize: 14, fontWeight: "600" },

  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  roleCardActive: { borderColor: "#D4AF37", backgroundColor: "#161410" },
  roleIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  roleIconActive: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#D4AF37",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  roleTitle: { color: "#777", fontSize: 15, fontWeight: "700", flex: 1 },
  roleTitleActive: { color: "#FFF", fontSize: 15, fontWeight: "700", flex: 1 },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 20,
  },
  logoutBtnDisabled: { opacity: 0.7 },
  logoutBtnText: { color: "#FF5252", fontSize: 15, fontWeight: "700" },

  bottomNavContainer: { position: "absolute", bottom: 35, left: 20, right: 20 },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "rgba(20, 20, 20, 0.75)",
    borderRadius: 35,
    paddingVertical: 12,
    justifyContent: "space-around",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  navText: { color: "#555", fontSize: 10, fontWeight: "600", marginTop: 2 },
  navTextActive: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 2,
  },
});
