import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { supabase } from "@/lib/supabase";
import {
    getGoogleAvatarFromProviderToken,
    getUserAvatarUri,
    isGoogleUser,
    uploadUserAvatar,
} from "@/lib/user-avatar";

const HEADER_AVATAR_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCphtdoqwaFQVM7H747ghqdhr3GH0BfL3_X_DiIJ2xcQalZwkGKOpKbPmd8D1ApBvgdzdUF5YDjHkAHP6LUYXseFBULK4fw-mQIe5m6QQGOSlZK5AyRtnbDn0DhENAQDJ-_L-baCwgRBHMwK4JPgL_XzA-Ig66cvruwjC_KVXvp1yUb9-mQUDnM8BTyavUXnjIXDmOC2Cq8-wYyBh7p_nkRoQvNwHhf97y-NYF9eOv4EB_4_xdnN7QYJ0kPG_4UJuzR5YQU1r0_jiqX";

// --- FUNCIONES AUXILIARES (RESTAURADAS) ---
const getDisplayName = (user: User | null) => {
  if (!user) return "";
  const displayNameFromMeta =
    user.user_metadata?.display_name ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.user_metadata?.given_name;

  if (typeof displayNameFromMeta === "string" && displayNameFromMeta.trim()) {
    return displayNameFromMeta.trim();
  }
  return user.email ? user.email.split("@")[0] : "";
};

const getPhone = (user: User | null) => {
  if (!user) return "";
  const phoneFromMeta = user.user_metadata?.phone;
  if (typeof phoneFromMeta === "string" && phoneFromMeta.trim()) {
    return phoneFromMeta.trim();
  }
  return typeof user.phone === "string" ? user.phone : "";
};

export default function EditProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(HEADER_AVATAR_URI);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isEmailEditable, setIsEmailEditable] = useState(false);
  const [userRef, setUserRef] = useState<User | null>(null);
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
      const userForData = sessionUser ?? user;

      if (!isMounted || !userForData) return;

      setDisplayName(getDisplayName(userForData));
      setPhone(getPhone(userForData));
      setEmail(userForData.email ?? "");
      setUserRef(userForData);
      setAvatarUri(getUserAvatarUri(userForData, HEADER_AVATAR_URI));

      if (isGoogleUser(userForData)) {
        const googleAvatar = await getGoogleAvatarFromProviderToken(
          sessionData.session?.provider_token,
        );
        if (isMounted && googleAvatar) setAvatarUri(googleAvatar);
      }
    };

    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (isMounted) applyUserData(data.user ?? null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    const nextName = displayName.trim();
    if (!nextName) {
      setToast({
        visible: true,
        type: "error",
        message: "Ingresa un nombre válido.",
      });
      return;
    }

    setIsSaving(true);
    let publicAvatarUrl = avatarUri;

    try {
      if (userRef && avatarUri !== HEADER_AVATAR_URI) {
        publicAvatarUrl = await uploadUserAvatar(userRef, avatarUri);
      }
    } catch (err: unknown) {
      setToast({
        visible: true,
        type: "error",
        message: (err as Error).message,
      });
      setIsSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      ...(isEmailEditable && email.trim() ? { email: email.trim() } : {}),
      data: {
        display_name: nextName,
        full_name: nextName,
        phone: phone.trim(),
        avatar_url: publicAvatarUrl,
      },
    });

    setIsSaving(false);

    if (error) {
      setToast({ visible: true, type: "error", message: error.message });
      return;
    }

    setToast({
      visible: true,
      type: "success",
      message: isEmailEditable
        ? "Perfil actualizado. Revisa tu nuevo correo para confirmar."
        : "Perfil actualizado.",
    });
    setTimeout(() => router.back(), 2000);
  };

  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch {
      setToast({
        visible: true,
        type: "error",
        message: "Ocurrió un error al seleccionar la imagen.",
      });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back-ios" size={18} color="#d4af37" />
        </Pressable>
        <Text style={styles.headerTitle}>Perfil</Text>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* AVATAR */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatarBorder}>
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              contentFit="cover"
            />
            <Pressable
              style={styles.cameraIconContainer}
              onPress={() => void handlePickAvatar()}
            >
              <MaterialIcons name="camera-alt" size={16} color="#000" />
            </Pressable>
          </View>
          <Text style={styles.avatarSubtext}>Cambiar foto de perfil</Text>
        </View>

        {/* FORMULARIO */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre de Caballero</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="person-outline"
                size={18}
                color="#d4af37"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Tu nombre"
                placeholderTextColor="#444"
                editable={!isSaving && !isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono de Contacto</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="phone-iphone"
                size={18}
                color="#d4af37"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Tu teléfono"
                placeholderTextColor="#444"
                keyboardType="phone-pad"
                editable={!isSaving && !isLoading}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View
              style={[
                styles.inputWrapper,
                !isEmailEditable && styles.inputDisabled,
              ]}
            >
              <MaterialIcons
                name="mail-outline"
                size={18}
                color={isEmailEditable ? "#d4af37" : "#555"}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.textInput,
                  !isEmailEditable && { color: "#555" },
                ]}
                value={email}
                onChangeText={setEmail}
                editable={isEmailEditable && !isSaving && !isLoading}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!isEmailEditable && (
                <MaterialIcons name="lock-outline" size={14} color="#333" />
              )}
            </View>
          </View>

          {!isEmailEditable && (
            <Pressable
              style={styles.secondaryAction}
              onPress={() => {
                setIsEmailEditable(true);
                setToast({
                  visible: true,
                  type: "info",
                  message: "Ahora puedes editar tu correo.",
                });
              }}
            >
              <Text style={styles.secondaryActionText}>
                ¿Necesitas cambiar tu correo?
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            "Un caballero es alguien que nunca hiere los sentimientos de nadie
            sin querer."
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <LinearGradient
          colors={["#d4af37", "#b8962e"]}
          style={[
            styles.saveButton,
            (isSaving || isLoading) && styles.saveButtonDisabled,
          ]}
        >
          <Pressable
            onPress={() => void handleSave()}
            disabled={isSaving || isLoading}
            style={styles.saveButtonPressable}
          >
            <Text style={styles.saveButtonText}>
              {isSaving ? "PROCESANDO..." : "GUARDAR CAMBIOS"}
            </Text>
          </Pressable>
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#0F0F0F",
  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 6,
  },
  headerTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 15,
  },
  brand: {
    color: "#d4af37",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 120, paddingTop: 20 },
  avatarContainer: { alignItems: "center", marginBottom: 40 },
  avatarBorder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#d4af37",
    padding: 6,
    position: "relative",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 55 },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#d4af37",
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#0A0A0A",
  },
  avatarSubtext: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 12,
    opacity: 0.8,
    textTransform: "uppercase",
  },
  formContainer: { paddingHorizontal: 25, gap: 20 },
  inputGroup: { gap: 8 },
  inputLabel: {
    color: "#777",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, color: "#FFF", fontSize: 16, fontWeight: "600" },
  inputDisabled: { backgroundColor: "#0F0F0F", borderColor: "#1A1A1A" },
  secondaryAction: { alignSelf: "center", marginTop: 5 },
  secondaryActionText: {
    color: "#777",
    fontSize: 13,
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  quoteBox: { marginTop: 40, paddingHorizontal: 40, alignItems: "center" },
  quoteText: {
    color: "#333",
    fontStyle: "italic",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
    backgroundColor: "rgba(10, 10, 10, 0.9)",
  },
  saveButton: { height: 55, borderRadius: 18, overflow: "hidden" },
  saveButtonPressable: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 2,
  },
});
