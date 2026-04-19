import { MaterialIcons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { bookingServices } from "@/constants/booking-flow";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function BookingServiceScreen() {
  const params = useLocalSearchParams<{
    shopId?: string;
    shopName?: string;
    preselectedBarberId?: string;
    preselectedBarberName?: string;
  }>();

  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? "Atelier Palermo";
  const preselectedBarberId = pickFirst(params.preselectedBarberId) ?? "";
  const preselectedBarberName = pickFirst(params.preselectedBarberName) ?? "";

  const [selectedServiceId, setSelectedServiceId] = useState(
    bookingServices[0].id,
  );

  const selectedService = useMemo(
    () => bookingServices.find((item) => item.id === selectedServiceId),
    [selectedServiceId],
  );

  const goNext = () => {
    if (!selectedService) {
      return;
    }

    router.push({
      pathname: "/(tabs)/booking-barber",
      params: {
        shopId,
        shopName,
        serviceId: selectedService.id,
        preselectedBarberId,
        preselectedBarberName,
      },
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={22} color="#e5e2e1" />
        </Pressable>
        <Text style={styles.headerTitle}>Elegi servicio</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressStep, styles.progressDone]} />
        <View style={[styles.progressStep, styles.progressActive]} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
      </View>

      <Text style={styles.stepText}>Paso 2 / 6</Text>
      <Text style={styles.shopLabel}>{shopName}</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {bookingServices.map((service) => {
          const selected = service.id === selectedServiceId;
          return (
            <Pressable
              key={service.id}
              style={[
                styles.serviceCard,
                selected && styles.serviceCardSelected,
              ]}
              onPress={() => setSelectedServiceId(service.id)}
            >
              <ImageBackground
                source={{ uri: service.image }}
                style={styles.serviceImage}
              >
                <View style={styles.imageOverlay} />
                <View style={styles.cardContent}>
                  <View>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceMeta}>{service.duration}</Text>
                  </View>

                  <View style={styles.rightWrap}>
                    <Text style={styles.servicePrice}>{service.price}</Text>
                    <View
                      style={[styles.radio, selected && styles.radioActive]}
                    >
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </View>
                </View>
              </ImageBackground>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 130,
    gap: 14,
  },
  serviceCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.24)",
  },
  serviceCardSelected: {
    borderColor: "#d4af37",
  },
  serviceImage: {
    minHeight: 170,
    justifyContent: "flex-end",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(19, 19, 19, 0.72)",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 16,
  },
  serviceName: {
    color: "#e5e2e1",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  serviceMeta: {
    color: "#d0c5af",
    fontSize: 13,
  },
  rightWrap: {
    alignItems: "flex-end",
    gap: 10,
  },
  servicePrice: {
    color: "#f2ca50",
    fontSize: 22,
    fontWeight: "800",
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
