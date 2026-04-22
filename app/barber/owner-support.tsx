import { Feather } from "@expo/vector-icons";
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
  }>({ visible: false, message: "", type: "info" });

  const openEmail = async () => {
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=Soporte%20Due%C3%B1o%20Barber%C3%ADa`;
    const canOpen = await Linking.canOpenURL(mailto);
    if (canOpen) {
      await Linking.openURL(mailto);
    } else {
      setToast({ visible: true, message: "No se encontró app de correo", type: "error" });
    }
  };

  const openWhatsApp = async () => {
    const whatsapp = `https://wa.me/${SUPPORT_PHONE.replace("+", "")}`;
    await Linking.openURL(whatsapp);
  };

  const copyEmail = async () => {
    await Clipboard.setStringAsync(SUPPORT_EMAIL);
    setToast({ visible: true, message: "Email copiado al portapapeles", type: "success" });
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={26} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Centro de Ayuda</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroSection}>
          <View style={styles.heroIconBadge}>
            <Feather name="headphones" size={32} color="#d4af37" />
          </View>
          <Text style={styles.heroTitle}>Estamos para ayudarte</Text>
          <Text style={styles.heroText}>
            Nuestro equipo técnico está disponible para asistirte con la gestión de tu barbería.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Canales de contacto</Text>

        <View style={styles.grid}>
          <Pressable style={styles.contactCard} onPress={openWhatsApp}>
            <View style={[styles.iconCircle, { backgroundColor: '#25D36620' }]}>
              <Feather name="message-circle" size={24} color="#25D366" />
            </View>
            <Text style={styles.cardTitle}>WhatsApp</Text>
            <Text style={styles.cardSub}>Respuesta rápida</Text>
          </Pressable>

          <Pressable style={styles.contactCard} onPress={openEmail}>
            <View style={[styles.iconCircle, { backgroundColor: '#d4af3720' }]}>
              <Feather name="mail" size={24} color="#d4af37" />
            </View>
            <Text style={styles.cardTitle}>Email</Text>
            <Text style={styles.cardSub}>Casos complejos</Text>
          </Pressable>
        </View>

        <Pressable style={styles.copySecondary} onPress={copyEmail}>
          <Feather name="copy" size={16} color="#99907c" />
          <Text style={styles.copyText}>Copiar: {SUPPORT_EMAIL}</Text>
        </Pressable>

        <View style={styles.faqSection}>
          <Text style={styles.sectionLabel}>Preguntas frecuentes</Text>
          
          {[
            "¿Cómo reprogramo turnos masivos?",
            "¿Cómo agrego o desactivo barberos?",
            "¿Cómo exporto reportes a PDF?"
          ].map((faq, index) => (
            <View key={index} style={styles.faqItem}>
              <Text style={styles.faqText}>{faq}</Text>
              <Feather name="chevron-right" size={16} color="#444" />
            </View>
          ))}
        </View>

        <Text style={styles.footerInfo}>Versión 2.4.0 • Navaja Dorada Pro</Text>
      </ScrollView>

      <BarberRoleNav mode="owner" current="mas" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0c0c0c" },
  topBar: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800" },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
  
  heroSection: {
    alignItems: "center",
    backgroundColor: "#151515",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 24,
  },
  heroIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#d4af3710",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center" },
  heroText: { color: "#99907c", fontSize: 14, textAlign: "center", marginTop: 8, lineHeight: 20 },

  sectionLabel: {
    color: "#d4af37",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  contactCard: {
    flex: 1,
    backgroundColor: "#151515",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  iconCircle: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  cardTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  cardSub: { color: "#666", fontSize: 11, marginTop: 4 },

  copySecondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    marginBottom: 30,
  },
  copyText: { color: "#99907c", fontSize: 13, fontWeight: "500" },

  faqSection: { gap: 8 },
  faqItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#121212",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  faqText: { color: "#d0c5af", fontSize: 14, fontWeight: "500" },

  footerInfo: {
    textAlign: "center",
    color: "#333",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 40,
    textTransform: "uppercase",
  }
});