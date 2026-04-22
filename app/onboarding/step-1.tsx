import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Recomendado instalar expo-linear-gradient

const { width } = Dimensions.get("window");
const IMAGE_URI = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=1000&auto=format&fit=crop"; // Imagen de ejemplo de barbería

export default function StepOneScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Contenedor de Imagen con Gradiente Superior */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: IMAGE_URI }}
          style={styles.image}
          contentFit="cover"
          transition={1000}
        />
        <LinearGradient
          colors={["transparent", "rgba(10,10,10,0.8)", "#0A0A0A"]}
          style={styles.imageOverlay}
        />
      </View>

      <View style={styles.content}>
        {/* Indicadores de Progreso Superiores */}
        <View style={styles.progressRow}>
          <View style={[styles.progressStep, styles.progressActive]} />
          <View style={styles.progressStep} />
          <View style={styles.progressStep} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title}>
            Tu corte,{"\n"}
            <Text style={styles.titleHighlight}>a tu ritmo</Text>
          </Text>
          <Text style={styles.description}>
            Reservá tu turno en segundos con los mejores profesionales, sin esperas ni llamadas.
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
            ]}
            onPress={() => router.push("/onboarding/step-2")}
          >
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </Pressable>

          <Pressable 
            style={styles.secondaryPressable}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.secondaryText}>
              ¿Ya tenés cuenta? <Text style={styles.loginLink}>Iniciar sesión</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  imageContainer: {
    height: "55%",
    width: "100%",
    position: "absolute",
    top: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
  },
  content: {
    flex: 1,
    marginTop: "50%", // Empuja el contenido para que empiece donde termina el fade
    paddingHorizontal: 32,
    justifyContent: "space-between",
    paddingBottom: 50,
  },
  progressRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 40,
  },
  progressStep: {
    height: 4,
    flex: 1,
    borderRadius: 2,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  progressActive: {
    backgroundColor: "#D4AF37",
    width: width * 0.1, // Un poco más largo el activo
    flex: 1.5,
  },
  copy: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "900",
    lineHeight: 46,
    letterSpacing: -1,
  },
  titleHighlight: {
    color: "#D4AF37",
  },
  description: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 17,
    lineHeight: 26,
    marginTop: 16,
    fontWeight: "400",
  },
  footer: {
    gap: 20,
    width: "100%",
  },
  primaryButton: {
    height: 64,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  primaryButtonText: {
    color: "#241a00",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  secondaryPressable: {
    alignItems: "center",
    paddingVertical: 10,
  },
  secondaryText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
  },
  loginLink: {
    color: "#D4AF37",
    fontWeight: "700",
  },
});