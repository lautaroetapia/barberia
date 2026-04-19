import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function RegisterBarbershopSuccessScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="check-circle" size={46} color="#f2ca50" />
        </View>

        <Text style={styles.title}>Barberia creada</Text>
        <Text style={styles.subtitle}>
          Tu perfil de dueno ya esta listo para administrar agenda, barberos y
          servicios.
        </Text>

        <Pressable
          style={styles.primaryButton}
          onPress={() => router.replace("/barber/dashboard-owner")}
        >
          <Text style={styles.primaryButtonText}>Ir al panel de dueno</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.replace("/(tabs)/profile")}
        >
          <Text style={styles.secondaryButtonText}>Volver a mi perfil</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  title: {
    color: "#e5e2e1",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#d0c5af",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 10,
    minHeight: 52,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: "#241a00",
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 48,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.32)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#252423",
  },
  secondaryButtonText: {
    color: "#d0c5af",
    fontSize: 14,
    fontWeight: "700",
  },
});
