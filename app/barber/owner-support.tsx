import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useState } from "react";
import {
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";

const SUPPORT_EMAIL = "soporte@navajadorada.app";
const SUPPORT_PHONE = "+5491112345678";

export default function OwnerSupportScreen() {
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const openEmail = async () => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=Soporte%20Due%C3%B1o%20Barber%C3%ADa`;
    if (await Linking.canOpenURL(mailto)) {
      await Linking.openURL(mailto);
      return;
    }

    setToast({
      visible: true,
      message: "No se pudo abrir el email",
      type: "error",
    });
  };

  const openWhatsApp = async () => {
    const whatsapp = `https://wa.me/${SUPPORT_PHONE.replace("+", "")}`;
    if (await Linking.canOpenURL(whatsapp)) {
      await Linking.openURL(whatsapp);
      return;
    }

    setToast({
      visible: true,
      message: "No se pudo abrir WhatsApp",
      type: "error",
    });
  };

  const copyEmail = async () => {
    await Clipboard.setStringAsync(SUPPORT_EMAIL);
    setToast({
      visible: true,
      message: "Email de soporte copiado",
      type: "success",
    });
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.replace("/barber/owner-more-settings")}
        >
          <MaterialIcons name="arrow-back" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Soporte</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Necesitas ayuda?</Text>
          <Text style={styles.heroText}>
            Te ayudamos con configuracion, turnos, reportes y gestion de
            personal.
          </Text>
        </View>

        <Pressable style={styles.actionButton} onPress={() => void openEmail()}>
          <MaterialIcons name="mail-outline" size={18} color="#f2ca50" />
          <Text style={styles.actionText}>Enviar email a soporte</Text>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => void openWhatsApp()}
        >
          <MaterialIcons name="chat" size={18} color="#f2ca50" />
          <Text style={styles.actionText}>Contactar por WhatsApp</Text>
        </Pressable>

        <Pressable style={styles.actionButton} onPress={() => void copyEmail()}>
          <MaterialIcons name="content-copy" size={18} color="#f2ca50" />
          <Text style={styles.actionText}>Copiar email de soporte</Text>
        </Pressable>

        <View style={styles.faqCard}>
          <Text style={styles.faqTitle}>Preguntas frecuentes</Text>
          <Text style={styles.faqItem}>- Como reprogramo turnos masivos?</Text>
          <Text style={styles.faqItem}>
            - Como agrego o desactivo barberos?
          </Text>
          <Text style={styles.faqItem}>- Como exporto reportes a PDF?</Text>
        </View>
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
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
    gap: 12,
  },
  heroCard: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 16,
  },
  heroTitle: { color: "#e5e2e1", fontSize: 22, fontWeight: "800" },
  heroText: { color: "#d0c5af", fontSize: 13, marginTop: 4, lineHeight: 19 },
  actionButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: { color: "#f2ca50", fontSize: 14, fontWeight: "700" },
  faqCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    gap: 6,
  },
  faqTitle: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  faqItem: { color: "#d0c5af", fontSize: 13 },
});
