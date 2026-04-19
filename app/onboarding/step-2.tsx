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
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCd_prQ72qfD_jFg4TrHaSUwoWPrNoEupRhESASxUsbtIUB4DvEEFMEY8aDdpTQoedZvui5bIQXItDsorX_Q4uIns1y1hOXP9xiq8YFYa2B7U9inPV5Cde40wASld9btp9EgkGN0-YeNg5mJXBmdplxTGXvgcTVmQOL7M24QJvFyg5Mk_JNSgjLh6_lM0HtiushsXxYkm7qxdtkEQt7gokVFfzU0rvB37EM8feazRBkkS4Bs2lWCU7mtlAzKSdBUFxtZ6ykhFFWhqXO";

export default function StepTwoScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = Math.round(
    Math.min(400, Math.max(340, screenHeight * 0.43)),
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: IMAGE_URI }}
            style={styles.image}
            contentFit="cover"
            contentPosition="top"
          />
          <View style={styles.imageOverlay} />
        </View>
      </View>

      <View style={[styles.sheet, { height: sheetHeight }]}>
        <View style={styles.progressRow}>
          <View style={styles.progressDot} />
          <View style={styles.progressActive} />
          <View style={styles.progressDot} />
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>Elegí a tu estilista</Text>
          <Text style={styles.subtitle}>
            Conocé a nuestros barberos y elegí tu estilo.
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={styles.button}
            onPress={() => router.push("/onboarding/step-3")}
          >
            <Text style={styles.buttonText}>Siguiente</Text>
          </Pressable>

          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={styles.linkText}>
              ¿Ya tenés cuenta?{" "}
              <Text style={styles.linkTextStrong}>Iniciar sesión</Text>
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
    backgroundColor: "#131313",
  },
  hero: {
    flex: 1,
    backgroundColor: "#0e0e0e",
  },
  imageWrap: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#0e0e0e",
    justifyContent: "flex-start",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 14, 14, 0.08)",
  },
  sheet: {
    backgroundColor: "#1c1b1b",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 32,
    paddingHorizontal: 32,
    paddingBottom: 40,
    justifyContent: "flex-start",
    shadowColor: "#0e0e0e",
    shadowOpacity: 0.9,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -16 },
    elevation: 20,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 28,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4d4635",
  },
  progressActive: {
    width: 32,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#f2ca50",
    shadowColor: "#f2ca50",
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  copyBlock: {
    gap: 12,
  },
  title: {
    color: "#e5e2e1",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    color: "#d0c5af",
    fontSize: 16,
    lineHeight: 26,
  },
  footer: {
    marginTop: "auto",
    gap: 18,
  },
  button: {
    minHeight: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
    shadowColor: "#d4af37",
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  buttonText: {
    color: "#3c2f00",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  linkText: {
    color: "#d0c5af",
    textAlign: "center",
    fontSize: 15,
    lineHeight: 22,
  },
  linkTextStrong: {
    color: "#e5e2e1",
    fontWeight: "800",
    textDecorationLine: "underline",
    textDecorationColor: "#4d4635",
  },
});
