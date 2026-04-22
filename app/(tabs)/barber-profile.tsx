import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, SafeAreaView } from "react-native";
import { getFavoriteBarbers, toggleFavoriteBarber } from "@/lib/favorites";

const pickFirst = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function ClientBarberProfileScreen() {
  const params = useLocalSearchParams<{
    barberId?: string;
    barberName?: string;
    barberRole?: string;
    barberBranch?: string;
    barberImage?: string;
    shopId?: string;
    shopName?: string;
  }>();

  const barberId = pickFirst(params.barberId) ?? "barber-any";
  const barberName = pickFirst(params.barberName) ?? "Barbero";
  const barberRole = pickFirst(params.barberRole) ?? "Especialista";
  const barberBranch = pickFirst(params.barberBranch) ?? "Atelier";
  const barberImage = pickFirst(params.barberImage) ?? "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=800&auto=format&fit=crop";
  const shopId = pickFirst(params.shopId) ?? "shop-1";
  const shopName = pickFirst(params.shopName) ?? barberBranch;
  
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadFavoriteState = async () => {
      const favorites = await getFavoriteBarbers();
      if (isMounted) {
        setIsFavorite(favorites.some((item) => item.id === barberId));
      }
    };
    loadFavoriteState();
    return () => { isMounted = false; };
  }, [barberId]);

  return (
    <SafeAreaView style={styles.screen}>
      {/* HEADER MINIMALISTA */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="keyboard-backspace" size={28} color="#D4AF37" />
        </Pressable>
        <Text style={styles.headerTitle}>Perfil Maestro</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO CARD PREMIUM */}
        <View style={styles.heroContainer}>
          <View style={styles.avatarOutline}>
            <Image source={{ uri: barberImage }} style={styles.avatar} contentFit="cover" />
          </View>
          <Text style={styles.name}>{barberName}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{barberRole.toUpperCase()}</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={16} color="#D4AF37" />
              <Text style={styles.statText}>4.9 (120)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MaterialIcons name="location-on" size={16} color="#D4AF37" />
              <Text style={styles.statText}>{barberBranch}</Text>
            </View>
          </View>
        </View>

        {/* ESPECIALIDADES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especialidades</Text>
          <View style={styles.chipsWrap}>
            {["Skin Fade", "Perfilado de Barba", "Hot Towel Shave"].map((spec) => (
              <View key={spec} style={styles.chip}>
                <Text style={styles.chipText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* BIOGRAFÍA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sobre su técnica</Text>
          <Text style={styles.bioText}>
            Especialista en acabados de alta precisión. Con más de 8 años de experiencia, 
            combina técnicas tradicionales con las últimas tendencias de la industria.
          </Text>
        </View>
      </ScrollView>

      {/* FOOTER ACCIONES */}
      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Pressable
            style={[styles.favAction, isFavorite && styles.favActionActive]}
            onPress={() => {
              void toggleFavoriteBarber({
                id: barberId, name: barberName, role: barberRole,
                branch: barberBranch, image: barberImage, shopId,
              }).then((result) => setIsFavorite(result.isFavorite));
            }}
          >
            <MaterialIcons
              name={isFavorite ? "favorite" : "favorite-border"}
              size={24}
              color={isFavorite ? "#000" : "#D4AF37"}
            />
          </Pressable>

          <Pressable
            style={styles.reserveButton}
            onPress={() => router.push({
              pathname: "/(tabs)/booking-service",
              params: { shopId, shopName, preselectedBarberId: barberId, preselectedBarberName: barberName },
            })}
          >
            <Text style={styles.reserveButtonText}>Reservar Cita</Text>
            <MaterialIcons name="event-available" size={20} color="#000" />
          </Pressable>
        </View>
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
  backButton: { width: 44, height: 44, justifyContent: "center" },
  headerTitle: { color: "#FFF", fontSize: 16, fontWeight: "900", letterSpacing: 2, textTransform: "uppercase" },
  headerSpacer: { width: 44 },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 140 },

  heroContainer: {
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 20,
  },
  avatarOutline: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: "#D4AF37",
    padding: 4,
    marginBottom: 16,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 50 },
  name: { color: "#FFF", fontSize: 28, fontWeight: "900", marginBottom: 6 },
  badge: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.3)",
    marginBottom: 16,
  },
  badgeText: { color: "#D4AF37", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 15 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { color: "#888", fontSize: 14, fontWeight: "600" },
  statDivider: { width: 1, height: 12, backgroundColor: "#333" },

  section: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1A1A1A",
  },
  sectionTitle: { color: "#FFF", fontSize: 16, fontWeight: "800", marginBottom: 15 },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  chipText: { color: "#BBB", fontSize: 13, fontWeight: "600" },
  bioText: { color: "#888", fontSize: 14, lineHeight: 22 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,10,10,0.95)",
    paddingTop: 15,
    paddingBottom: 35,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: "#222",
  },
  footerRow: { flexDirection: "row", gap: 12 },
  favAction: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
  },
  favActionActive: { backgroundColor: "#D4AF37" },
  reserveButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#D4AF37",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  reserveButtonText: { color: "#000", fontSize: 16, fontWeight: "900" },
});