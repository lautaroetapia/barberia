import { MaterialIcons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient"; // Asegúrate de tener expo-linear-gradient
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    formatPrice,
    getPublicBarbershopById,
    getShopServices,
} from "@/lib/booking-catalog";
import { getOwnedBarbershopProfile } from "@/lib/owned-barbershop";

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
  const [resolvedShopId, setResolvedShopId] = useState(shopId);
  const [shopName, setShopName] = useState(
    pickFirst(params.shopName) ?? "Barbería",
  );
  const preselectedBarberId = pickFirst(params.preselectedBarberId) ?? "";
  const preselectedBarberName = pickFirst(params.preselectedBarberName) ?? "";

  const [services, setServices] = useState(
    [] as Awaited<ReturnType<typeof getShopServices>>,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const resolveShopId = async () => {
      if (!shopId.startsWith("owned-")) {
        setResolvedShopId(shopId);
        return;
      }

      const ownedShop = await getOwnedBarbershopProfile();
      if (!isMounted) {
        return;
      }

      setResolvedShopId(ownedShop?.id ?? shopId);
    };

    void resolveShopId();

    return () => {
      isMounted = false;
    };
  }, [shopId]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      const [shop, items] = await Promise.all([
        getPublicBarbershopById(resolvedShopId),
        getShopServices(resolvedShopId),
      ]);

      if (!isMounted) {
        return;
      }

      if (shop?.name) {
        setShopName(shop.name);
      }

      setServices(items);
      setSelectedServiceId((current) => current ?? items[0]?.id ?? null);
      setIsLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [resolvedShopId]);

  const selectedService = useMemo(
    () => services.find((item) => item.id === selectedServiceId) ?? services[0],
    [selectedServiceId, services],
  );

  const goNext = () => {
    if (!selectedService) return;
    router.push({
      pathname: "/(tabs)/booking-barber",
      params: {
        shopId: resolvedShopId,
        shopName,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceDuration: String(selectedService.durationMinutes),
        preselectedBarberId,
        preselectedBarberName,
      },
    });
  };

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-backspace" size={26} color="#D4AF37" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Servicios</Text>
          <View style={styles.shopIndicator}>
            <MaterialIcons name="location-on" size={10} color="#888" />
            <Text style={styles.shopLabel}>{shopName}</Text>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* PROGRESS BAR */}
      <View style={styles.progressSection}>
        <View style={styles.progressContainer}>
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <View
              key={step}
              style={[
                styles.progressStep,
                step < 2 && styles.progressDone,
                step === 2 && styles.progressActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepIndicatorText}>
          PASO 02 <Text style={{ color: "#444" }}>/ 06</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>¿Qué tratamiento deseas hoy?</Text>

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#D4AF37" />
            <Text style={styles.emptyText}>
              Cargando servicios desde Supabase...
            </Text>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="content-cut" size={34} color="#333" />
            <Text style={styles.emptyText}>
              Todavía no hay servicios activos para esta barbería.
            </Text>
          </View>
        ) : (
          services.map((service) => {
            const isSelected = service.id === selectedServiceId;
            return (
              <Pressable
                key={service.id}
                style={[
                  styles.serviceCard,
                  isSelected && styles.serviceCardSelected,
                ]}
                onPress={() => setSelectedServiceId(service.id)}
              >
                <ImageBackground
                  source={{ uri: service.imageUrl }}
                  style={styles.serviceImage}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.95)"]}
                    style={styles.gradient}
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.infoArea}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <View style={styles.metaRow}>
                        <MaterialIcons
                          name="schedule"
                          size={12}
                          color="#D4AF37"
                        />
                        <Text style={styles.serviceMeta}>
                          {service.duration}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.selectionArea}>
                      <Text style={styles.servicePrice}>
                        {formatPrice(service.price)}
                      </Text>
                      <View
                        style={[
                          styles.customRadio,
                          isSelected && styles.customRadioActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Seleccionado:</Text>
          <Text style={styles.summaryValue}>
            {selectedService?.name ?? "Sin selección"}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={goNext}
          disabled={!selectedService}
        >
          <Text style={styles.nextButtonText}>Continuar</Text>
          <MaterialIcons name="chevron-right" size={24} color="#000" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0A0A0A" },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerCenter: { alignItems: "center" },
  backButton: { width: 40, height: 40, justifyContent: "center" },
  headerTitle: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerSpacer: { width: 40 },
  shopIndicator: { flexDirection: "row", alignItems: "center", gap: 4 },
  shopLabel: { color: "#666", fontSize: 11, fontWeight: "600" },

  progressSection: {
    paddingHorizontal: 25,
    marginTop: 10,
    alignItems: "center",
  },
  progressContainer: { flexDirection: "row", gap: 6, width: "100%" },
  progressStep: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#222",
  },
  progressDone: { backgroundColor: "rgba(212, 175, 55, 0.4)" },
  progressActive: { backgroundColor: "#D4AF37" },
  stepIndicatorText: {
    color: "#D4AF37",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 8,
    letterSpacing: 1,
  },

  sectionTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
    marginHorizontal: 25,
    marginTop: 25,
    marginBottom: 15,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 160 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
    fontSize: 13,
    maxWidth: 260,
  },

  serviceCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1A1A1A",
    backgroundColor: "#111",
  },
  serviceCardSelected: { borderColor: "#D4AF37" },
  serviceImage: { minHeight: 180, justifyContent: "flex-end" },
  gradient: { ...StyleSheet.absoluteFillObject },

  cardContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 20,
  },
  infoArea: { flex: 1 },
  serviceName: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  serviceMeta: { color: "#D4AF37", fontSize: 12, fontWeight: "700" },

  selectionArea: { alignItems: "flex-end", gap: 12 },
  servicePrice: { color: "#FFF", fontSize: 20, fontWeight: "900" },

  customRadio: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  customRadioActive: { borderColor: "#D4AF37" },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#D4AF37",
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "#0A0A0A",
    borderTopWidth: 1,
    borderColor: "#1A1A1A",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 15,
  },
  summaryLabel: { color: "#555", fontSize: 13, fontWeight: "600" },
  summaryValue: { color: "#D4AF37", fontSize: 13, fontWeight: "800" },
  nextButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  nextButtonText: {
    color: "#000",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
