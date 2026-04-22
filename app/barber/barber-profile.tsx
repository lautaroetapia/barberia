import { Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Calendar from "expo-calendar";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Notifications from "expo-notifications";
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

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { clearStoredActiveRole, setStoredActiveRole } from "@/lib/active-role";
import {
  getBarberPreferences,
  saveBarberPreferences,
  saveNotificationPushToken,
} from "@/lib/barber-preferences";
import { getRoleVisibilityForCurrentUser } from "@/lib/role-visibility";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { uploadUserAvatar } from "@/lib/user-avatar";

const LOCAL_BARBER_PROFILE_KEY = "barber_profile_local";

type LocalBarberProfile = {
  fullName: string;
  email: string;
  phone: string;
  avatarUri: string;
};

export default function BarberProfileScreen() {
  const [fullName, setFullName] = useState("Juan Gomez");
  const [email, setEmail] = useState("-");
  const [phone, setPhone] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [hasOwnerRole, setHasOwnerRole] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data } = await supabase.auth.getUser();
          const user = data.user;
          if (user && isMounted) {
            const metadata = user.user_metadata as Record<string, unknown>;
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, avatar_url, notifications_enabled")
              .eq("id", user.id)
              .maybeSingle<{
                full_name: string | null;
                avatar_url: string | null;
                notifications_enabled: boolean | null;
              }>();

            // 🔁 Corrección: lógica separada para evitar error de sintaxis
            const fallbackFromEmail = user.email?.split("@")[0] ?? "Barbero";
            const nameFromMetadata = typeof metadata?.display_name === "string"
              ? metadata.display_name
              : fallbackFromEmail;

            const finalFullName = profile?.full_name?.trim() || nameFromMetadata;
            setFullName(finalFullName);
            // Fin de la corrección

            setEmail(user.email ?? "-");
            setPhone(typeof metadata?.phone === "string" ? metadata.phone : "");
            setAvatarUri(
              profile?.avatar_url ??
              (typeof metadata?.avatar_url === "string"
                ? metadata.avatar_url
                : "")
            );

            if (typeof profile?.notifications_enabled === "boolean") {
              setNotificationsEnabled(profile.notifications_enabled);
            }
          }
        }
        const preferences = await getBarberPreferences();
        setNotificationsEnabled(preferences.notificationsEnabled);
        setCalendarSyncEnabled(preferences.calendarSyncEnabled);
        const visibility = await getRoleVisibilityForCurrentUser();
        setHasOwnerRole(visibility.hasOwnerRole);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const initials = useMemo(() => {
    const pieces = fullName
      .trim()
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "");
    return pieces.join("") || "BR";
  }, [fullName]);

  const handlePickAvatar = async () => {
    if (isPickingImage || isSaving) return;

    setIsPickingImage(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setToast({ visible: true, message: "Permiso de galería denegado", type: "error" });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setAvatarUri(result.assets[0].uri);
      }
    } finally {
      setIsPickingImage(false);
    }
  };

  const saveLocalProfile = async () => {
    const payload: LocalBarberProfile = {
      fullName: fullName.trim(),
      email,
      phone: phone.trim(),
      avatarUri,
    };
    await AsyncStorage.setItem(LOCAL_BARBER_PROFILE_KEY, JSON.stringify(payload));
  };

  const handleSaveProfile = async () => {
    if (isSaving) return;

    if (fullName.trim().length < 2) {
      setToast({ visible: true, message: "El nombre debe tener al menos 2 caracteres", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      let persistedAvatarUri = avatarUri;

      if (isSupabaseConfigured) {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;

        if (user && avatarUri && !avatarUri.startsWith("http")) {
          persistedAvatarUri = await uploadUserAvatar(user, avatarUri);
          setAvatarUri(persistedAvatarUri);
        }

        const { error } = await supabase.auth.updateUser({
          data: {
            display_name: fullName.trim(),
            phone: phone.trim(),
            avatar_url: persistedAvatarUri,
          },
        });

        if (error) {
          setToast({ visible: true, message: error.message, type: "error" });
          return;
        }

        if (user) {
          await supabase
            .from("profiles")
            .update({
              full_name: fullName.trim(),
              avatar_url: persistedAvatarUri || null,
            })
            .eq("id", user.id);
        }
      }

      await saveLocalProfile();
      setToast({ visible: true, message: "Perfil actualizado", type: "success" });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotifications = async () => {
    const next = !notificationsEnabled;

    if (next) {
      const currentPermission = await Notifications.getPermissionsAsync();
      let granted =
        currentPermission.granted ||
        currentPermission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

      if (!granted) {
        const asked = await Notifications.requestPermissionsAsync();
        granted =
          asked.granted ||
          asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
      }

      if (!granted) {
        setToast({ visible: true, message: "Debes habilitar permisos para activar la campana.", type: "error" });
        return;
      }

      try {
        const expoToken = (await Notifications.getExpoPushTokenAsync()).data;
        await saveNotificationPushToken(expoToken);
      } catch {
        await saveNotificationPushToken(null);
      }
    } else {
      await saveNotificationPushToken(null);
    }

    setNotificationsEnabled(next);
    await saveBarberPreferences({
      notificationsEnabled: next,
      calendarSyncEnabled,
    });
    setToast({
      visible: true,
      message: next ? "Notificaciones activadas" : "Notificaciones desactivadas",
      type: "info",
    });
  };

  const toggleCalendarSync = async () => {
    const next = !calendarSyncEnabled;

    if (next) {
      const permission = await Calendar.getCalendarPermissionsAsync();
      let granted = permission.granted;
      if (!granted) {
        const requested = await Calendar.requestCalendarPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        setToast({ visible: true, message: "Permiso de calendario denegado", type: "error" });
        return;
      }
    }

    setCalendarSyncEnabled(next);
    await saveBarberPreferences({
      notificationsEnabled,
      calendarSyncEnabled: next,
    });
    setToast({
      visible: true,
      message: next ? "Calendario vinculado" : "Calendario desvinculado",
      type: "info",
    });
  };

  const performSignOut = async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      await clearStoredActiveRole();
      router.replace("/auth/login");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert("Cerrar sesión", "¿Quieres cerrar sesión ahora?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: () => void performSignOut() },
    ]);
  };

  const performLeaveBarbershop = async () => {
    if (isSaving) return;

    if (!isSupabaseConfigured) {
      setToast({ visible: true, message: "Esta acción requiere conexión con Supabase.", type: "error" });
      return;
    }

    setIsSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user?.id) {
        setToast({ visible: true, message: "Sesión inválida. Inicia sesión nuevamente.", type: "error" });
        return;
      }

      const { error } = await supabase
        .from("barbers")
        .update({ status: "inactive" })
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) {
        setToast({ visible: true, message: error.message, type: "error" });
        return;
      }

      await setStoredActiveRole("cliente");
      setToast({ visible: true, message: "Te desvinculaste de la barbería.", type: "success" });
      router.replace("/(tabs)/profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLeaveBarbershop = () => {
    Alert.alert(
      "Abandonar barbería",
      "Vas a salir de tu barbería actual y volverás al perfil de cliente. ¿Deseas continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abandonar", style: "destructive", onPress: () => void performLeaveBarbershop() },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/barber/barber-my-agenda")}>
          <Feather name="chevron-left" size={24} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>MI CUENTA</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* HEADER: AVATAR & IDENTITY */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {isLoading ? (
                <Skeleton style={styles.avatarSkeleton} borderRadius={60} />
              ) : avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <Pressable
              style={styles.editBadge}
              disabled={isSaving || isPickingImage}
              onPress={() => void handlePickAvatar()}
            >
              <MaterialIcons name="camera-alt" size={16} color="#000" />
            </Pressable>
          </View>
          <Text style={styles.userName}>{fullName || "Barbero"}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>PRO BARBER</Text>
          </View>
        </View>

        {/* FORM SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Información Personal</Text>
          <View style={styles.inputGroup}>
            <View style={styles.inputWrapper}>
              <Feather name="user" size={18} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nombre completo"
                placeholderTextColor="#444"
              />
            </View>
            <View style={[styles.inputWrapper, styles.inputDisabled]}>
              <Feather name="mail" size={18} color="#333" style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: "#555" }]} value={email} editable={false} />
            </View>
            <View style={styles.inputWrapper}>
              <Feather name="phone" size={18} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Teléfono"
                placeholderTextColor="#444"
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* BARBERSHOP CARD */}
        <View style={styles.workCard}>
          <View style={styles.workInfo}>
            <View style={styles.workIcon}>
              <MaterialIcons name="content-cut" size={20} color="#d4af37" />
            </View>
            <View>
              <Text style={styles.workTitle}>Navaja Centro</Text>
              <Text style={styles.workSubtitle}>Palermo, Buenos Aires</Text>
            </View>
          </View>
          <Pressable style={styles.leaveLink} onPress={handleLeaveBarbershop}>
            <Text style={styles.leaveLinkText}>Abandonar barbería</Text>
          </Pressable>
        </View>

        {/* OPTIONS SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Preferencias y Roles</Text>
          <View style={styles.optionsList}>
            <OptionItem
              icon="bell"
              label="Notificaciones"
              value={notificationsEnabled ? "Activadas" : "Desactivadas"}
              onPress={() => void toggleNotifications()}
            />
            <OptionItem
              icon="calendar"
              label="Sincronizar calendario"
              value={calendarSyncEnabled ? "Conectado" : "Vincular"}
              onPress={() => void toggleCalendarSync()}
            />
            <OptionItem
              icon="users"
              label="Vista Cliente"
              onPress={() => {
                void setStoredActiveRole("cliente");
                router.replace("/(tabs)");
              }}
            />
            {hasOwnerRole && (
              <OptionItem
                icon="shield"
                label="Panel de Dueño"
                onPress={() => {
                  void setStoredActiveRole("dueno");
                  router.replace("/barber/dashboard-owner");
                }}
                color="#d4af37"
              />
            )}
            <OptionItem
              icon="log-out"
              label="Cerrar sesión"
              onPress={handleSignOut}
              isLast
              color="#ff4466"
            />
          </View>
        </View>

        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={() => void handleSaveProfile()}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
          </Text>
        </Pressable>
      </ScrollView>

      <BarberRoleNav mode="barber" current="perfil" />
    </View>
  );
}

function OptionItem({ icon, label, value, onPress, isLast, color = "#eee" }: any) {
  return (
    <Pressable onPress={onPress} style={[styles.optionItem, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.optionRow}>
        <Feather name={icon} size={18} color={color} style={{ marginRight: 12 }} />
        <Text style={[styles.optionLabel, { color }]}>{label}</Text>
      </View>
      <View style={styles.optionRow}>
        {value && <Text style={styles.optionValue}>{value}</Text>}
        <Feather name="chevron-right" size={16} color="#333" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080808" },
  topBar: {
    height: 100,
    paddingTop: 45,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#d4af37", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 140 },
  headerSection: { alignItems: "center", marginVertical: 20 },
  avatarContainer: { position: "relative", marginBottom: 15 },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#111",
    borderWidth: 2,
    borderColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitials: { color: "#d4af37", fontSize: 40, fontWeight: "800" },
  avatarSkeleton: { width: "100%", height: "100%" },
  editBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#080808",
  },
  userName: { color: "#fff", fontSize: 24, fontWeight: "800" },
  statusBadge: {
    backgroundColor: "#1a1a1a",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  statusBadgeText: { color: "#d4af37", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  section: { marginBottom: 25 },
  sectionLabel: {
    color: "#555",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 1,
  },
  inputGroup: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 55,
    paddingHorizontal: 15,
  },
  inputDisabled: { opacity: 0.5 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "600" },
  workCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  workInfo: { flexDirection: "row", alignItems: "center" },
  workIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1a1608",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  workTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  workSubtitle: { color: "#555", fontSize: 12 },
  leaveLink: { paddingVertical: 6, paddingHorizontal: 2 },
  leaveLinkText: { color: "#ff4466", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  optionsList: {
    backgroundColor: "#111",
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  optionItem: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  optionRow: { flexDirection: "row", alignItems: "center" },
  optionLabel: { fontSize: 14, fontWeight: "600" },
  optionValue: { color: "#555", fontSize: 12, marginRight: 8 },
  saveButton: {
    backgroundColor: "#d4af37",
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: "#000", fontSize: 14, fontWeight: "900" },
});