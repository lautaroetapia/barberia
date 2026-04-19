import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { bookingBarbers } from "@/constants/booking-flow";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function BookingBarberScreen() {
  const params = useLocalSearchParams<{
    shopId?: string;
    shopName?: string;
    serviceId?: string;
    preselectedBarberId?: string;
    preselectedBarberName?: string;
  }>();

  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const serviceId = pickFirst(params.serviceId) ?? "service-haircut";
  const preselectedBarberId =
    pickFirst(params.preselectedBarberId) ?? "barber-any";
  const preselectedBarberName = pickFirst(params.preselectedBarberName) ?? "";

  const [selectedBarberId, setSelectedBarberId] = useState(preselectedBarberId);

  const goNext = () => {
    router.push({
      pathname: "/(tabs)/booking-time",
      params: {
        shopId,
        shopName,
        serviceId,
        barberId: selectedBarberId,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#e5e2e1" />
        </Pressable>
        <Text style={styles.headerTitle}>Elegi barbero</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressActive]} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
      </View>

      <Text style={styles.stepText}>Paso 3 / 6</Text>
      <Text style={styles.shopLabel}>{shopName}</Text>
      {preselectedBarberId !== "barber-any" && preselectedBarberName ? (
        <Text style={styles.preselectedText}>
          Barbero preseleccionado: {preselectedBarberName}
        </Text>
      ) : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {bookingBarbers.map((barber) => {
          const selected = barber.id === selectedBarberId;
          const isAny = barber.id === "barber-any";

          return (
            <Pressable
              key={barber.id}
              style={[styles.barberCard, selected && styles.barberCardSelected]}
              onPress={() => setSelectedBarberId(barber.id)}
            >
              <View style={styles.leftWrap}>
                {isAny ? (
                  <View style={styles.anyIconWrap}>
                    <MaterialIcons name="bolt" size={24} color="#f2ca50" />
                  </View>
                ) : (
                  <Image
                    source={{ uri: barber.image }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                )}

                <View style={styles.textWrap}>
                  <Text style={styles.barberName}>{barber.name}</Text>
                  <Text style={styles.barberSpecialty}>{barber.specialty}</Text>
                  {barber.rating ? (
                    <Text style={styles.ratingText}>
                      {barber.rating} ({barber.reviews} res.)
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={[styles.radio, selected && styles.radioActive]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
            </Pressable>
          );
        })}
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
  shopLabel: {
    color: "#d0c5af",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },
  preselectedText: {
    color: "#f2ca50",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    fontWeight: "600",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 130,
    gap: 12,
  },
  barberCard: {
    minHeight: 84,
    borderRadius: 16,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  barberCardSelected: {
    borderColor: "#d4af37",
  },
  leftWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  anyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#20201f",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  textWrap: {
    flex: 1,
  },
  barberName: {
    color: "#e5e2e1",
    fontSize: 17,
    fontWeight: "700",
  },
  barberSpecialty: {
    marginTop: 2,
    color: "#d0c5af",
    fontSize: 12,
  },
  ratingText: {
    marginTop: 5,
    color: "#f2ca50",
    fontSize: 12,
    fontWeight: "600",
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4d4635",
    alignItems: "center",
    justifyContent: "center",
  },
  radioActive: {
    borderColor: "#f2ca50",
    backgroundColor: "rgba(242, 202, 80, 0.08)",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f2ca50",
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
