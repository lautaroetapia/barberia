import { MaterialIcons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
  const [ready, setReady] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => setReady(true), 1500);

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    return () => clearTimeout(timeout);
  }, [pulse]);

  if (ready) {
    return <Redirect href="/onboarding/step-1" />;
  }

  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.08],
  });

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.34],
  });

  const iconScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1.015],
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.orbitalBackground} pointerEvents="none">
        <Animated.View
          style={[
            styles.backgroundGlow,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        />
      </View>
      <View style={styles.centerContent}>
        <View style={styles.logoWrap}>
          <View style={styles.logoHalo} />
          <Animated.View
            style={{ transform: [{ scale: iconScale }, { rotate: "-45deg" }] }}
          >
            <MaterialIcons name="content-cut" size={122} color="#d4af37" />
          </Animated.View>
        </View>

        <Text style={styles.title}>Navaja Dorada</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.loadingWrap}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitalBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  backgroundGlow: {
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(212, 175, 55, 0.035)",
    shadowColor: "#d4af37",
    shadowOpacity: 0.16,
    shadowRadius: 90,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  centerContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  logoWrap: {
    width: 190,
    height: 190,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 34,
  },
  logoHalo: {
    position: "absolute",
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    shadowColor: "#111111",
    shadowOpacity: 0.95,
    shadowRadius: 54,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  title: {
    color: "#d4af37",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "800",
    letterSpacing: -0.4,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: 18,
    textShadowColor: "rgba(212, 175, 55, 0.2)",
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 12,
  },
  divider: {
    width: 80,
    height: 2,
    borderRadius: 999,
    backgroundColor: "#d4af37",
    opacity: 0.9,
  },
  loadingWrap: {
    paddingBottom: 84,
  },
  loadingText: {
    color: "rgba(229, 226, 225, 0.6)",
    fontSize: 13,
    letterSpacing: 2.8,
    textTransform: "uppercase",
  },
});
