import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import {
    getOwnerServices,
    saveOwnerServices,
    type OwnerService,
} from "@/lib/owner-services";

export default function EditServiceScreen() {
  const [services, setServices] = useState<OwnerService[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );
  const [serviceName, setServiceName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [featured, setFeatured] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info" as const,
  });

  // ... (Mantenemos la lógica de funciones idéntica)
  const applyServiceToForm = (service: OwnerService) => {
    setSelectedServiceId(service.id);
    setServiceName(service.serviceName);
    setCategory(service.category);
    setDescription(service.description);
    setPrice(service.price);
    setDuration(service.duration);
    setFeatured(service.featured);
  };

  const clearForm = () => {
    setSelectedServiceId(null);
    setServiceName("");
    setCategory("");
    setDescription("");
    setPrice("");
    setDuration("");
    setFeatured(true);
  };

  useEffect(() => {
    let isMounted = true;
    const loadServices = async () => {
      const storedServices = await getOwnerServices();
      if (!isMounted) return;
      setServices(storedServices);
      if (storedServices[0]) applyServiceToForm(storedServices[0]);
      setIsLoading(false);
    };
    void loadServices();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    if (
      !serviceName.trim() ||
      !category.trim() ||
      !Number(price) ||
      !Number(duration)
    ) {
      setToast({
        visible: true,
        message: "Completa todos los campos",
        type: "error",
      });
      return;
    }
    setIsSaving(true);
    const previousServices = services;

    try {
      const payload: OwnerService = {
        id: selectedServiceId ?? `svc-${Date.now()}`,
        serviceName: serviceName.trim(),
        category: category.trim(),
        description: description.trim(),
        price,
        duration,
        featured,
        active: true,
      };
      const nextServices = selectedServiceId
        ? services.map((item) =>
            item.id === selectedServiceId
              ? { ...payload, active: item.active }
              : item,
          )
        : [...services, payload];

      setServices(nextServices);
      const persisted = await saveOwnerServices(nextServices);
      setServices(persisted);

      if (selectedServiceId) {
        const updated = persisted.find((item) => item.id === selectedServiceId);
        if (updated) {
          applyServiceToForm(updated);
        }
      } else {
        const created = persisted[persisted.length - 1];
        if (created) {
          applyServiceToForm(created);
        }
      }

      setToast({
        visible: true,
        type: "success",
        message: selectedServiceId
          ? "Servicio actualizado"
          : "Servicio agregado",
      });
    } catch {
      setServices(previousServices);
      setToast({
        visible: true,
        message: "No se pudo guardar en Supabase. Reintenta.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleServiceActive = async (id: string) => {
    if (isSaving) return;
    setIsSaving(true);
    const previousServices = services;
    const nextServices = services.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item,
    );
    setServices(nextServices);

    try {
      const persisted = await saveOwnerServices(nextServices);
      setServices(persisted);
      const selected = persisted.find((item) => item.id === selectedServiceId);
      if (selected) {
        applyServiceToForm(selected);
      }
      setToast({
        visible: true,
        message: "Estado actualizado",
        type: "success",
      });
    } catch {
      setServices(previousServices);
      setToast({
        visible: true,
        message: "No se pudo actualizar el estado en Supabase.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="#d4af37" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>SERVICIOS</Text>
          <Text style={styles.headerSubtitle}>Catálogo del local</Text>
        </View>
        <Pressable style={styles.newButtonHeader} onPress={clearForm}>
          <Feather name="plus" size={24} color="#f2ca50" />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>Tus servicios actuales</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
          >
            {services.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.miniCard,
                  selectedServiceId === item.id && styles.miniCardActive,
                ]}
                onPress={() => applyServiceToForm(item)}
              >
                <View
                  style={item.active ? styles.dotActive : styles.dotInactive}
                />
                <Text
                  style={[
                    styles.miniCardName,
                    selectedServiceId === item.id && styles.activeText,
                  ]}
                  numberOfLines={1}
                >
                  {item.serviceName}
                </Text>
              </Pressable>
            ))}
            {services.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No hay servicios registrados
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Feather
                name={selectedServiceId ? "edit-3" : "plus-circle"}
                size={20}
                color="#d4af37"
              />
              <Text style={styles.formTitle}>
                {selectedServiceId ? "Editar Detalles" : "Nuevo Servicio"}
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Nombre del servicio</Text>
              <TextInput
                value={serviceName}
                onChangeText={setServiceName}
                style={styles.input}
                placeholder="Ej: Corte + Barba Premium"
                placeholderTextColor="#444"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Categoría</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                style={styles.input}
                placeholder="Ej: Combos, Barba..."
                placeholderTextColor="#444"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Precio</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefix}>$</Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    style={[styles.input, { paddingLeft: 35 }]}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={[styles.field, styles.half]}>
                <Text style={styles.label}>Duración</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="clock"
                    size={14}
                    color="#d4af37"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    value={duration}
                    onChangeText={setDuration}
                    style={[styles.input, { paddingLeft: 35 }]}
                    keyboardType="numeric"
                    placeholder="min"
                    placeholderTextColor="#444"
                  />
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Descripción pública</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={[styles.input, styles.multiline]}
                multiline
                numberOfLines={3}
                placeholder="Describe qué incluye el servicio para tus clientes..."
                placeholderTextColor="#444"
              />
            </View>

            <View style={styles.toggleCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>Destacar</Text>
                <Text style={styles.toggleText}>
                  Sugerir este servicio primero
                </Text>
              </View>
              <Switch
                value={featured}
                onValueChange={setFeatured}
                trackColor={{ true: "#d4af37", false: "#222" }}
                thumbColor="#fff"
              />
            </View>

            {selectedServiceId && (
              <Pressable
                style={styles.deleteButton}
                onPress={() => toggleServiceActive(selectedServiceId)}
              >
                <Feather
                  name={
                    services.find((s) => s.id === selectedServiceId)?.active
                      ? "eye-off"
                      : "eye"
                  }
                  size={16}
                  color="#666"
                />
                <Text style={styles.deleteText}>
                  {services.find((s) => s.id === selectedServiceId)?.active
                    ? "Desactivar de la lista"
                    : "Activar servicio"}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.saveButton,
            (isSaving || isLoading) && styles.saveButtonDisabled,
          ]}
          disabled={isSaving || isLoading}
          onPress={() => void handleSave()}
        >
          <Text style={styles.saveText}>
            {isSaving ? "Guardando..." : "Confirmar Cambios"}
          </Text>
        </Pressable>
      </View>

      <BarberRoleNav mode="owner" current="servicios" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080808" },
  header: {
    height: 110,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  headerSubtitle: { color: "#555", fontSize: 12, marginTop: -2 },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  newButtonHeader: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  content: { paddingHorizontal: 20, paddingBottom: 180 },

  sectionLabel: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 15,
    letterSpacing: 1,
  },
  horizontalScroll: { marginBottom: 25 },
  miniCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#111",
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  miniCardActive: { borderColor: "#d4af37", backgroundColor: "#1a1608" },
  miniCardName: { color: "#555", fontSize: 14, fontWeight: "700" },
  activeText: { color: "#fff" },
  dotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F44336",
  },

  formCard: {
    backgroundColor: "#111",
    borderRadius: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 25,
  },
  formTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  field: { marginBottom: 20 },
  label: {
    color: "#444",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: { position: "relative", justifyContent: "center" },
  inputPrefix: {
    position: "absolute",
    left: 15,
    zIndex: 1,
    color: "#d4af37",
    fontWeight: "800",
    fontSize: 16,
  },
  inputIcon: { position: "absolute", left: 12, zIndex: 1 },
  input: {
    backgroundColor: "#080808",
    borderRadius: 15,
    color: "#fff",
    fontSize: 15,
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  multiline: { minHeight: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 15 },
  half: { flex: 1 },

  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#080808",
    padding: 16,
    borderRadius: 18,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  toggleTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  toggleText: { color: "#444", fontSize: 12, marginTop: 2 },

  deleteButton: {
    marginTop: 20,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteText: { color: "#555", fontSize: 13, fontWeight: "600" },

  footer: {
    position: "absolute",
    bottom: 90,
    left: 20,
    right: 20,
  },
  saveButton: {
    height: 65,
    borderRadius: 20,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  saveButtonDisabled: { backgroundColor: "#222", shadowOpacity: 0 },
  saveText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyContainer: { paddingVertical: 10 },
  emptyText: { color: "#333", fontSize: 14, fontStyle: "italic" },
});
