import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View, Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
  const [ready, setReady] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrada suave de toda la interfaz
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => setReady(true), 3000);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1500,
          easing: Easing.bezier(0.4, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      clearTimeout(timeout);
      animation.stop();
    };
  }, [pulse]);

  if (ready) {
    return <Redirect href="/onboarding/step-1" />;
  }

  const iconTranslateY = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.1, 0.4],
  });

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Animated.View style={[styles.centerContent, { opacity: fadeAnim }]}>
        <View style={styles.iconWrap}>
          {/* Aura de luz de fondo */}
          <Animated.View
            style={[
              styles.glow,
              { opacity: glowOpacity, transform: [{ scale: glowScale }] },
            ]}
          />
          
          {/* Icono Flotante */}
          <Animated.View
            style={{ 
              transform: [
                { translateY: iconTranslateY }, 
                { rotate: "-45deg" }
              ] 
            }}
          >
            <MaterialIcons name="content-cut" size={100} color="#F2CA50" />
          </Animated.View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>NAVAJA DORADA</Text>
          <Text style={styles.subtitle}>THE ART OF PRECISION</Text>
          
          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <View style={styles.diamond} />
            <View style={styles.line} />
          </View>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <Animated.Text style={[styles.loadingText, { opacity: pulse }]}>
          Iniciando experiencia...
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505", // Negro más profundo para resaltar el oro
    alignItems: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 40,
  },
  glow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowRadius: 50,
    shadowOpacity: 1,
    elevation: 20,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    color: "#F2CA50",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1.5,
    textAlign: "center",
  },
  subtitle: {
    color: "rgba(242, 202, 80, 0.4)",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 5,
    marginTop: 4,
    marginBottom: 24,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: width * 0.4,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(212, 175, 55, 0.2)",
  },
  diamond: {
    width: 6,
    height: 6,
    backgroundColor: "#D4AF37",
    transform: [{ rotate: "45deg" }],
    marginHorizontal: 15,
  },
  footer: {
    paddingBottom: 60,
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});