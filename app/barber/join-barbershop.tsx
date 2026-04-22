import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    getFeaturedBarbers,
    getPublicBarbershops,
} from "@/lib/booking-catalog";
import {
    getCurrentUserPendingJoinRequestShopIds,
    submitJoinRequestByInvitationCode,
    submitJoinRequestForShop,
} from "@/lib/join-barbershop";

type BarberShopResult = Awaited<
  ReturnType<typeof getPublicBarbershops>
>[number];
type BarberResult = Awaited<ReturnType<typeof getFeaturedBarbers>>[number];

export default function JoinBarbershopScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [shops, setShops] = useState<BarberShopResult[]>([]);
  const [barbers, setBarbers] = useState<BarberResult[]>([]);
  const [pendingShopIds, setPendingShopIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [submittingShopId, setSubmittingShopId] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsLoading(true);

      try {
        const [publicShops, featuredBarbers] = await Promise.all([
          getPublicBarbershops(),
          getFeaturedBarbers(),
        ]);

        if (!isMounted) {
          return;
        }

        setShops(publicShops);
        setBarbers(featuredBarbers);

        const pending = await getCurrentUserPendingJoinRequestShopIds();
        if (isMounted) {
          setPendingShopIds(pending);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredShops = useMemo(() => {
    if (!normalizedQuery) {
      return shops;
    }

    return shops.filter((shop) =>
      [shop.name, shop.address]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery, shops]);

  const filteredBarbers = useMemo(() => {
    if (!normalizedQuery) {
      return barbers;
    }

    return barbers.filter((barber) =>
      [barber.name, barber.specialty, barber.shopName]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [normalizedQuery, barbers]);

  const handleInviteCodeSubmit = async () => {
    if (!invitationCode.trim() || isSubmittingCode) {
      return;
    }

    setIsSubmittingCode(true);
    try {
      const result = await submitJoinRequestByInvitationCode(invitationCode);
      setInvitationCode("");
      setPendingShopIds((current) =>
        current.includes(result.barbershopId)
          ? current
          : [...current, result.barbershopId],
      );

      Alert.alert(
        "Solicitud enviada",
        result.alreadyApproved
          ? "Ya formas parte de esta barbería."
          : result.alreadyPending
            ? "Ya tenías una solicitud pendiente para esta barbería."
            : "Tu solicitud fue enviada correctamente.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo verificar el código.";
      Alert.alert("Error", message);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleRequestJoinShop = async (shopId: string) => {
    if (!shopId || submittingShopId) {
      return;
    }

    setSubmittingShopId(shopId);
    try {
      const result = await submitJoinRequestForShop(shopId);
      setPendingShopIds((current) =>
        current.includes(result.barbershopId)
          ? current
          : [...current, result.barbershopId],
      );

      Alert.alert(
        "Solicitud enviada",
        result.alreadyApproved
          ? "Ya formas parte de esta barbería."
          : result.alreadyPending
            ? "Ya tenías una solicitud pendiente para esta barbería."
            : "Tu solicitud para unirte fue enviada al dueño.",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo enviar la solicitud.";
      Alert.alert("Error", message);
    } finally {
      setSubmittingShopId("");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Unirse a Barbería</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.promoCard}>
          <View style={styles.cardHeader}>
            <Feather name="zap" size={20} color="#d4af37" />
            <Text style={styles.sectionTitle}>Acceso rápido</Text>
          </View>
          <Text style={styles.sectionText}>
            Si el dueño te proporcionó un código de 6 dígitos, ingrésalo aquí.
          </Text>

          <TextInput
            style={styles.codeInput}
            placeholder="CÓDIGO"
            placeholderTextColor="#444"
            autoCapitalize="characters"
            maxLength={6}
            value={invitationCode}
            onChangeText={setInvitationCode}
          />

          <Pressable
            style={[
              styles.primaryButton,
              (!invitationCode || isSubmittingCode) && styles.buttonDisabled,
            ]}
            onPress={() => void handleInviteCodeSubmit()}
            disabled={!invitationCode || isSubmittingCode}
          >
            <Text style={styles.primaryButtonText}>
              {isSubmittingCode ? "Verificando..." : "Verificar Invitación"}
            </Text>
            {!isSubmittingCode ? (
              <Feather name="arrow-right" size={18} color="#241a00" />
            ) : null}
          </Pressable>
        </View>

        <View style={styles.searchSection}>
          <Text style={styles.sectionTitleSmall}>O busca manualmente</Text>

          <View style={styles.searchWrapper}>
            <Feather
              name="search"
              size={18}
              color="#7b7466"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Nombre, dirección o perfil..."
              placeholderTextColor="#555"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.resultsList}>
            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color="#d4af37" />
                <Text style={styles.emptyText}>
                  Cargando datos desde Supabase...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitleSmall}>Barberías activas</Text>

                {filteredShops.map((shop) => (
                  <View key={shop.id} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <View style={styles.logoWrap}>
                        <Image
                          source={{ uri: shop.logoUrl }}
                          style={styles.logo}
                          contentFit="cover"
                        />
                      </View>
                      <View style={styles.resultTextWrap}>
                        <Text style={styles.resultName}>{shop.name}</Text>
                        <View style={styles.addressRow}>
                          <Feather name="map-pin" size={12} color="#7b7466" />
                          <Text style={styles.resultAddress}>
                            {shop.address}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <Feather name="star" size={12} color="#d4af37" />
                        <Text style={styles.metaText}>
                          {shop.rating} ({shop.reviews})
                        </Text>
                      </View>
                      {shop.verified && (
                        <View style={styles.metaPill}>
                          <Feather
                            name="check-circle"
                            size={12}
                            color="#d4af37"
                          />
                          <Text style={styles.metaText}>Verificada</Text>
                        </View>
                      )}
                    </View>

                    <Pressable
                      style={[
                        styles.secondaryButton,
                        pendingShopIds.includes(shop.id) &&
                          styles.requestButtonDisabled,
                      ]}
                      onPress={() => void handleRequestJoinShop(shop.id)}
                      disabled={
                        pendingShopIds.includes(shop.id) ||
                        submittingShopId === shop.id
                      }
                    >
                      <Text style={styles.secondaryButtonText}>
                        {submittingShopId === shop.id
                          ? "Enviando..."
                          : pendingShopIds.includes(shop.id)
                            ? "Solicitud enviada"
                            : "Pedir solicitud"}
                      </Text>
                    </Pressable>
                  </View>
                ))}

                <Text style={[styles.sectionTitleSmall, { marginTop: 18 }]}>
                  Barberos destacados
                </Text>

                {filteredBarbers.map((barber) => (
                  <View key={barber.id} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <View style={styles.logoWrap}>
                        <Image
                          source={{ uri: barber.avatarUrl }}
                          style={styles.logo}
                          contentFit="cover"
                        />
                      </View>
                      <View style={styles.resultTextWrap}>
                        <Text style={styles.resultName}>{barber.name}</Text>
                        <View style={styles.addressRow}>
                          <Feather name="scissors" size={12} color="#7b7466" />
                          <Text style={styles.resultAddress}>
                            {barber.specialty}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <Feather name="map-pin" size={12} color="#d4af37" />
                        <Text style={styles.metaText}>{barber.shopName}</Text>
                      </View>
                      {barber.rating ? (
                        <View style={styles.metaPill}>
                          <Feather name="star" size={12} color="#d4af37" />
                          <Text style={styles.metaText}>
                            {barber.rating} ({barber.reviews})
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Pressable
                      style={styles.secondaryButton}
                      onPress={() =>
                        router.push({
                          pathname: "/(tabs)/barber-profile",
                          params: {
                            barberId: barber.id,
                            barberName: barber.name,
                            barberRole: barber.specialty,
                            barberBranch: barber.shopName,
                            barberImage: barber.avatarUrl,
                            shopId: barber.shopId,
                            shopName: barber.shopName,
                          },
                        })
                      }
                    >
                      <Text style={styles.secondaryButtonText}>Ver perfil</Text>
                    </Pressable>
                  </View>
                ))}

                {!filteredShops.length && !filteredBarbers.length && (
                  <View style={styles.emptyCard}>
                    <Feather name="frown" size={32} color="#333" />
                    <Text style={styles.emptyTitle}>Sin resultados</Text>
                    <Text style={styles.emptyText}>
                      No hay barberías ni perfiles que coincidan con tu
                      búsqueda.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0c0c0c" },
  topBar: {
    height: 100,
    paddingTop: 45,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0c0c0c",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#151515",
    borderRadius: 12,
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  promoCard: {
    backgroundColor: "#151515",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  sectionText: {
    color: "#888",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  codeInput: {
    height: 65,
    borderRadius: 16,
    backgroundColor: "#0c0c0c",
    borderWidth: 1,
    borderColor: "#333",
    color: "#d4af37",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 8,
    textAlign: "center",
    marginBottom: 15,
  },
  primaryButton: {
    height: 55,
    borderRadius: 16,
    backgroundColor: "#d4af37",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonDisabled: { backgroundColor: "#333", opacity: 0.5 },
  primaryButtonText: { color: "#1a1a1a", fontSize: 16, fontWeight: "800" },
  searchSection: { flex: 1 },
  sectionTitleSmall: {
    color: "#d4af37",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151515",
    borderRadius: 16,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: {
    flex: 1,
    height: 50,
    color: "#fff",
    fontSize: 15,
  },
  resultsList: { gap: 15 },
  loadingCard: {
    borderRadius: 20,
    backgroundColor: "#151515",
    padding: 18,
    borderWidth: 1,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  resultCard: {
    borderRadius: 20,
    backgroundColor: "#151515",
    padding: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 15,
  },
  logoWrap: {
    width: 50,
    height: 50,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  logo: { width: "100%", height: "100%" },
  resultTextWrap: { flex: 1 },
  resultName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  resultAddress: { color: "#666", fontSize: 13 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#0c0c0c",
    borderWidth: 1,
    borderColor: "#222",
  },
  metaText: { color: "#bbb", fontSize: 12, fontWeight: "600" },
  secondaryButton: {
    height: 45,
    borderRadius: 12,
    backgroundColor: "#0c0c0c",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  requestButtonDisabled: {
    opacity: 0.55,
  },
  secondaryButtonText: { color: "#d4af37", fontSize: 14, fontWeight: "700" },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: { color: "#444", fontSize: 18, fontWeight: "700" },
  emptyText: { color: "#333", fontSize: 14, textAlign: "center" },
});
