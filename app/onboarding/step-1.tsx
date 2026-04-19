import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";

const IMAGE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBRsOLICSFsLDyllxHTFzHt7aeK7hnAMWm6C191AQVPUe1bwmPZZj-4IvREHGl_cvi6IbdndPoPtdRa5r_mLgHr23BCSHLVWC24CMfoYiEDtGDfxXaPEKaItT3DeI0zwzclLdVAuP5U0i_NbvcG6-9oSA37m7ynRNlz7F64wHcuJmD3ohpa8Fks4afQHHbPz1Sq_163J8iODiCiHI_HpDhi5oNQV6rUpfYZtzDJlYsgN4XyqRTFkowghZJzieQGaD6UgU4szHLLd_xu";

export default function StepOneScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <View style={styles.imageFrame}>
          <Image
            source={{ uri: IMAGE_URI }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.imageFade} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>Tu corte, a tu ritmo</Text>
          <Text style={styles.description}>
            Reservá en segundos, sin esperas.
          </Text>
        </View>

        <View style={styles.progressRow}>
          <View style={styles.progressActive} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/onboarding/step-2")}
        >
          <Text style={styles.primaryButtonText}>Siguiente</Text>
        </Pressable>

        <Pressable onPress={() => router.push("/auth/login")}>
          <Text style={styles.secondaryLink}>
            ¿Ya tenés cuenta? Iniciar sesión
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131313",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 24,
  },
  imageFrame: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 40,
    backgroundColor: "#1c1b1b",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(19, 19, 19, 0.04)",
  },
  copy: {
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  title: {
    color: "#e5e2e1",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  description: {
    color: "#d0c5af",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    maxWidth: 280,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 32,
  },
  progressActive: {
    width: 32,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#f2ca50",
    shadowColor: "#f2ca50",
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2a2a2a",
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    gap: 22,
    backgroundColor: "rgba(19, 19, 19, 0.94)",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
    shadowColor: "#d4af37",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  primaryButtonText: {
    color: "#3c2f00",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  secondaryLink: {
    color: "#d0c5af",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: "underline",
    textDecorationColor: "#4d4635",
  },
});
