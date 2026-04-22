import React, { useState, useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Linking,
  Platform,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

export default function VerifyEmailScreen() {
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Lógica del temporizador para el reenvío
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOpenEmailApp = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("message://");
    } else {
      Linking.openURL("mailto:");
    }
  };

  const handleResendEmail = () => {
    if (!canResend) return;
    // Aquí iría tu lógica de Supabase: supabase.auth.resend({ type: 'signup', email: '...' })
    setCountdown(60);
    setCanResend(false);
    console.log("Correo reenviado");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      {/* --- CABECERA --- */}
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()} 
          style={styles.backIconButton}
          accessibilityLabel="Volver"
        >
          <MaterialIcons name="chevron-left" size={34} color="#D4AF37" />
        </Pressable>
        <Text style={styles.brandTitle}>NAVAJA DORADA</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.container}>
        
        {/* --- ILUSTRACIÓN VECTORIAL PREMIUM --- */}
        <View style={styles.illustrationContainer}>
          <View style={styles.glowEffect} />
          <View style={styles.envelopeBase}>
            <MaterialIcons name="mail-outline" size={70} color="rgba(212, 175, 55, 0.15)" />
            <View style={styles.goldSeal}>
              <MaterialIcons name="content-cut" size={22} color="#000" />
            </View>
          </View>
        </View>

        {/* --- CONTENIDO DE TEXTO --- */}
        <View style={styles.textContent}>
          <Text style={styles.mainTitle}>Verifica tu cuenta</Text>
          <Text style={styles.description}>
            Casi terminamos. Te enviamos un enlace de confirmación. Revisa tu bandeja de entrada para activar tu perfil.
          </Text>
        </View>

        {/* --- ACCIONES --- */}
        <View style={styles.actionArea}>
          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleOpenEmailApp}
          >
            <Text style={styles.primaryButtonText}>Abrir mi correo</Text>
            <MaterialIcons name="open-in-new" size={20} color="#000" />
          </Pressable>

          <View style={styles.resendBox}>
            <Text style={styles.infoText}>¿No recibiste el código?</Text>
            <Pressable 
              onPress={handleResendEmail}
              disabled={!canResend}
              style={({ pressed }) => [
                pressed && canResend && { opacity: 0.7 }
              ]}
            >
              <Text style={[styles.resendLink, !canResend && styles.resendDisabled]}>
                {canResend ? "Reenviar ahora" : `Reenviar en ${countdown}s`}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* --- FOOTER --- */}
        <View style={styles.footer}>
          <Pressable 
            onPress={() => router.replace("/auth/login")}
            style={styles.loginLink}
          >
            <MaterialIcons name="keyboard-backspace" size={18} color="#555" />
            <Text style={styles.loginLinkText}>Volver al inicio de sesión</Text>
          </Pressable>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0A0A0A", // Negro mate profundo
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  backIconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  brandTitle: {
    color: "#D4AF37",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 4,
  },
  headerSpacer: {
    width: 44,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  illustrationContainer: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  glowEffect: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(212, 175, 55, 0.05)",
  },
  envelopeBase: {
    width: 110,
    height: 110,
    borderRadius: 28,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  goldSeal: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#0A0A0A",
    elevation: 4,
  },
  textContent: {
    alignItems: "center",
    marginBottom: 40,
  },
  mainTitle: {
    color: "#FFF",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -1,
  },
  description: {
    color: "#777",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  actionArea: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    height: 64,
    backgroundColor: "#D4AF37",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "800",
  },
  resendBox: {
    marginTop: 30,
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    color: "#555",
    fontSize: 14,
  },
  resendLink: {
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  resendDisabled: {
    color: "#333",
    textDecorationLine: "none",
  },
  footer: {
    marginTop: 60,
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
  },
  loginLinkText: {
    color: "#555",
    fontSize: 14,
    fontWeight: "600",
  },
});