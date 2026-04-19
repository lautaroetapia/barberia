import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { getBarberById, getServiceById } from "@/constants/booking-flow";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function BookingSuccessScreen() {
  const params = useLocalSearchParams<{
    appointmentId?: string;
    isReschedule?: string;
    shopName?: string;
    serviceId?: string;
    barberId?: string;
    dateLabel?: string;
    time?: string;
  }>();

  const appointmentId = pickFirst(params.appointmentId);
  const isReschedule = pickFirst(params.isReschedule) === "1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const serviceId = pickFirst(params.serviceId) ?? "service-haircut";
  const barberId = pickFirst(params.barberId) ?? "barber-any";
  const dateLabel = pickFirst(params.dateLabel) ?? "Martes 16 de Octubre";
  const time = pickFirst(params.time) ?? "16:30";

  const service = getServiceById(serviceId);
  const barber = getBarberById(barberId);

  const [showNotificationsPrompt, setShowNotificationsPrompt] = useState(true);
  const [calendarAdded, setCalendarAdded] = useState(false);

  const handleShare = async () => {
    await Share.share({
      message: `Reserva confirmada en ${shopName} para ${dateLabel} a las ${time}.`,
    });
  };

  useEffect(() => {
    const timeout = setTimeout(() => setShowNotificationsPrompt(true), 200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>NAVAJA DORADA</Text>

        <View style={styles.successIconWrap}>
          <View style={styles.successCircle}>
            <MaterialIcons name="check" size={48} color="#3c2f00" />
          </View>
        </View>

        <Text style={styles.title}>Turno confirmado</Text>
        <Text style={styles.subtitle}>
          Tu experiencia en el atelier esta reservada.
        </Text>

        <View style={styles.detailsCard}>
          <View style={styles.accent} />

          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={18} color="#f2ca50" />
            <View>
              <Text style={styles.detailLabel}>Atelier</Text>
              <Text style={styles.detailValue}>{shopName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="content-cut" size={18} color="#f2ca50" />
            <View>
              <Text style={styles.detailLabel}>Servicio</Text>
              <Text style={styles.detailValue}>{service.name}</Text>
              <Text style={styles.detailMuted}>con {barber.name}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="schedule" size={18} color="#f2ca50" />
            <View>
              <Text style={styles.detailLabel}>Fecha y Hora</Text>
              <Text style={styles.detailValue}>{dateLabel}</Text>
              <Text style={styles.detailTime}>{time} h</Text>
            </View>
          </View>
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrLabel}>Pase de Acceso</Text>
          <View style={styles.qrBox}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDtbD5fuU3eQdJ2etKS4PhyudpbfYolKIYCn-pqoYVdm_cZGc8xa-70K1_Dvi7nCTXGFowQPDmCMsSiSb8wLS8mJodefy75bVlnZpbmUHSVJQ7_SQOaJyoBOR0SBTzasu-0Z8XgBFqC8fg5BjDG1Qsvvyr6hESpFv9Oul-fLsE6vSnl6dsV1EauvN6RPCGP0RoMg__d9f2OkmWIQgIlTKojzLz99litp2VU4Z25MMrMFOs3hLkDqVaQ0eUq-a6-filQyX54O9QSka-x",
              }}
              style={styles.qrImage}
              contentFit="cover"
            />
          </View>
          <Text style={styles.qrText}>
            Presenta este codigo al llegar al atelier.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => setCalendarAdded(true)}
        >
          <MaterialIcons
            name={calendarAdded ? "check-circle" : "event"}
            size={18}
            color="#3c2f00"
          />
          <Text style={styles.primaryButtonText}>
            {calendarAdded ? "Agregado al Calendario" : "Agregar a Calendario"}
          </Text>
        </Pressable>

        {calendarAdded ? (
          <Text style={styles.calendarAddedText}>
            Listo. El turno quedo guardado en tu calendario (modo demo).
          </Text>
        ) : null}

        <Pressable
          style={styles.secondaryButton}
          onPress={() => void handleShare()}
        >
          <MaterialIcons name="share" size={18} color="#f2ca50" />
          <Text style={styles.secondaryButtonText}>Compartir</Text>
        </Pressable>

        <Pressable
          style={styles.linkButton}
          onPress={() =>
            router.replace({
              pathname: "/(tabs)/bookings",
              params:
                isReschedule && appointmentId
                  ? {
                      updatedAppointmentId: appointmentId,
                      updatedDate: dateLabel,
                      updatedTime: time,
                    }
                  : undefined,
            })
          }
        >
          <Text style={styles.linkText}>Ir a Mis Turnos</Text>
        </Pressable>
      </View>

      {showNotificationsPrompt ? (
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <MaterialIcons
                name="notifications-active"
                size={28}
                color="#f2ca50"
              />
            </View>
            <Text style={styles.modalTitle}>Activar notificaciones?</Text>
            <Text style={styles.modalBody}>
              Te avisaremos 24 horas antes de tu cita y sobre beneficios
              exclusivos.
            </Text>

            <Pressable
              style={styles.modalPrimaryButton}
              onPress={() => setShowNotificationsPrompt(false)}
            >
              <Text style={styles.modalPrimaryText}>Si, avisarme</Text>
            </Pressable>

            <Pressable
              style={styles.modalSecondaryButton}
              onPress={() => setShowNotificationsPrompt(false)}
            >
              <Text style={styles.modalSecondaryText}>Despues</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 220,
    alignItems: "center",
    gap: 16,
  },
  brand: {
    color: "#d4af37",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 3,
  },
  successIconWrap: {
    marginTop: 8,
    marginBottom: 2,
  },
  successCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  title: {
    color: "#e5e2e1",
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#d0c5af",
    fontSize: 15,
    textAlign: "center",
    maxWidth: 310,
  },
  detailsCard: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
    padding: 14,
    gap: 14,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#d4af37",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  detailLabel: {
    color: "#99907c",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  detailValue: {
    color: "#e5e2e1",
    fontSize: 17,
    fontWeight: "700",
    marginTop: 2,
  },
  detailMuted: {
    marginTop: 2,
    color: "#d0c5af",
    fontSize: 13,
  },
  detailTime: {
    marginTop: 2,
    color: "#f2ca50",
    fontSize: 20,
    fontWeight: "800",
  },
  qrCard: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
    padding: 16,
    alignItems: "center",
    gap: 10,
  },
  qrLabel: {
    color: "#d0c5af",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  qrBox: {
    width: 130,
    height: 130,
    borderRadius: 10,
    backgroundColor: "#fff",
    padding: 8,
  },
  qrImage: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
  },
  qrText: {
    color: "#d0c5af",
    fontSize: 13,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 20,
    backgroundColor: "rgba(14, 14, 14, 0.96)",
    gap: 10,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  primaryButtonText: {
    color: "#3c2f00",
    fontSize: 17,
    fontWeight: "800",
  },
  calendarAddedText: {
    color: "#f2ca50",
    fontSize: 12,
    textAlign: "center",
  },
  secondaryButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#353535",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#f2ca50",
    fontSize: 15,
    fontWeight: "700",
  },
  linkButton: {
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    color: "#d0c5af",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    backgroundColor: "#2a2a2a",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.22)",
  },
  modalIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#1c1b1b",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  modalTitle: {
    color: "#e5e2e1",
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    textAlign: "center",
  },
  modalBody: {
    marginTop: 10,
    color: "#d0c5af",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  modalPrimaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },
  modalPrimaryText: {
    color: "#3c2f00",
    fontSize: 15,
    fontWeight: "800",
  },
  modalSecondaryButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  modalSecondaryText: {
    color: "#f2ca50",
    fontSize: 14,
    fontWeight: "700",
  },
});
