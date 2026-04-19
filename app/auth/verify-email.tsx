import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";

const ENVELOPE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDOQGuCIC4eMDr9-5k_-5CnDRPNbxW62FkkG-XdxaV-nEbKZlQ5R5kz_BOJhd7XVVxszvkeG2HYp-sK0MIWiOqqCvVLf5YKQQ-quQNP-3TrhD1eZ48gw--4_s5PGEDmlSZSLEoGozGLGyWqb5iZG4Hk5RCvociDuFpo-H_AYcfNmicmh6X8yNYEPSPekywN_YEsTsTAETfnqVC5dZuE0CuEz10CbGAysMwYvi1jDoxZXoDv9omc6ISajov5KRX6vIjpzZS3nrDD6bXO";

export default function VerifyEmailScreen() {
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.topBar}>
        <Pressable style={styles.iconButton}>
          <MaterialIcons name="menu" size={24} color="#d4af37" />
        </Pressable>
        <Text style={styles.topTitle}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <MaterialIcons name="person" size={20} color="#d0c5af" />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <View style={styles.glow} />
          <Image
            source={{ uri: ENVELOPE_URI }}
            style={styles.illustration}
            contentFit="contain"
          />
          <View style={styles.sealWrap}>
            <View style={styles.seal}>
              <MaterialIcons name="content-cut" size={22} color="#3c2f00" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Estas a un paso</Text>
        <Text style={styles.subtitle}>
          Enviamos un enlace a tu correo. Activa tu cuenta para continuar.
        </Text>

        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Abrir correo</Text>
        </Pressable>

        <View style={styles.secondaryBlock}>
          <Pressable>
            <Text style={styles.resendText}>Reenviar</Text>
          </Pressable>
          <Text style={styles.countdownText}>
            Podras reenviar en <Text style={styles.countdownStrong}>60s</Text>
          </Text>
        </View>

        <View style={styles.bottomSpacer} />

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/auth/login")}
        >
          <MaterialIcons name="arrow-back" size={18} color="#d0c5af" />
          <Text style={styles.backText}>Volver a Iniciar sesion</Text>
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
  topBar: {
    height: 64,
    paddingHorizontal: 24,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    color: "#d4af37",
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: 2.2,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.35)",
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
  },
  illustrationWrap: {
    width: 160,
    height: 160,
    marginBottom: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 156,
    height: 156,
    borderRadius: 78,
    backgroundColor: "rgba(242, 202, 80, 0.12)",
    shadowColor: "#d4af37",
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  illustration: {
    width: 150,
    height: 150,
    opacity: 0.9,
  },
  sealWrap: {
    position: "absolute",
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    color: "#e5e2e1",
    fontSize: 34,
    lineHeight: 40,
    textAlign: "center",
    fontWeight: "800",
    marginBottom: 12,
  },
  subtitle: {
    color: "#d0c5af",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 300,
    marginBottom: 30,
  },
  primaryButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  primaryButtonText: {
    color: "#3c2f00",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryBlock: {
    alignItems: "center",
    gap: 8,
  },
  resendText: {
    color: "#f2ca50",
    fontSize: 15,
    textDecorationLine: "underline",
  },
  countdownText: {
    color: "rgba(208, 197, 175, 0.72)",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  countdownStrong: {
    color: "#d0c5af",
    fontWeight: "700",
  },
  bottomSpacer: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  backText: {
    color: "#d0c5af",
    fontSize: 14,
  },
});
