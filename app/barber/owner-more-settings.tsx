import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { AppToast } from "@/components/ui/app-toast";
import { clearStoredActiveRole, setStoredActiveRole } from "@/lib/active-role";
import { supabase } from "@/lib/supabase";

const options = [
  ["store", "Datos de barberia"],
  ["schedule", "Horario semanal"],
  ["access-time", "Franjas de turnos"],
  ["policy", "Politicas"],
  ["bar-chart", "Reportes"],
  ["swap-horiz", "Cambiar a vista Barbero"],
  ["support-agent", "Soporte"],
  ["logout", "Cerrar sesion"],
] as const;

export default function OwnerMoreSettingsScreen() {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  const performSignOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setToast({ visible: true, type: "error", message: error.message });
      return;
    }

    await clearStoredActiveRole();

    router.replace("/auth/login");
  };

  const handleOptionPress = async (label: string) => {
    if (label === "Cambiar a vista Barbero") {
      await setStoredActiveRole("barbero");
      router.replace("/barber/barber-my-agenda");
      return;
    }

    if (label === "Horario semanal") {
      router.push("/barber/owner-agenda");
      return;
    }

    if (label === "Franjas de turnos") {
      router.push("/barber/owner-shifts");
      return;
    }

    if (label === "Datos de barberia") {
      router.push("/barber/owner-barbershop-profile");
      return;
    }

    if (label === "Reportes") {
      router.push("/barber/owner-reports");
      return;
    }

    if (label === "Politicas") {
      router.push("/barber/owner-policies");
      return;
    }

    if (label === "Soporte") {
      router.push("/barber/owner-support");
      return;
    }

    if (label === "Cerrar sesion") {
      Alert.alert("Cerrar sesion", "Quieres cerrar sesion ahora?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesion",
          style: "destructive",
          onPress: () => {
            void performSignOut();
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.replace("/barber/dashboard-owner")}
        >
          <MaterialIcons name="menu" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCWYKuVp3vuT0rwxEuDBrkSNn8KvTqwU7RbMRlW5bv8vfz1USDoA4wbVR1NbqbJDnbNGaA-Mq1ct27V_ygg4dLGQ1sV3GkZvA0yIpjjqHRc8zxP7ogqjEXAeZH0HpPp92ZgKk4dRaPA3X2AEImQTqlBvhq3LRmoeJI04zTdnUec9iF3AyN3m1yTj7SLagDU8LWxnMxUEPmxHjHbI568eAT2BrtBqmQB-WB2D-jaXQ_YuBOJfvNbUqes8eqS_ZqVXaNRptt0CATEULZj",
            }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mas</Text>
        <View style={styles.list}>
          {options.map((item, index) => (
            <Pressable
              key={item[1]}
              style={[
                styles.option,
                item[1] === "Cambiar a vista Barbero" && styles.optionHighlight,
                item[1] === "Cerrar sesion" && styles.optionDanger,
              ]}
              onPress={() => {
                void handleOptionPress(item[1]);
              }}
            >
              <View style={styles.optionLeft}>
                <MaterialIcons
                  name={item[0]}
                  size={20}
                  color={
                    item[1] === "Cerrar sesion"
                      ? "#ffb4ab"
                      : item[1] === "Cambiar a vista Barbero"
                        ? "#f2ca50"
                        : "#d0c5af"
                  }
                />
                <Text
                  style={[
                    styles.optionText,
                    item[1] === "Cambiar a vista Barbero" &&
                      styles.optionTextHighlight,
                    item[1] === "Cerrar sesion" && styles.optionTextDanger,
                  ]}
                >
                  {item[1]}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#99907c" />
            </Pressable>
          ))}
        </View>

        <Text style={styles.version}>Version 2.1.0</Text>
      </ScrollView>

      <BarberRoleNav mode="owner" current="mas" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  topBar: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(19,19,19,0.92)",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "#d4af37",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 2,
  },
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4d4635",
  },
  avatar: { width: "100%", height: "100%" },
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 110 },
  title: {
    color: "#e5e2e1",
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 14,
  },
  list: { gap: 10 },
  option: {
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionHighlight: {
    backgroundColor: "#2a2a2a",
    borderColor: "rgba(212,175,55,0.3)",
  },
  optionDanger: {
    borderColor: "rgba(255,180,171,0.3)",
  },
  optionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  optionText: { color: "#e5e2e1", fontSize: 15, fontWeight: "500" },
  optionTextHighlight: { color: "#f2ca50", fontWeight: "700" },
  optionTextDanger: { color: "#ffb4ab", fontWeight: "700" },
  version: { textAlign: "center", color: "#777", marginTop: 24, fontSize: 12 },
});
