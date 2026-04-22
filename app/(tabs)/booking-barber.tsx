import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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

import { getPublicBarbershopById, getShopBarbers } from "@/lib/booking-catalog";

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
  const [shopName, setShopName] = useState(
    pickFirst(params.shopName) ?? "Barbería",
  );
  const serviceId = pickFirst(params.serviceId) ?? "";
  const serviceName = pickFirst(params.serviceName) ?? "Servicio";
  const serviceDuration = pickFirst(params.serviceDuration) ?? "45";
  const preselectedBarberId =
    pickFirst(params.preselectedBarberId) ?? "barber-any";
  const preselectedBarberName = pickFirst(params.preselectedBarberName) ?? "";

  const [barbers, setBarbers] = useState<
    Awaited<ReturnType<typeof getShopBarbers>>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBarberId, setSelectedBarberId] = useState(preselectedBarberId);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      const [shop, items] = await Promise.all([
        getPublicBarbershopById(shopId),
        getShopBarbers(shopId),
      ]);

      if (!isMounted) {
        return;
      }

      if (shop?.name) {
        setShopName(shop.name);
      }

      setBarbers(items);
      setSelectedBarberId((current) => current || items[0]?.id || "barber-any");
      setIsLoading(false);
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [shopId]);

  const renderedBarbers = useMemo(
    () => [
      {
        id: "barber-any",
        name: "Cualquier profesional",
        specialty: `El primero disponible para ${serviceName.toLowerCase()}`,
        rating: "",
        reviews: "",
        avatarUrl: "",
        colorHex: "#D4AF37",
        shopId,
        shopName,
        userId: "",
      },
      ...barbers,
    ],
    [barbers, serviceName, shopId, shopName],
  );

  const goNext = () => {
    router.push({
      pathname: "/(tabs)/booking-time",
      params: {
        shopId,
        shopName,
        serviceId,
        serviceName,
        serviceDuration,
        barberId: selectedBarberId,
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
          <Text style={styles.headerTitle}>Barberos</Text>
          <Text style={styles.shopLabel}>{shopName}</Text>
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
                step < 3 && styles.progressDone,
                step === 3 && styles.progressActive,
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepIndicatorText}>
          PASO 03 <Text style={{ color: "#444" }}>/ 06</Text>
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Selecciona a tu experto</Text>

        {preselectedBarberId !== "barber-any" && preselectedBarberName && (
          <View style={styles.preselectedBadge}>
            <MaterialIcons name="auto-awesome" size={14} color="#D4AF37" />
            <Text style={styles.preselectedText}>
              Recomendado: {preselectedBarberName}
            </Text>
          </View>
        )}

        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color="#D4AF37" />
            <Text style={styles.emptyText}>
              Cargando barberos desde Supabase...
            </Text>
          </View>
        ) : renderedBarbers.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="person-off" size={34} color="#333" />
            <Text style={styles.emptyText}>
              Todavía no hay barberos activos en esta barbería.
            </Text>
          </View>
        ) : (
          renderedBarbers.map((barber) => {
            const isSelected = barber.id === selectedBarberId;
            const isAny = barber.id === "barber-any";

            return (
              <Pressable
                key={barber.id}
                style={[
                  styles.barberCard,
                  isSelected && styles.barberCardSelected,
                ]}
                onPress={() => setSelectedBarberId(barber.id)}
              >
                <View style={styles.cardInfo}>
                  {isAny ? (
                    <LinearGradient
                      colors={["#2A2A2A", "#1A1A1A"]}
                      style={styles.anyIconWrap}
                    >
                      <MaterialIcons name="bolt" size={26} color="#D4AF37" />
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.avatarBorder,
                        isSelected && { borderColor: "#D4AF37" },
                      ]}
                    >
                      <Image
                        source={{ uri: barber.avatarUrl }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    </View>
                  )}

                  <View style={styles.textWrap}>
                    <Text
                      style={[
                        styles.barberName,
                        isSelected && { color: "#FFF" },
                      ]}
                    >
                      {barber.name}
                    </Text>
                    <Text style={styles.barberSpecialty}>
                      {isAny ? "Disponibilidad inmediata" : barber.specialty}
                    </Text>

                    {!isAny && barber.rating && (
                      <View style={styles.ratingRow}>
                        <MaterialIcons name="star" size={12} color="#D4AF37" />
                        <Text style={styles.ratingValue}>{barber.rating}</Text>
                        <Text style={styles.reviewsText}>
                          ({barber.reviews} res.)
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.customRadio,
                    isSelected && styles.customRadioActive,
                  ]}
                >
                  {isSelected && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.nextButton,
            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
          ]}
          onPress={goNext}
          disabled={isLoading}
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
    marginBottom: 5,
  },
  preselectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 25,
    marginBottom: 15,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  preselectedText: { color: "#D4AF37", fontSize: 11, fontWeight: "700" },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 140 },
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

  barberCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  barberCardSelected: { borderColor: "#D4AF37", backgroundColor: "#161512" },
  cardInfo: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },

  anyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  avatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#222",
    padding: 2,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 26 },

  textWrap: { flex: 1 },
  barberName: { color: "#BBB", fontSize: 17, fontWeight: "800" },
  barberSpecialty: { color: "#666", fontSize: 12, marginTop: 2 },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  ratingValue: { color: "#D4AF37", fontSize: 12, fontWeight: "800" },
  reviewsText: { color: "#444", fontSize: 12 },

  customRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  customRadioActive: { borderColor: "#D4AF37" },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
  nextButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nextButtonText: { color: "#000", fontSize: 18, fontWeight: "900" },
});
