import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function RegisterBarbershopSuccessScreen() {
  return (
    <View style={styles.screen}>
      {/* Efectos de luz de fondo */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.container}>
        {/* Animación visual del Icono */}
        <View style={styles.iconContainer}>
          <View style={styles.iconRingOuter}>
            <View style={styles.iconRingInner}>
              <MaterialIcons name="check" size={48} color="#d4af37" />
            </View>
          </View>
        </View>

        {/* Textos */}
        <View style={styles.textStack}>
          <Text style={styles.title}>¡NEGOCIO LISTO!</Text>
          <Text style={styles.subtitle}>
            Tu barbería ha sido registrada con éxito. Ahora tienes acceso total
            a las herramientas de administración.
          </Text>
        </View>

        {/* Acciones */}
        <View style={styles.buttonStack}>
          <LinearGradient
            colors={["#d4af37", "#b8962e"]}
            style={styles.primaryGradient}
          >
            <Pressable
              style={styles.primaryButton}
              onPress={() => router.replace("/barber/dashboard-owner")}
            >
              <Text style={styles.primaryButtonText}>IR AL PANEL DE DUEÑO</Text>
              <MaterialIcons name="dashboard" size={18} color="#241a00" />
            </Pressable>
          </LinearGradient>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.replace("/(tabs)/profile")}
          >
            <Text style={styles.secondaryButtonText}>Volver a mi perfil</Text>
          </Pressable>
        </View>

        <View style={styles.brandFooter}>
          <Text style={styles.brandText}>NAVAJA DORADA</Text>
          <View style={styles.brandLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0A0A0A",
    alignItems: "center",
    justifyContent: "center",
  },
  glowTop: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(212, 175, 55, 0.07)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: "rgba(212, 175, 55, 0.05)",
  },
  container: {
    width: "85%",
    alignItems: "center",
    gap: 40,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconRingInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#161616",
    borderWidth: 2,
    borderColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  textStack: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 2,
  },
  subtitle: {
    color: "#888",
    fontSize: 15,
    lineHeight: 24,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  buttonStack: {
    width: "100%",
    gap: 16,
  },
  primaryGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryButton: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryButtonText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1,
  },
  secondaryButton: {
    height: 55,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#222",
  },
  secondaryButtonText: {
    color: "#777",
    fontSize: 14,
    fontWeight: "700",
  },
  brandFooter: {
    marginTop: 20,
    alignItems: "center",
    opacity: 0.4,
  },
  brandText: {
    color: "#d4af37",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 5,
  },
  brandLine: {
    width: 40,
    height: 1,
    backgroundColor: "#d4af37",
    marginTop: 8,
  },
});
