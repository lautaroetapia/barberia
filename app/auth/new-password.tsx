import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

export default function NewPasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  const handleResetPassword = async () => {
    if (!isSupabaseConfigured) {
      setToast({
        visible: true,
        type: "error",
        message: "Falta configurar Supabase para restablecer contrasena.",
      });
      return;
    }

    if (!newPassword || !confirmPassword) {
      setErrorMessage("Completa ambos campos.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("La contrasena debe tener al menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Las contrasenas no coinciden.");
      return;
    }

    setErrorMessage("");
    setIsResetting(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsResetting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setToast({
      visible: true,
      type: "success",
      message: "Contrasena actualizada. Ya puedes iniciar sesion.",
    });
    router.replace("/auth/login");
  };

  return (
    <View style={styles.screen}>
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable
          style={styles.headerButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialIcons name="arrow-back" size={25} color="#e5e2e1" />
        </Pressable>

        <Text style={styles.headerTitle}>Crear nueva contrasena</Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.description}>
          Ingresa tu nueva clave para acceder a tu cuenta.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <MaterialIcons
              name="lock"
              size={22}
              color="#99907c"
              style={styles.leftIcon}
            />
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              style={styles.textInput}
              placeholder="Nueva contrasena"
              placeholderTextColor="rgba(153, 144, 124, 0.7)"
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.rightIconButton}
              onPress={() => setShowNewPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel="Mostrar u ocultar nueva contrasena"
            >
              <MaterialIcons
                name={showNewPassword ? "visibility" : "visibility-off"}
                size={22}
                color="#99907c"
              />
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <MaterialIcons
              name="lock"
              size={22}
              color="#99907c"
              style={styles.leftIcon}
            />
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.textInput}
              placeholder="Confirmar contrasena"
              placeholderTextColor="rgba(153, 144, 124, 0.7)"
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              style={styles.rightIconButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              accessibilityRole="button"
              accessibilityLabel="Mostrar u ocultar confirmacion de contrasena"
            >
              <MaterialIcons
                name={showConfirmPassword ? "visibility" : "visibility-off"}
                size={22}
                color="#99907c"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.actionArea}>
          <Pressable
            style={[styles.primaryButton, isResetting && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isResetting}
          >
            {isResetting ? (
              <ActivityIndicator color="#3c2f00" />
            ) : (
              <Text style={styles.primaryButtonText}>Restablecer</Text>
            )}
          </Pressable>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
  },
  header: {
    height: 74,
    paddingHorizontal: 24,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.1,
    marginRight: 8,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  main: {
    flex: 1,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  description: {
    color: "#99907c",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 40,
  },
  form: {
    gap: 28,
  },
  inputGroup: {
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#99907c",
    justifyContent: "center",
    paddingLeft: 36,
    paddingRight: 36,
    position: "relative",
  },
  leftIcon: {
    position: "absolute",
    left: 0,
    top: 16,
  },
  rightIconButton: {
    position: "absolute",
    right: 0,
    top: 14,
    padding: 2,
  },
  textInput: {
    color: "#e5e2e1",
    fontSize: 19,
    paddingVertical: 9,
  },
  actionArea: {
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: 28,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: "#f2ca50",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f2ca50",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButtonText: {
    color: "#3c2f00",
    fontSize: 21,
    fontWeight: "800",
  },
  errorText: {
    color: "#ffb4ab",
    fontSize: 13,
    textAlign: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
});
