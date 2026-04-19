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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  const handleSendReset = async () => {
    if (!isSupabaseConfigured) {
      setToast({
        visible: true,
        type: "error",
        message: "Falta configurar Supabase para recuperar contrasena.",
      });
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Ingresa tu correo.");
      return;
    }

    setErrorMessage("");
    setIsSending(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: "barberia://auth/new-password",
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.push({
      pathname: "/auth/email-sent",
      params: { email: email.trim() },
    });
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

      <View style={styles.ambientGlow} />

      <View style={styles.header}>
        <Pressable
          style={styles.backIconButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <MaterialIcons name="arrow-back" size={28} color="#e5e2e1" />
        </Pressable>

        <Text style={styles.headerTitle}>Recuperar contrasena</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.main}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Text style={styles.description}>
          Ingresa tu email y te enviaremos un enlace.
        </Text>

        <View style={styles.form}>
          <View style={styles.inputWrap}>
            <MaterialIcons
              name="mail-outline"
              size={23}
              color="#99907c"
              style={styles.inputIcon}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              placeholder="Correo electronico"
              placeholderTextColor="#99907c"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Pressable
            style={[styles.submitButton, isSending && styles.buttonDisabled]}
            onPress={handleSendReset}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#3c2f00" />
            ) : (
              <Text style={styles.submitButtonText}>Enviar enlace</Text>
            )}
            <View style={styles.submitOverlay} />
          </Pressable>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={styles.footerLink}>Volver a Iniciar sesion</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
    overflow: "hidden",
  },
  ambientGlow: {
    position: "absolute",
    top: -220,
    left: "-50%",
    width: "200%",
    height: 500,
    borderRadius: 500,
    backgroundColor: "rgba(42, 42, 42, 0.45)",
  },
  header: {
    height: 88,
    paddingTop: 18,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#e5e2e1",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
    marginRight: 8,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  main: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 26,
    paddingBottom: 44,
  },
  description: {
    color: "#d0c5af",
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 52,
  },
  form: {
    gap: 42,
  },
  inputWrap: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: "#99907c",
    justifyContent: "center",
    paddingLeft: 36,
  },
  inputIcon: {
    position: "absolute",
    left: 0,
    top: 17,
  },
  input: {
    color: "#e5e2e1",
    fontSize: 20,
    paddingVertical: 8,
  },
  submitButton: {
    minHeight: 58,
    borderRadius: 12,
    backgroundColor: "#f2ca50",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 9,
    overflow: "hidden",
  },
  submitOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    opacity: 0,
  },
  submitButtonText: {
    color: "#3c2f00",
    fontSize: 21,
    fontWeight: "800",
  },
  errorText: {
    color: "#ffb4ab",
    fontSize: 13,
    marginTop: -24,
    textAlign: "center",
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 6,
  },
  footerLink: {
    color: "#c6c6c7",
    fontSize: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 70, 53, 0.7)",
    paddingBottom: 2,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
});
