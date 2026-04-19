import { MaterialIcons } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { Skeleton } from "@/components/ui/skeleton";
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
    return "";
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
    return user.email.split("@")[0] ?? "";
  }

  return "";
};

const getPhone = (user: User | null) => {
  if (!user) {
    return "";
  }

  const phoneFromMeta = user.user_metadata?.phone;
  if (typeof phoneFromMeta === "string" && phoneFromMeta.trim()) {
    return phoneFromMeta.trim();
  }

  if (typeof user.phone === "string") {
    return user.phone;
  }

  return "";
};

export default function EditProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUri, setAvatarUri] = useState(HEADER_AVATAR_URI);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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

      if (!isMounted) {
        return;
      }

      setDisplayName(getDisplayName(userForData));
      setPhone(getPhone(userForData));
      setEmail(userForData?.email ?? "");
      setAvatarUri(getUserAvatarUri(userForData, HEADER_AVATAR_URI));

      if (!isGoogleUser(userForData)) {
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
      .then(async ({ data }) => {
        if (!isMounted) {
          return;
        }

        await applyUserData(data.user ?? null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    const nextName = displayName.trim();
    const nextPhone = phone.trim();

    if (!nextName) {
      setToast({
        visible: true,
        type: "error",
        message: "Ingresa un nombre valido.",
      });
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: nextName,
        full_name: nextName,
        phone: nextPhone,
      },
    });

    setIsSaving(false);

    if (error) {
      setToast({
        visible: true,
        type: "error",
        message: error.message,
      });
      return;
    }

    router.back();
  };

  return (
    <View style={styles.screen}>
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.backgroundGlowRight} />
      <View style={styles.backgroundGlowLeft} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color="#d4af37" />
          </Pressable>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
        </View>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          {isLoading ? (
            <Skeleton style={styles.avatarSkeleton} borderRadius={64} />
          ) : (
            <View style={styles.avatarOuterGlow}>
              <View style={styles.avatarOuter}>
                <View style={styles.avatarInner}>
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                </View>
              </View>
            </View>
          )}

          <Pressable
            style={styles.avatarActionButton}
            onPress={() =>
              setToast({
                visible: true,
                type: "info",
                message: "La edicion de foto estara disponible pronto.",
              })
            }
          >
            <MaterialIcons name="photo-camera" size={18} color="#3c2f00" />
          </Pressable>

          <Text style={styles.avatarActionLabel}>Actualizar Foto</Text>
        </View>

        <View style={styles.formWrap}>
          {isLoading ? (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Nombre completo</Text>
                <Skeleton style={styles.inputSkeleton} />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Telefono</Text>
                <Skeleton style={styles.inputSkeleton} />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Correo</Text>
                <Skeleton style={styles.inputSkeleton} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Nombre completo</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Nombre completo"
                  placeholderTextColor="rgba(208, 197, 175, 0.45)"
                  editable={!isSaving && !isLoading}
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Telefono</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Telefono"
                  placeholderTextColor="rgba(208, 197, 175, 0.45)"
                  editable={!isSaving && !isLoading}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Correo</Text>
                <TextInput
                  style={styles.fieldInputDisabled}
                  value={email || "Sin correo"}
                  placeholderTextColor="rgba(208, 197, 175, 0.45)"
                  editable={false}
                />
              </View>
            </>
          )}

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              setToast({
                visible: true,
                type: "info",
                message:
                  "El cambio de correo se habilitara en una siguiente fase.",
              })
            }
          >
            <Text style={styles.secondaryButtonText}>
              Cambiar correo electronico
            </Text>
          </Pressable>
        </View>

        <View style={styles.quoteWrap}>
          <MaterialIcons
            name="content-cut"
            size={24}
            color="rgba(212, 175, 55, 0.4)"
          />
          <Text style={styles.quoteText}>
            "La elegancia es la unica belleza que nunca desaparece."
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.saveButton}
          onPress={() => {
            void handleSave();
          }}
          disabled={isSaving || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Text>
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
  backgroundGlowRight: {
    position: "absolute",
    top: "22%",
    right: -120,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
  },
  backgroundGlowLeft: {
    position: "absolute",
    bottom: "25%",
    left: -120,
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "rgba(212, 175, 55, 0.06)",
  },
  header: {
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(19, 19, 19, 0.9)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#d4af37",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 14,
    fontWeight: "700",
  },
  brand: {
    color: "#d4af37",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 160,
    gap: 28,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 6,
  },
  avatarOuterGlow: {
    shadowColor: "#d4af37",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  avatarOuter: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
    backgroundColor: "#d4af37",
  },
  avatarInner: {
    flex: 1,
    borderRadius: 60,
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "#131313",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarSkeleton: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  avatarActionButton: {
    position: "absolute",
    right: "35%",
    bottom: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActionLabel: {
    marginTop: 10,
    color: "#f2ca50",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "700",
  },
  formWrap: {
    gap: 16,
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: "#99907c",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 11,
    marginLeft: 2,
  },
  fieldInput: {
    minHeight: 52,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#4d4635",
    backgroundColor: "#1c1b1b",
    color: "#e5e2e1",
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "600",
  },
  fieldInputDisabled: {
    minHeight: 52,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#353535",
    backgroundColor: "#1c1b1b",
    color: "#9f9685",
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  inputSkeleton: {
    minHeight: 52,
    borderRadius: 12,
  },
  secondaryButton: {
    marginTop: 6,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#f2ca50",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  quoteWrap: {
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
    opacity: 0.7,
  },
  quoteText: {
    color: "#99907c",
    fontStyle: "italic",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 26,
    backgroundColor: "rgba(19, 19, 19, 0.96)",
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#241a00",
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
