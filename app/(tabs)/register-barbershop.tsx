import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { setStoredActiveRole } from "@/lib/active-role";
import { saveOwnedBarbershopProfile } from "@/lib/owned-barbershop";

export default function RegisterBarbershopScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const nextErrors = {
      name: "",
      address: "",
      phone: "",
    };

    if (!name.trim()) {
      nextErrors.name = "Ingresa el nombre de tu barberia.";
    }

    if (!address.trim()) {
      nextErrors.address = "Ingresa la direccion principal.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Ingresa un telefono de contacto.";
    }

    return nextErrors;
  }, [address, name, phone]);

  const hasErrors = Boolean(errors.name || errors.address || errors.phone);

  const handlePickImage = async () => {
    if (isPickingImage || isSaving) {
      return;
    }

    setIsPickingImage(true);

    try {
      const permissionResponse =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResponse.granted) {
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets.length) {
        return;
      }

      setImageUri(result.assets[0]?.uri ?? "");
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSubmit = async () => {
    setTouched(true);

    if (hasErrors || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await saveOwnedBarbershopProfile({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        description: description.trim(),
        imageUri,
      });

      await setStoredActiveRole("dueno");
      router.replace("/(tabs)/register-barbershop-success");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#d0c5af" />
        </Pressable>
        <Text style={styles.brand}>Registrar barberia</Text>
        <View style={styles.spacer} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardWrap}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Crea tu barberia</Text>
            <Text style={styles.heroText}>
              Completa los datos basicos para habilitar tu perfil de dueno.
            </Text>
          </View>

          <View style={styles.imageSection}>
            <Text style={styles.label}>Logo o foto de la barberia</Text>

            <Pressable
              style={styles.imagePickerButton}
              onPress={() => void handlePickImage()}
            >
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons name="storefront" size={28} color="#d0c5af" />
                  <Text style={styles.imagePlaceholderTitle}>
                    Agregar imagen
                  </Text>
                  <Text style={styles.imagePlaceholderText}>
                    Se usara como portada de tu barberia.
                  </Text>
                </View>
              )}
            </Pressable>

            <View style={styles.imageActionsRow}>
              <Pressable
                style={styles.imageActionButton}
                onPress={() => void handlePickImage()}
                disabled={isPickingImage || isSaving}
              >
                <MaterialIcons name="photo-library" size={16} color="#f2ca50" />
                <Text style={styles.imageActionText}>
                  {isPickingImage
                    ? "Abriendo galeria..."
                    : imageUri
                      ? "Cambiar imagen"
                      : "Elegir imagen"}
                </Text>
              </Pressable>

              {imageUri ? (
                <Pressable
                  style={styles.imageRemoveButton}
                  onPress={() => setImageUri("")}
                  disabled={isSaving}
                >
                  <MaterialIcons
                    name="delete-outline"
                    size={16}
                    color="#ffb4ab"
                  />
                  <Text style={styles.imageRemoveText}>Quitar</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Nombre de la barberia</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej: Navaja Centro"
              placeholderTextColor="#7b7466"
            />
            {touched && errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}

            <Text style={styles.label}>Direccion</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Calle, numero y zona"
              placeholderTextColor="#7b7466"
            />
            {touched && errors.address ? (
              <Text style={styles.errorText}>{errors.address}</Text>
            ) : null}

            <Text style={styles.label}>Telefono de contacto</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Ej: +54 11 5555 5555"
              placeholderTextColor="#7b7466"
            />
            {touched && errors.phone ? (
              <Text style={styles.errorText}>{errors.phone}</Text>
            ) : null}

            <Text style={styles.label}>Descripcion (opcional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Cuenta que estilo tiene tu barberia..."
              placeholderTextColor="#7b7466"
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
          onPress={() => {
            void handleSubmit();
          }}
          disabled={isSaving}
        >
          <Text style={styles.submitButtonText}>
            {isSaving ? "Guardando..." : "Crear barberia"}
          </Text>
        </Pressable>
      </View>
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
    justifyContent: "space-between",
    backgroundColor: "rgba(19,19,19,0.9)",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#e5e2e1", fontSize: 20, fontWeight: "800" },
  spacer: { width: 36, height: 36 },
  keyboardWrap: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
    gap: 6,
  },
  heroTitle: { color: "#f2ca50", fontSize: 24, fontWeight: "800" },
  heroText: { color: "#d0c5af", fontSize: 13, lineHeight: 19 },
  formSection: {
    borderRadius: 14,
    backgroundColor: "#191817",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.18)",
    padding: 14,
    gap: 8,
  },
  imageSection: {
    borderRadius: 14,
    backgroundColor: "#191817",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.18)",
    padding: 14,
    gap: 10,
  },
  label: {
    color: "#d0c5af",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  imagePickerButton: {
    borderRadius: 12,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.3)",
    minHeight: 170,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: 170,
  },
  imagePlaceholder: {
    minHeight: 170,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
  },
  imagePlaceholderTitle: {
    color: "#e5e2e1",
    fontSize: 14,
    fontWeight: "700",
  },
  imagePlaceholderText: {
    color: "#99907c",
    fontSize: 12,
    textAlign: "center",
  },
  imageActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageActionButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.3)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flex: 1,
  },
  imageActionText: {
    color: "#f2ca50",
    fontSize: 13,
    fontWeight: "700",
  },
  imageRemoveButton: {
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(255,180,171,0.25)",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  imageRemoveText: {
    color: "#ffb4ab",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.3)",
    color: "#e5e2e1",
    fontSize: 14,
    paddingHorizontal: 14,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  errorText: {
    color: "#ffb4ab",
    fontSize: 12,
    marginTop: -2,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "rgba(19,19,19,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(77,70,53,0.22)",
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#241a00",
    fontSize: 15,
    fontWeight: "800",
  },
});
