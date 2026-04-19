import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";

const IMAGE_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDeB_-RYCV8JurLrp589nxnbhls3S1b9GVZDOv1vykFUiKd11m1spPPY8jAFNyFb2tck05Df7IbanAXadsLEaGcyPVYd5zPf7WeO_8lc0YSN01MyHJqr0nryERq6Vorw94OIZMcu_oh3-FOfiGD9lkKVm0F--8rrlr-vKtjpgRQjitUarqbKqJ4crn0zPpl-UyAsjgB_k7hlMtFYitBua0Z05-3NorsDrPi3X12GVFjTjM5SW4Ly7g0FYGjKGtcOZg2Alq5_vWW32Db";

export default function StepThreeScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const panelHeight = Math.round(
    Math.min(420, Math.max(340, screenHeight * 0.45)),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <View style={styles.heroAmbient} pointerEvents="none" />

        <View style={styles.heroInner}>
          <View style={styles.imageFrame}>
            <View style={styles.goldAura} pointerEvents="none" />
            <Image
              source={{ uri: IMAGE_URI }}
              style={styles.image}
              contentFit="cover"
              contentPosition="center"
            />
            <View style={styles.imageOverlay} pointerEvents="none" />
          </View>
        </View>
      </View>

      <View style={[styles.panel, { height: panelHeight }]}>
        <View style={styles.copyBlock}>
          <Text style={styles.title}>Nunca mas pierdas un turno</Text>
          <Text style={styles.subtitle}>
            Activa los recordatorios despues de tu primera reserva.
          </Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.progressRow}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={styles.progressActive} />
          </View>

          <Pressable
            style={styles.button}
            onPress={() => router.replace("/auth/login")}
          >
            <Text style={styles.buttonText}>Comenzar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#131313",
  },
  hero: {
    flex: 1,
    position: "relative",
    backgroundColor: "#131313",
  },
  heroAmbient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#131313",
  },
  heroInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  imageFrame: {
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.62,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 20 },
    elevation: 14,
  },
  goldAura: {
    position: "absolute",
    width: "120%",
    height: "120%",
    borderRadius: 999,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  image: {
    width: "100%",
    height: "100%",
    opacity: 0.82,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(19, 19, 19, 0.18)",
  },
  panel: {
    backgroundColor: "#131313",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 30,
    justifyContent: "space-between",
  },
  title: {
    color: "#e5e2e1",
    textAlign: "center",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  subtitle: {
    color: "#d0c5af",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 25,
    maxWidth: 320,
  },
  copyBlock: {
    alignItems: "center",
    gap: 12,
  },
  actions: {
    gap: 26,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#353535",
  },
  progressActive: {
    width: 32,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#f2ca50",
    shadowColor: "#f2ca50",
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  button: {
    minHeight: 60,
    borderRadius: 16,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f2ca50",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  buttonText: {
    color: "#3c2f00",
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
