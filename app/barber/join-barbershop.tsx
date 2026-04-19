import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

const results = [
  ["The Gentlemen Cut", "Av. del Libertador 1234"],
  ["Obsidian Grooming", "Palermo Soho 456"],
] as const;

export default function JoinBarbershopScreen() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return results;
    }

    return results.filter(
      (item) =>
        item[0].toLowerCase().includes(normalizedQuery) ||
        item[1].toLowerCase().includes(normalizedQuery),
    );
  }, [searchQuery]);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#d0c5af" />
        </Pressable>
        <Text style={styles.brand}>Unirse a barberia</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tengo un codigo</Text>
          <Text style={styles.sectionText}>
            Ingresa el codigo de 6 digitos que te dio el dueno.
          </Text>
          <TextInput
            style={styles.codeInput}
            placeholder="Ej: 1A2B3C"
            placeholderTextColor="#7b7466"
            autoCapitalize="characters"
            maxLength={6}
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/barber/barber-profile")}
          >
            <Text style={styles.primaryButtonText}>Verificar codigo</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Buscar barberia</Text>
          <Text style={styles.sectionText}>
            Busca por nombre o direccion si no tienes codigo.
          </Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Nombre o direccion..."
            placeholderTextColor="#7b7466"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {filteredResults.map((item) => (
            <View key={item[0]} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.logoWrap}>
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4yuAMp0pMEI538VRGlkzegrHiG0NvmBsCO5Ayv3VuA4dLXqkwOMX6UF48KsY57U1YBANQKc7VoDCS5WvoG16AogFgsyq9P_KL_9zkOWo8tUvy3vXvmRjdWH_zKiEgSHvzjBBfXKfTyOzOsRMXZadSbVNUU3b7kFi75R9pF_TPIL38Kt51DROliWkCEDoWuBnazsevENFZW67LnpL9DRSyZ3MHv07Lw6TXXPCij0Y2GsX4uY9jUB74QscVHQhra2XFzLdAQojYkFGh",
                    }}
                    style={styles.logo}
                    contentFit="cover"
                  />
                </View>
                <View style={styles.resultTextWrap}>
                  <Text style={styles.resultName}>{item[0]}</Text>
                  <Text style={styles.resultAddress}>{item[1]}</Text>
                </View>
              </View>

              <Pressable
                style={styles.secondaryButton}
                onPress={() => router.replace("/barber/barber-profile")}
              >
                <Text style={styles.secondaryButtonText}>Solicitar unirme</Text>
              </Pressable>
            </View>
          ))}

          {!filteredResults.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No encontramos barberias</Text>
              <Text style={styles.emptyText}>Intenta con otra busqueda.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  topBar: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(19,19,19,0.9)",
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#e5e2e1", fontSize: 20, fontWeight: "800" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 22,
  },
  section: { gap: 10 },
  sectionTitle: { color: "#e5e2e1", fontSize: 26, fontWeight: "800" },
  sectionText: { color: "#d0c5af", fontSize: 13, lineHeight: 20 },
  codeInput: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#0e0e0e",
    borderBottomWidth: 2,
    borderBottomColor: "#4d4635",
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 6,
    textAlign: "center",
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#241a00", fontSize: 15, fontWeight: "800" },
  searchInput: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    color: "#e5e2e1",
    fontSize: 14,
    paddingHorizontal: 14,
  },
  resultCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 12,
    gap: 10,
  },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#353535",
  },
  logo: { width: "100%", height: "100%" },
  resultTextWrap: { flex: 1 },
  resultName: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  resultAddress: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  secondaryButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#f2ca50", fontSize: 13, fontWeight: "700" },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    backgroundColor: "#1c1b1b",
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  emptyText: { color: "#d0c5af", fontSize: 12 },
});
