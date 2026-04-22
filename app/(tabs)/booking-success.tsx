import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Dimensions,
    Pressable,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function BookingSuccessScreen() {
  const params = useLocalSearchParams<{
    appointmentId?: string;
    isReschedule?: string;
    shopName?: string;
    serviceId?: string;
    barberId?: string;
    serviceName?: string;
    servicePrice?: string;
    barberName?: string;
    dateLabel?: string;
    time?: string;
  }>();

  const appointmentId = pickFirst(params.appointmentId);
  const isReschedule = pickFirst(params.isReschedule) === "1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const serviceName = pickFirst(params.serviceName) ?? "Servicio";
  const servicePrice = pickFirst(params.servicePrice) ?? "$0";
  const barberName = pickFirst(params.barberName) ?? "Cualquier profesional";
  const dateLabel = pickFirst(params.dateLabel) ?? "Martes 16 de Octubre";
  const time = pickFirst(params.time) ?? "16:30";

  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setShowNotificationsPrompt(true), 800);
    return () => clearTimeout(timeout);
  }, []);

  const handleShare = async () => {
    await Share.share({
      message: `¡Listo! Turno confirmado en ${shopName} para el ${dateLabel} a las ${time}hs.`,
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>NAVAJA DORADA</Text>

        <View style={styles.successHeader}>
          <View style={styles.successCircle}>
            <MaterialIcons name="check" size={44} color="#000" />
          </View>
          <Text style={styles.title}>¡Reserva Lista!</Text>
          <Text style={styles.subtitle}>
            Tu lugar en el atelier está confirmado.
          </Text>
        </View>

        {/* TICKET DE RESERVA */}
        <View style={styles.ticketContainer}>
          <LinearGradient
            colors={["#1C1C1C", "#141414"]}
            style={styles.ticketCard}
          >
            <View style={styles.ticketHeader}>
              <View>
                <Text style={styles.ticketLabel}>CLIENTE</Text>
                <Text style={styles.ticketValue}>Usuario Premium</Text>
              </View>
              <View style={styles.priceTag}>
                <Text style={styles.priceText}>{servicePrice}</Text>
              </View>
            </View>

            <View style={styles.ticketDivider}>
              <View style={styles.dotLeft} />
              <View style={styles.dashLine} />
              <View style={styles.dotRight} />
            </View>

            <View style={styles.ticketBody}>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.ticketLabel}>FECHA</Text>
                  <Text style={styles.ticketValue}>{dateLabel}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.ticketLabel}>HORA</Text>
                  <Text style={[styles.ticketValue, { color: "#D4AF37" }]}>
                    {time} HS
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.ticketLabel}>DETALLES</Text>
                <Text style={styles.ticketValue}>{serviceName}</Text>
                <Text style={styles.barberName}>con {barberName}</Text>
              </View>
            </View>

            <View style={styles.qrSection}>
              <View style={styles.qrWrapper}>
                <Image
                  source={{
                    uri:
                      "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" +
                      appointmentId,
                  }}
                  style={styles.qrImage}
                />
              </View>
              <Text style={styles.qrHint}>PRESENTAR AL LLEGAR</Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        <View style={styles.mainActions}>
          <Pressable
            style={[styles.btnPrimary, calendarAdded && styles.btnSuccess]}
            onPress={() => setCalendarAdded(true)}
          >
            <MaterialIcons
              name={calendarAdded ? "event-available" : "event"}
              size={20}
              color="#000"
            />
            <Text style={styles.btnPrimaryText}>
              {calendarAdded ? "Agregado" : "Agendar cita"}
            </Text>
          </Pressable>

          <Pressable style={styles.btnSecondary} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color="#D4AF37" />
          </Pressable>
        </View>

        <Pressable
          style={styles.btnLink}
          onPress={() => router.replace("/(tabs)/bookings")}
        >
          <Text style={styles.btnLinkText}>Ver mis turnos</Text>
        </Pressable>
      </View>

      {/* MODAL DE NOTIFICACIONES CORREGIDO */}
      {showNotificationsPrompt && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <MaterialIcons
                name="notifications-active"
                size={30}
                color="#D4AF37"
              />
            </View>
            <Text style={styles.modalTitle}>¿Activamos avisos?</Text>
            <Text style={styles.modalText}>
              Te recordaremos tu cita 24hs antes para que no pierdas tu lugar.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalBtnConfirm}
                onPress={() => setShowNotificationsPrompt(false)}
              >
                <Text style={styles.modalBtnConfirmText}>Sí, avisarme</Text>
              </Pressable>

              <Pressable
                style={styles.modalBtnCancel}
                onPress={() => setShowNotificationsPrompt(false)}
              >
                <Text style={styles.modalBtnCancelText}>Después</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 25,
    paddingTop: 40,
    paddingBottom: 180,
    alignItems: "center",
  },

  brand: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 5,
    marginBottom: 25,
    opacity: 0.8,
  },

  successHeader: { alignItems: "center", marginBottom: 25 },
  successCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  title: { color: "#FFF", fontSize: 26, fontWeight: "900" },
  subtitle: { color: "#777", fontSize: 14, marginTop: 5 },

  ticketContainer: { width: "100%" },
  ticketCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#222",
    overflow: "hidden",
  },
  ticketHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketLabel: {
    color: "#555",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 4,
  },
  ticketValue: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  priceTag: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  priceText: { color: "#D4AF37", fontWeight: "900", fontSize: 16 },

  ticketDivider: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    marginVertical: 5,
  },
  dashLine: {
    flex: 1,
    height: 1,
    borderStyle: "dashed",
    borderColor: "#333",
    borderWidth: 1,
  },
  dotLeft: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0A0A0A",
    marginLeft: -12,
    borderWidth: 1,
    borderColor: "#222",
  },
  dotRight: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#0A0A0A",
    marginRight: -12,
    borderWidth: 1,
    borderColor: "#222",
  },

  ticketBody: { padding: 20, paddingTop: 0, gap: 15 },
  infoGrid: { flexDirection: "row", justifyContent: "space-between" },
  infoItem: { flex: 1 },
  barberName: { color: "#666", fontSize: 13 },

  qrSection: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  qrWrapper: {
    padding: 8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    marginBottom: 10,
  },
  qrImage: { width: 110, height: 110 },
  qrHint: {
    color: "#D4AF37",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 2,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    paddingBottom: 35,
    backgroundColor: "rgba(10,10,10,0.95)",
    gap: 10,
  },
  mainActions: { flexDirection: "row", gap: 10 },
  btnPrimary: {
    flex: 1,
    height: 56,
    backgroundColor: "#D4AF37",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnSuccess: { backgroundColor: "#4CAF50" },
  btnPrimaryText: { color: "#000", fontSize: 16, fontWeight: "900" },
  btnSecondary: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  btnLink: { height: 40, alignItems: "center", justifyContent: "center" },
  btnLinkText: { color: "#666", fontSize: 14, fontWeight: "700" },

  /* ESTILOS DEL MODAL CORREGIDOS */
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 25,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#1A1A1A",
    borderRadius: 28,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 10,
  },
  modalText: {
    color: "#888",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 25,
  },

  modalActions: {
    width: "100%",
    gap: 8,
  },
  modalBtnConfirm: {
    width: "100%",
    height: 54,
    backgroundColor: "#D4AF37",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnConfirmText: { color: "#000", fontSize: 16, fontWeight: "900" },
  modalBtnCancel: {
    width: "100%",
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancelText: { color: "#666", fontSize: 15, fontWeight: "700" },
});
