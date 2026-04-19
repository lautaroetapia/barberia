import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View
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
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

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
      if (!isMounted) {
        return;
      }

      setServices(storedServices);
      if (storedServices[0]) {
        applyServiceToForm(storedServices[0]);
      }
      setIsLoading(false);
    };

    void loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    if (!serviceName.trim() || !category.trim()) {
      setToast({
        visible: true,
        message: "Nombre y categoria son obligatorios",
        type: "error",
      });
      return;
    }

    if (!Number(price) || !Number(duration)) {
      setToast({
        visible: true,
        message: "Precio y duracion deben ser numericos",
        type: "error",
      });
      return;
    }

    setIsSaving(true);

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
            ? {
                ...payload,
                active: item.active,
              }
            : item,
        )
      : [...services, payload];

    setServices(nextServices);
    await saveOwnerServices(nextServices);

    setToast({
      visible: true,
      type: "success",
      message: selectedServiceId ? "Servicio actualizado" : "Servicio agregado",
    });

    if (!selectedServiceId) {
      applyServiceToForm(payload);
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedServiceId || isSaving) {
      return;
    }

    setIsSaving(true);

    const nextServices = services.filter(
      (item) => item.id !== selectedServiceId,
    );
    setServices(nextServices);
    await saveOwnerServices(nextServices);

    if (nextServices[0]) {
      applyServiceToForm(nextServices[0]);
    } else {
      clearForm();
    }

    setToast({ visible: true, message: "Servicio eliminado", type: "info" });
    setIsSaving(false);
  };

  const toggleServiceActive = async (id: string) => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    const nextServices = services.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item,
    );
    setServices(nextServices);
    await saveOwnerServices(nextServices);

    const changed = nextServices.find((item) => item.id === id);
    setToast({
      visible: true,
      message: `${changed?.serviceName ?? "Servicio"} ${changed?.active ? "activo" : "inactivo"}`,
      type: "success",
    });
    setIsSaving(false);
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#e5e2e1" />
        </Pressable>
        <Text style={styles.headerTitle}>Editar Servicio</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.servicesHeader}>
          <Text style={styles.sectionTitle}>Servicios</Text>
          <Pressable style={styles.newButton} onPress={clearForm}>
            <MaterialIcons name="add" size={16} color="#f2ca50" />
            <Text style={styles.newButtonText}>Nuevo</Text>
          </Pressable>
        </View>

        {services.map((item) => (
          <Pressable
            key={item.id}
            style={[
              styles.serviceCard,
              selectedServiceId === item.id && styles.serviceCardActive,
            ]}
            disabled={isSaving}
            onPress={() => applyServiceToForm(item)}
          >
            <View style={styles.serviceCardBody}>
              <Text style={styles.serviceCardName}>{item.serviceName}</Text>
              <Text style={styles.serviceCardMeta}>
                {item.duration} min · ${item.price}
              </Text>
            </View>
            <Pressable
              style={item.active ? styles.chipOn : styles.chipOff}
              disabled={isSaving}
              onPress={() => {
                void toggleServiceActive(item.id);
              }}
            >
              <Text
                style={item.active ? styles.chipOnText : styles.chipOffText}
              >
                {item.active ? "Activo" : "Inactivo"}
              </Text>
            </Pressable>
          </Pressable>
        ))}

        {isLoading ? (
          <Text style={styles.emptyText}>Cargando servicios...</Text>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Nombre del servicio</Text>
          <TextInput
            value={serviceName}
            onChangeText={setServiceName}
            style={styles.input}
            placeholderTextColor="#777"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Categoria</Text>
          <TextInput
            value={category}
            onChangeText={setCategory}
            style={styles.input}
            placeholderTextColor="#777"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Descripcion corta</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[styles.input, styles.multiline]}
            multiline
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Precio</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, styles.half]}>
            <Text style={styles.label}>Duracion (min)</Text>
            <TextInput
              value={duration}
              onChangeText={setDuration}
              style={styles.input}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.toggleCard}>
          <View>
            <Text style={styles.toggleTitle}>Servicio destacado</Text>
            <Text style={styles.toggleText}>Mostrar en pantalla principal</Text>
          </View>
          <Switch
            value={featured}
            onValueChange={setFeatured}
            trackColor={{ true: "#d4af37", false: "#4d4635" }}
            thumbColor="#fff"
          />
        </View>

        {selectedServiceId ? (
          <Pressable
            style={styles.deleteButton}
            onPress={() => void handleDelete()}
          >
            <MaterialIcons name="delete-outline" size={18} color="#ffb4ab" />
            <Text style={styles.deleteText}>Eliminar servicio</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.saveButton,
            (isSaving || isLoading) && styles.saveButtonDisabled,
          ]}
          disabled={isSaving || isLoading}
          onPress={() => {
            void handleSave();
          }}
        >
          <Text style={styles.saveText}>
            {isSaving ? "Guardando..." : "Guardar cambios"}
          </Text>
        </Pressable>
      </View>

      <BarberRoleNav mode="owner" current="servicios" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#e5e2e1", fontSize: 20, fontWeight: "800" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 190,
    gap: 16,
  },
  servicesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: "#e5e2e1", fontSize: 20, fontWeight: "700" },
  newButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    backgroundColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  newButtonText: { color: "#f2ca50", fontSize: 12, fontWeight: "700" },
  serviceCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  serviceCardActive: {
    borderColor: "rgba(212,175,55,0.45)",
  },
  serviceCardBody: { flex: 1 },
  serviceCardName: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  serviceCardMeta: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  chipOn: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: "rgba(212,175,55,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipOnText: { color: "#f2ca50", fontSize: 11, fontWeight: "700" },
  chipOff: {
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    backgroundColor: "rgba(77,70,53,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipOffText: { color: "#99907c", fontSize: 11, fontWeight: "700" },
  emptyText: { color: "#99907c", fontSize: 12, textAlign: "center" },
  field: { gap: 8 },
  label: {
    color: "#d0c5af",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#4d4635",
    color: "#e5e2e1",
    fontSize: 16,
    paddingHorizontal: 0,
    paddingVertical: 8,
  },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  toggleCard: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleTitle: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  toggleText: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  deleteButton: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.35)",
    backgroundColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deleteText: { color: "#ffb4ab", fontSize: 13, fontWeight: "700" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 74,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
    backgroundColor: "rgba(14,14,14,0.96)",
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveText: {
    color: "#3c2f00",
    fontSize: 17,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
