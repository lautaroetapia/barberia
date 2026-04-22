import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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

import { signInWithGoogle } from "@/lib/supabase-google-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(
    null,
  );

  const handleGoogleSignIn = async () => {
    if (isGoogleSigningIn) {
      return;
    }

    setIsGoogleSigningIn(true);

    try {
      const result = await signInWithGoogle();

      if (!result.ok) {
        Alert.alert("No se pudo iniciar con Google", result.message);
      }
    } catch {
      Alert.alert(
        "Error de autenticacion",
        "No pudimos iniciar sesion con Google. Intentalo de nuevo.",
      );
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleLogin = async () => {
    if (isSigningIn) {
      return;
    }

    if (!isSupabaseConfigured) {
      Alert.alert("Configuración pendiente", "Supabase no está configurado en este entorno.");
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/\S+@\S+\.\S+/.test(trimmedEmail)) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }

    if (!password) {
      Alert.alert("Contraseña requerida", "Ingresa tu contraseña para continuar.");
      return;
    }

    setIsSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        Alert.alert("No se pudo iniciar sesión", error.message);
        return;
      }

      router.replace("/(tabs)");
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.screen}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* BRANDING HEADER */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="content-cut" size={42} color="#D4AF37" />
          </View>
          <Text style={styles.brandTitle}>
            NAVAJA <Text style={styles.brandTitleBold}>DORADA</Text>
          </Text>
          <Text style={styles.brandSubtitle}>
            Cortes de autor, estilo impecable
          </Text>
        </View>

        {/* FORM CARD */}
        <View style={styles.formCard}>
          <View style={styles.tabsContainer}>
            <Pressable style={styles.activeTab} onPress={() => router.replace("/auth/login")}>
              <Text style={styles.activeTabText}>Ingresar</Text>
              <View style={styles.tabIndicator} />
            </Pressable>
            <Pressable
              style={styles.inactiveTab}
              onPress={() => router.push("/auth/register")}
            >
              <Text style={styles.inactiveTabText}>Registrarse</Text>
            </Pressable>
          </View>

          <View style={styles.inputWrapper}>
            {/* EMAIL INPUT */}
            <View
              style={[
                styles.inputContainer,
                focusedInput === "email" && styles.inputContainerFocused,
              ]}
            >
              <MaterialIcons
                name="alternate-email"
                size={20}
                color={focusedInput === "email" ? "#D4AF37" : "#666"}
              />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
                placeholder="Correo electrónico"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* PASSWORD INPUT */}
            <View
              style={[
                styles.inputContainer,
                focusedInput === "password" && styles.inputContainerFocused,
              ]}
            >
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={focusedInput === "password" ? "#D4AF37" : "#666"}
              />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedInput("password")}
                onBlur={() => setFocusedInput(null)}
                placeholder="Contraseña"
                placeholderTextColor="#666"
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#666"
                />
              </Pressable>
            </View>

            <Pressable style={styles.forgotButton} onPress={() => router.push("/auth/forgot-password")}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => void handleLogin()}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#1A1A1A" />
            ) : (
              <Text style={styles.primaryButtonText}>ENTRAR</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>O CONTINUAR CON</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.googleButton,
              (pressed || isGoogleSigningIn) && styles.buttonPressed,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleSigningIn}
          >
            {isGoogleSigningIn ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <AntDesign name="google" size={20} color="#FFF" />
                <Text style={styles.googleButtonText}>Google</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0A0A0A", // Negro profundo
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 26,
    color: "#FFF",
    letterSpacing: 4,
    fontWeight: "300",
  },
  brandTitleBold: {
    color: "#D4AF37",
    fontWeight: "800",
  },
  brandSubtitle: {
    color: "#666",
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 1,
  },
  formCard: {
    backgroundColor: "#141414",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#1F1F1F",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 32,
  },
  activeTab: {
    marginRight: 24,
  },
  activeTabText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
  tabIndicator: {
    height: 3,
    backgroundColor: "#D4AF37",
    width: 20,
    marginTop: 4,
    borderRadius: 2,
  },
  inactiveTab: {
    justifyContent: "center",
  },
  inactiveTabText: {
    color: "#444",
    fontSize: 18,
    fontWeight: "500",
  },
  inputWrapper: {
    gap: 16,
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: "#222",
  },
  inputContainerFocused: {
    borderColor: "#D4AF37",
    backgroundColor: "#1E1E1E",
  },
  textInput: {
    flex: 1,
    color: "#FFF",
    fontSize: 16,
    marginLeft: 12,
  },
  forgotButton: {
    alignSelf: "flex-end",
  },
  forgotText: {
    color: "#D4AF37",
    fontSize: 13,
    fontWeight: "600",
  },
  primaryButton: {
    backgroundColor: "#D4AF37",
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 2,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#222",
  },
  dividerText: {
    color: "#444",
    fontSize: 10,
    marginHorizontal: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: "row",
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  googleButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
