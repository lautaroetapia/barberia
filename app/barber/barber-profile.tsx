import { MaterialIcons } from "@expo/vector-icons";
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
} from "@/lib/barber-preferences";
import { getRoleVisibilityForCurrentUser } from "@/lib/role-visibility";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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
            const nextName =
              typeof metadata?.display_name === "string" &&
              metadata.display_name.trim().length > 0
                ? metadata.display_name
                : (user.email?.split("@")[0] ?? "Barbero");

            const nextPhone =
              typeof metadata?.phone === "string" ? metadata.phone : "";
            const nextAvatar =
              typeof metadata?.avatar_url === "string"
                ? metadata.avatar_url
                : "";

            setFullName(nextName);
            setEmail(user.email ?? "-");
            setPhone(nextPhone);
            setAvatarUri(nextAvatar);
          }
        }

        const localRaw = await AsyncStorage.getItem(LOCAL_BARBER_PROFILE_KEY);
        if (!localRaw || !isMounted) {
          return;
        }

        const localProfile = JSON.parse(
          localRaw,
        ) as Partial<LocalBarberProfile>;
        if (
          typeof localProfile.fullName === "string" &&
          localProfile.fullName
        ) {
          setFullName(localProfile.fullName);
        }
        if (typeof localProfile.email === "string" && localProfile.email) {
          setEmail(localProfile.email);
        }
        if (typeof localProfile.phone === "string") {
          setPhone(localProfile.phone);
        }
        if (typeof localProfile.avatarUri === "string") {
          setAvatarUri(localProfile.avatarUri);
        }

        const preferences = await getBarberPreferences();
        setNotificationsEnabled(preferences.notificationsEnabled);
        setCalendarSyncEnabled(preferences.calendarSyncEnabled);

        const visibility = await getRoleVisibilityForCurrentUser();
        setHasOwnerRole(visibility.hasOwnerRole);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
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
    if (isPickingImage || isSaving) {
      return;
    }

    setIsPickingImage(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setToast({
          visible: true,
          message: "Permiso de galeria denegado",
          type: "error",
        });
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
    await AsyncStorage.setItem(
      LOCAL_BARBER_PROFILE_KEY,
      JSON.stringify(payload),
    );
  };

  const handleSaveProfile = async () => {
    if (isSaving) {
      return;
    }

    if (fullName.trim().length < 2) {
      setToast({
        visible: true,
        message: "El nombre debe tener al menos 2 caracteres",
        type: "error",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.updateUser({
          data: {
            display_name: fullName.trim(),
            phone: phone.trim(),
            avatar_url: avatarUri,
          },
        });

        if (error) {
          setToast({
            visible: true,
            message: error.message,
            type: "error",
          });
          return;
        }
      }

      await saveLocalProfile();
      setToast({
        visible: true,
        message: "Perfil actualizado",
        type: "success",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const switchToRole = async (role: "cliente" | "dueno") => {
    if (role === "dueno" && !hasOwnerRole) {
      setToast({
        visible: true,
        message: "Tu cuenta no tiene perfil de dueño",
        type: "error",
      });
      return;
    }

    await setStoredActiveRole(role);
    if (role === "cliente") {
      router.replace("/(tabs)");
      return;
    }

    router.replace("/barber/dashboard-owner");
  };

  const options = useMemo(() => {
    const base = [
      "Notificaciones",
      "Sincronizar calendario",
      "Cambiar a vista Cliente",
    ] as const;

    const withOwner = hasOwnerRole
      ? ([...base, "Cambiar a vista Dueno"] as const)
      : base;

    return [...withOwner, "Cerrar sesion"] as const;
  }, [hasOwnerRole]);

  const performSignOut = async () => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        setToast({
          visible: true,
          message: "No se pudo cerrar en servidor. Cerrando localmente...",
          type: "info",
        });
      }
    }

    await clearStoredActiveRole();
    router.replace("/auth/login");
  };

  const handleOptionPress = async (item: (typeof options)[number]) => {
    if (item === "Notificaciones") {
      const current = await Notifications.getPermissionsAsync();
      let granted =
        current.granted ||
        current.ios?.status ===
          Notifications.IosAuthorizationStatus.PROVISIONAL;
      if (!granted) {
        const requested = await Notifications.requestPermissionsAsync();
        granted =
          requested.granted ||
          requested.ios?.status ===
            Notifications.IosAuthorizationStatus.PROVISIONAL;
      }

      if (!granted) {
        setToast({
          visible: true,
          message: "Debes habilitar notificaciones para activarlas",
          type: "error",
        });
        return;
      }

      setNotificationsEnabled(true);
      await saveBarberPreferences({
        notificationsEnabled: true,
        calendarSyncEnabled,
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Notificaciones activadas",
          body: "Recibiras recordatorios de turnos de hoy.",
        },
        trigger: null,
      });

      setToast({
        visible: true,
        message: "Notificaciones activadas",
        type: "success",
      });
      return;
    }

    if (item === "Sincronizar calendario") {
      const current = await Calendar.getCalendarPermissionsAsync();
      let granted = current.granted;
      if (!granted) {
        const requested = await Calendar.requestCalendarPermissionsAsync();
        granted = requested.granted;
      }

      if (!granted) {
        setToast({
          visible: true,
          message: "Debes habilitar permisos de calendario",
          type: "error",
        });
        return;
      }

      setCalendarSyncEnabled(true);
      await saveBarberPreferences({
        notificationsEnabled,
        calendarSyncEnabled: true,
      });

      setToast({
        visible: true,
        message: "Calendario vinculado",
        type: "success",
      });
      return;
    }

    if (item === "Cambiar a vista Cliente") {
      await switchToRole("cliente");
      return;
    }

    if (item === "Cambiar a vista Dueno") {
      await switchToRole("dueno");
      return;
    }

    if (item === "Cerrar sesion") {
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
      return;
    }

    setToast({
      visible: true,
      message: "Esta opcion se activara en una proxima iteracion",
      type: "info",
    });
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
        <Pressable
          style={styles.iconButton}
          onPress={() => router.replace("/barber/barber-my-agenda")}
        >
          <MaterialIcons name="arrow-back" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mi Perfil</Text>

        <View style={styles.avatarBlock}>
          <View style={styles.avatarCircle}>
            {isLoading ? (
              <Skeleton style={styles.avatarSkeleton} borderRadius={55} />
            ) : avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}
          </View>
          <Pressable
            style={styles.editAvatar}
            disabled={isSaving || isPickingImage}
            onPress={() => {
              void handlePickAvatar();
            }}
          >
            <MaterialIcons name="edit" size={16} color="#3c2f00" />
          </Pressable>
          <Text style={styles.name}>{fullName || "Barbero"}</Text>
          <Text style={styles.role}>Master Barber</Text>
        </View>

        {isLoading ? (
          <>
            <Skeleton style={styles.inputSkeleton} />
            <Skeleton style={styles.inputSkeleton} />
            <Skeleton style={styles.inputSkeleton} />
          </>
        ) : (
          <>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              editable={!isLoading && !isSaving}
              placeholder="Nombre"
              placeholderTextColor="#777"
            />
            <TextInput
              style={styles.inputDisabled}
              value={email}
              editable={false}
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              editable={!isLoading && !isSaving}
              placeholder="Telefono"
              placeholderTextColor="#777"
              keyboardType="phone-pad"
            />
          </>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mi Barberia</Text>
          <Text style={styles.cardText}>Navaja Centro · Palermo</Text>
          <Pressable
            style={styles.leaveButton}
            onPress={() => router.push("/barber/join-barbershop")}
          >
            <MaterialIcons name="logout" size={16} color="#ffb4ab" />
            <Text style={styles.leaveText}>Dejar de trabajar aqui</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {options.map((item) => (
            <Pressable
              key={item}
              style={[
                styles.option,
                item === "Cerrar sesion" && styles.optionDanger,
              ]}
              onPress={() => {
                void handleOptionPress(item);
              }}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionText,
                    item === "Cerrar sesion" && styles.optionTextDanger,
                  ]}
                >
                  {item}
                </Text>
                {item === "Notificaciones" ? (
                  <Text style={styles.optionState}>
                    {notificationsEnabled ? "Activadas" : "Desactivadas"}
                  </Text>
                ) : null}
                {item === "Sincronizar calendario" ? (
                  <Text style={styles.optionState}>
                    {calendarSyncEnabled ? "Conectado" : "Desconectado"}
                  </Text>
                ) : null}
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#99907c" />
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          disabled={isSaving || isLoading}
          onPress={() => {
            void handleSaveProfile();
          }}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
      </ScrollView>

      <BarberRoleNav mode="barber" current="perfil" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  topBar: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(19,19,19,0.92)",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "#d4af37",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
    gap: 12,
  },
  title: { color: "#e5e2e1", fontSize: 34, fontWeight: "800" },
  avatarBlock: { alignItems: "center", marginTop: 6, marginBottom: 6 },
  avatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#2a2a2a",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: "#f2ca50", fontSize: 36, fontWeight: "800" },
  avatarImage: { width: "100%", height: "100%" },
  avatarSkeleton: {
    width: "100%",
    height: "100%",
  },
  editAvatar: {
    marginTop: -18,
    marginLeft: 68,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { marginTop: 10, color: "#e5e2e1", fontSize: 22, fontWeight: "800" },
  role: { color: "#d0c5af", fontSize: 13, marginTop: 2 },
  input: {
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#4d4635",
    color: "#e5e2e1",
    fontSize: 16,
    paddingHorizontal: 0,
  },
  inputDisabled: {
    minHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3529",
    color: "#a69d88",
    fontSize: 16,
    paddingHorizontal: 0,
  },
  inputSkeleton: {
    minHeight: 50,
    borderRadius: 8,
  },
  card: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
  },
  cardTitle: { color: "#e5e2e1", fontSize: 17, fontWeight: "700" },
  cardText: { color: "#d0c5af", fontSize: 12, marginTop: 3 },
  leaveButton: {
    marginTop: 12,
    minHeight: 38,
    borderRadius: 9,
    backgroundColor: "rgba(147,0,10,0.25)",
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  leaveText: { color: "#ffb4ab", fontSize: 12, fontWeight: "700" },
  list: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    overflow: "hidden",
  },
  option: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77,70,53,0.2)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionContent: { gap: 2 },
  optionText: { color: "#e5e2e1", fontSize: 14 },
  optionDanger: { borderColor: "rgba(255,180,171,0.25)" },
  optionTextDanger: { color: "#ffb4ab", fontWeight: "700" },
  optionState: { color: "#99907c", fontSize: 11 },
  saveButton: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: "#241a00", fontSize: 14, fontWeight: "800" },
});
