import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { getBarberById, getServiceById } from "@/constants/booking-flow";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function BookingConfirmScreen() {
  const params = useLocalSearchParams<{
    appointmentId?: string;
    isReschedule?: string;
    shopId?: string;
    shopName?: string;
    serviceId?: string;
    barberId?: string;
    dateLabel?: string;
    time?: string;
  }>();

  const appointmentId = pickFirst(params.appointmentId);
  const isReschedule = pickFirst(params.isReschedule) === "1";
  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const serviceId = pickFirst(params.serviceId) ?? "service-haircut";
  const barberId = pickFirst(params.barberId) ?? "barber-any";
  const dateLabel = pickFirst(params.dateLabel) ?? "Martes 16 de Octubre";
  const time = pickFirst(params.time) ?? "16:30";

  const service = getServiceById(serviceId);
  const barber = getBarberById(barberId);

  const [note, setNote] = useState("");
  const [reminder, setReminder] = useState(true);

  const confirm = () => {
    router.push({
      pathname: "/(tabs)/booking-success",
      params: {
        appointmentId,
        isReschedule: isReschedule ? "1" : "0",
        shopId,
        shopName,
        serviceId,
        barberId,
        dateLabel,
        time,
        reminder: reminder ? "1" : "0",
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#e5e2e1" />
        </Pressable>
        <Text style={styles.headerTitle}>Confirmar turno</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressActive]} />
      </View>

      <Text style={styles.stepText}>Paso 5 / 6</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryAccent} />

          <View style={styles.row}>
            <MaterialIcons name="storefront" size={18} color="#f2ca50" />
            <View>
              <Text style={styles.label}>Barberia</Text>
              <Text style={styles.value}>{shopName}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="content-cut" size={18} color="#f2ca50" />
            <View>
              <Text style={styles.label}>Servicio</Text>
              <Text style={styles.value}>{service.name}</Text>
            </View>
            <Text style={styles.price}>{service.price}</Text>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="person" size={18} color="#f2ca50" />
            <View>
              <Text style={styles.label}>Barbero</Text>
              <Text style={styles.value}>{barber.name}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <MaterialIcons name="calendar-month" size={18} color="#f2ca50" />
            <View>
              <Text style={styles.label}>Fecha y hora</Text>
              <Text style={styles.value}>
                {dateLabel} - {time} hs
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.fieldWrap}>
          <Text style={styles.fieldLabel}>Notas (opcional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Algun detalle adicional..."
            placeholderTextColor="rgba(208, 197, 175, 0.45)"
            style={styles.input}
          />
        </View>

        <Pressable
          style={styles.checkboxRow}
          onPress={() => setReminder((v) => !v)}
        >
          <View style={[styles.checkbox, reminder && styles.checkboxActive]}>
            {reminder ? (
              <MaterialIcons name="check" size={14} color="#3c2f00" />
            ) : null}
          </View>
          <Text style={styles.checkboxText}>Recordarme este turno</Text>
        </Pressable>

        <Text style={styles.policyText}>
          Al confirmar, aceptas nuestra politica de cancelacion. Cancelacion
          gratuita hasta 24h antes del turno.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.confirmButton} onPress={confirm}>
          <Text style={styles.confirmButtonText}>Confirmar Reserva</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
  },
  header: {
    height: 72,
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "800",
  },
  headerSpacer: {
    width: 40,
  },
  progressWrap: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  progressStep: {
    flex: 1,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#1c1b1b",
  },
  progressDone: {
    backgroundColor: "rgba(242, 202, 80, 0.35)",
  },
  progressActive: {
    backgroundColor: "#f2ca50",
  },
  stepText: {
    color: "#f2ca50",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    marginTop: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
    gap: 18,
  },
  summaryCard: {
    borderRadius: 16,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
    padding: 16,
    gap: 14,
    overflow: "hidden",
  },
  summaryAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: "#d4af37",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    color: "#99907c",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    marginTop: 2,
    color: "#e5e2e1",
    fontSize: 16,
    fontWeight: "700",
  },
  price: {
    marginLeft: "auto",
    color: "#f2ca50",
    fontSize: 22,
    fontWeight: "800",
  },
  fieldWrap: {
    gap: 8,
  },
  fieldLabel: {
    color: "#d0c5af",
    fontSize: 13,
  },
  input: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4d4635",
    backgroundColor: "#0e0e0e",
    paddingHorizontal: 12,
    color: "#e5e2e1",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#4d4635",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#20201f",
  },
  checkboxActive: {
    borderColor: "#f2ca50",
    backgroundColor: "#f2ca50",
  },
  checkboxText: {
    color: "#d0c5af",
    fontSize: 14,
  },
  policyText: {
    color: "#99907c",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    backgroundColor: "rgba(14, 14, 14, 0.96)",
  },
  confirmButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#3c2f00",
    fontSize: 18,
    fontWeight: "800",
  },
});
