import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

export default function EmailSentScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [isResending, setIsResending] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  const handleOpenMail = async () => {
    const canOpen = await Linking.canOpenURL("mailto:");
    if (!canOpen) {
      setToast({
        visible: true,
        type: "error",
        message: "No encontramos una app de correo instalada.",
      });
      return;
    }

    await Linking.openURL("mailto:");
  };

  const handleResend = async () => {
    if (!isSupabaseConfigured) {
      setToast({
        visible: true,
        type: "error",
        message: "Falta configurar Supabase para reenviar.",
      });
      return;
    }

    const email = typeof params.email === "string" ? params.email : "";
    if (!email) {
      setToast({
        visible: true,
        type: "error",
        message: "Vuelve e ingresa tu correo para reenviar el enlace.",
      });
      return;
    }

    setIsResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "barberia://auth/new-password",
    });
    setIsResending(false);

    if (error) {
      setToast({ visible: true, type: "error", message: error.message });
      return;
    }

    setToast({
      visible: true,
      type: "success",
      message: "Reenviamos el enlace a tu correo.",
    });
  };

  return (
    <View style={styles.screen}>
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <StatusBar style="light" />

      <View style={styles.main}>
        <View style={styles.illustrationArea}>
          <View style={styles.glow} />
          <View style={styles.iconCircle}>
            <View>
              <MaterialIcons name="mail-outline" size={58} color="#f2ca50" />
              <View style={styles.badge}>
                <MaterialIcons name="key" size={20} color="#f2ca50" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title}>¡Correo enviado!</Text>
          <Text style={styles.subtitle}>
            Revisa tu bandeja. El enlace expira en 1h.
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={handleOpenMail}>
            <Text style={styles.primaryButtonText}>Abrir correo</Text>
            <MaterialIcons name="open-in-new" size={18} color="#3c2f00" />
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              isResending && styles.buttonDisabled,
            ]}
            onPress={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <ActivityIndicator color="#f2ca50" />
            ) : (
              <>
                <Text style={styles.secondaryButtonText}>Reenviar</Text>
                <MaterialIcons name="refresh" size={17} color="#f2ca50" />
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.backLinkButton}
            onPress={() => router.replace("/auth/login")}
          >
            <MaterialIcons name="arrow-back" size={15} color="#d0c5af" />
            <Text style={styles.backLinkText}>Volver a Login</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  main: {
    flex: 1,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationArea: {
    width: 160,
    height: 160,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(242, 202, 80, 0.09)",
    shadowColor: "#f2ca50",
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.32)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 9,
  },
  badge: {
    position: "absolute",
    right: -12,
    bottom: -9,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(242, 202, 80, 0.32)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    alignItems: "center",
    marginTop: 18,
    gap: 14,
  },
  title: {
    color: "#e5e2e1",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 300,
    color: "#d0c5af",
    fontSize: 17,
    lineHeight: 27,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    marginTop: 50,
    gap: 14,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: "#f2ca50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#f2ca50",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  primaryButtonText: {
    color: "#3c2f00",
    fontSize: 21,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 58,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.9)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    color: "#f2ca50",
    fontSize: 19,
    fontWeight: "700",
  },
  footer: {
    width: "100%",
    marginTop: 26,
    alignItems: "center",
  },
  backLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 3,
  },
  backLinkText: {
    color: "#d0c5af",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
});
