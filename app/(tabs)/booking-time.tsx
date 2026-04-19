import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
    bookingDateLabel,
    bookingTimeSlotsAfternoon,
    bookingTimeSlotsMorning,
    getBarberById,
} from "@/constants/booking-flow";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function BookingTimeScreen() {
  const params = useLocalSearchParams<{
    appointmentId?: string;
    isReschedule?: string;
    shopId?: string;
    shopName?: string;
    serviceId?: string;
    barberId?: string;
  }>();

  const appointmentId = pickFirst(params.appointmentId);
  const isReschedule = pickFirst(params.isReschedule) === "1";
  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const serviceId = pickFirst(params.serviceId) ?? "service-haircut";
  const barberId = pickFirst(params.barberId) ?? "barber-any";
  const barber = getBarberById(barberId);

  const [selectedTime, setSelectedTime] = useState("16:30");

  const goNext = () => {
    router.push({
      pathname: "/(tabs)/booking-confirm",
      params: {
        appointmentId,
        isReschedule: isReschedule ? "1" : "0",
        shopId,
        shopName,
        serviceId,
        barberId,
        dateLabel: bookingDateLabel,
        time: selectedTime,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#e5e2e1" />
        </Pressable>
        <Text style={styles.headerTitle}>Elegi horario</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressActive]} />
        <View style={styles.progressStep} />
      </View>

      <Text style={styles.stepText}>Paso 4 / 6</Text>
      <Text style={styles.subtitle}>
        {shopName} · {barber.name}
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dateCard}>
          <Text style={styles.dateTitle}>Fecha seleccionada</Text>
          <Text style={styles.dateValue}>{bookingDateLabel}</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Manana</Text>
          <View style={styles.grid}>
            {bookingTimeSlotsMorning.map((slot) => {
              const selected = selectedTime === slot.time;
              return (
                <Pressable
                  key={slot.id}
                  style={[
                    styles.slotButton,
                    selected && styles.slotButtonActive,
                    slot.disabled && styles.slotButtonDisabled,
                  ]}
                  onPress={() => {
                    if (!slot.disabled) {
                      setSelectedTime(slot.time);
                    }
                  }}
                  disabled={slot.disabled}
                >
                  <Text
                    style={[
                      styles.slotText,
                      selected && styles.slotTextActive,
                      slot.disabled && styles.slotTextDisabled,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.groupTitle}>Tarde</Text>
          <View style={styles.grid}>
            {bookingTimeSlotsAfternoon.map((slot) => {
              const selected = selectedTime === slot.time;
              return (
                <View key={slot.id} style={styles.slotWrap}>
                  <Pressable
                    style={[
                      styles.slotButton,
                      selected && styles.slotButtonActive,
                    ]}
                    onPress={() => setSelectedTime(slot.time)}
                  >
                    <Text
                      style={[
                        styles.slotText,
                        selected && styles.slotTextActive,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </Pressable>
                  {selected && slot.label ? (
                    <Text style={styles.slotHint}>{slot.label}</Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.nextButton} onPress={goNext}>
          <Text style={styles.nextButtonText}>Siguiente</Text>
          <MaterialIcons name="arrow-forward" size={18} color="#3c2f00" />
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
  subtitle: {
    color: "#d0c5af",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
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
  dateCard: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
    padding: 14,
  },
  dateTitle: {
    color: "#99907c",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dateValue: {
    marginTop: 6,
    color: "#e5e2e1",
    fontSize: 18,
    fontWeight: "700",
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: "#d0c5af",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  slotWrap: {
    width: "31%",
  },
  slotButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4d4635",
    backgroundColor: "#20201f",
    alignItems: "center",
    justifyContent: "center",
  },
  slotButtonActive: {
    borderColor: "#f2ca50",
    backgroundColor: "rgba(242, 202, 80, 0.08)",
  },
  slotButtonDisabled: {
    opacity: 0.35,
  },
  slotText: {
    color: "#e5e2e1",
    fontSize: 13,
    fontWeight: "600",
  },
  slotTextActive: {
    color: "#f2ca50",
  },
  slotTextDisabled: {
    textDecorationLine: "line-through",
  },
  slotHint: {
    marginTop: 4,
    color: "#d4af37",
    fontSize: 10,
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
  nextButton: {
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: "#d4af37",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: {
    color: "#3c2f00",
    fontSize: 18,
    fontWeight: "800",
  },
});
