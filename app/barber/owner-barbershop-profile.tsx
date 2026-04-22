import { MaterialIcons, Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";

import { Skeleton } from "@/components/ui/skeleton";
import {
  getOwnedBarbershopProfile,
  saveOwnedBarbershopProfile,
} from "@/lib/owned-barbershop";

export default function OwnerBarbershopProfileScreen() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      const profile = await getOwnedBarbershopProfile();
      if (!isMounted || !profile) {
        setIsLoading(false);
        return;
      }
      setName(profile.name);
      setAddress(profile.address);
      setPhone(profile.phone);
      setDescription(profile.description);
      setImageUri(profile.imageUri ?? "");
      setIsLoading(false);
    };
    void loadProfile();
    return () => { isMounted = false; };
  }, []);

  const errors = useMemo(() => ({
    name: !name.trim() ? "El nombre es obligatorio" : "",
    address: !address.trim() ? "La dirección es obligatoria" : "",
    phone: !phone.trim() ? "El teléfono es obligatorio" : "",
  }), [address, name, phone]);

  const hasErrors = Boolean(errors.name || errors.address || errors.phone);

  const handlePickImage = async () => {
    if (isPickingImage || isSaving) return;
    setIsPickingImage(true);
    try {
      const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) setImageUri(result.assets[0].uri);
    } finally {
      setIsPickingImage(false);
    }
  };

  const handleSave = async () => {
    setTouched(true);
    if (hasErrors || isSaving) return;

    setIsSaving(true);
    try {
      await saveOwnedBarbershopProfile({
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        description: description.trim(),
        imageUri,
      });
      router.replace("/barber/dashboard-owner");
    } catch (error) {
      Alert.alert("Error", "No se pudieron guardar los cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="chevron-left" size={28} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Perfil de Barbería</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Header de Imagen */}
          <View style={styles.imageContainer}>
            <Pressable style={styles.imageFrame} onPress={handlePickImage}>
              {isLoading ? (
                <Skeleton style={styles.imageFull} borderRadius={100} />
              ) : imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.imageFull} contentFit="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={32} color="#4d4635" />
                </View>
              )}
              <View style={styles.editBadge}>
                <Feather name="edit-2" size={14} color="#000" />
              </View>
            </Pressable>
            <Text style={styles.imageHint}>Logo de la sucursal</Text>
          </View>

          {/* Formulario */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Información General</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre Comercial</Text>
              <TextInput
                style={[styles.input, touched && errors.name && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Ej. Black Beard Studio"
                placeholderTextColor="#444"
                editable={!isLoading}
              />
              {touched && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Dirección Local</Text>
              <TextInput
                style={[styles.input, touched && errors.address && styles.inputError]}
                value={address}
                onChangeText={setAddress}
                placeholder="Calle 123, Ciudad"
                placeholderTextColor="#444"
                editable={!isLoading}
              />
              {touched && errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono de Contacto</Text>
              <TextInput
                style={[styles.input, touched && errors.phone && styles.inputError]}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+54 11 ..."
                placeholderTextColor="#444"
                editable={!isLoading}
              />
              {touched && errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descripción / Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Breve historia o servicios destacados..."
                placeholderTextColor="#444"
                multiline
                numberOfLines={4}
                editable={!isLoading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.saveButton, (isSaving || hasErrors && touched) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving || isLoading}
        >
          {isSaving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.saveButtonText}>Actualizar Perfil</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0c0c0c" },
  topBar: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#fff", fontSize: 18, fontWeight: "700" },
  
  content: { padding: 24, paddingBottom: 120 },
  
  imageContainer: { alignItems: 'center', marginBottom: 32 },
  imageFrame: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#d4af37",
    padding: 4,
    backgroundColor: "#0c0c0c",
  },
  imageFull: { width: "100%", height: "100%", borderRadius: 60 },
  imagePlaceholder: { 
    flex: 1, 
    borderRadius: 60, 
    backgroundColor: "#151515", 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: "#d4af37",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: "#0c0c0c",
  },
  imageHint: { color: "#555", fontSize: 12, marginTop: 12, fontWeight: "600", textTransform: 'uppercase' },

  formCard: {
    backgroundColor: "#121212",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  sectionTitle: { color: "#d4af37", fontSize: 14, fontWeight: "800", marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  
  inputGroup: { marginBottom: 20 },
  label: { color: "#888", fontSize: 12, fontWeight: "600", marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: "#080808",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    color: "#fff",
    fontSize: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputError: { borderColor: "#ffb4ab" },
  textArea: { height: 100, paddingTop: 14, textAlignVertical: 'top' },
  errorText: { color: "#ffb4ab", fontSize: 11, marginTop: 5, marginLeft: 4 },

  footer: {
    position: "absolute",
    bottom: 0,
    width: '100%',
    padding: 24,
    backgroundColor: "#0c0c0c",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
  },
  saveButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonDisabled: { backgroundColor: "#333", shadowOpacity: 0 },
  saveButtonText: { color: "#000", fontSize: 16, fontWeight: "800" },
});