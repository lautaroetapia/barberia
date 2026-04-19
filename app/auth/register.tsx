import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { signInWithGoogle } from "../../lib/supabase-google-auth";

const POST_SIGNUP_WELCOME_KEY = "post_signup_welcome_email";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  const passwordScore = useMemo(() => {
    if (password.length === 0) return 0;
    if (password.length < 6) return 1;
    if (password.length < 9) return 2;
    if (!/[A-Z]/.test(password) || !/\d/.test(password)) return 3;
    return 4;
  }, [password]);

  const passwordLabel = ["", "Debil", "Media", "Fuerte", "Muy fuerte"][
    passwordScore
  ];

  const handleCreateAccount = async () => {
    if (!isSupabaseConfigured) {
      setToast({
        visible: true,
        type: "error",
        message: "Falta configurar Supabase para registrar usuarios.",
      });
      return;
    }

    if (!email.trim() || !password) {
      setRegisterError("Completa correo y contrasena.");
      return;
    }

    if (!acceptedTerms) {
      setRegisterError("Debes aceptar terminos y condiciones.");
      return;
    }

    setRegisterError("");
    setIsCreatingAccount(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: "barberia://auth/login",
      },
    });

    setIsCreatingAccount(false);

    if (error) {
      setRegisterError(error.message);
      return;
    }

    await AsyncStorage.setItem(
      POST_SIGNUP_WELCOME_KEY,
      email.trim().toLowerCase(),
    );

    router.push("/auth/verify-email");
  };

  const handleGoogleAuth = async () => {
    setRegisterError("");
    setIsGoogleLoading(true);

    const result = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (!result.ok) {
      setRegisterError(result.message);
      return;
    }

    router.replace("/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandBlock}>
          <MaterialIcons name="content-cut" size={38} color="#f2ca50" />
          <Text style={styles.brandTitle}>NAVAJA DORADA</Text>
        </View>

        <View style={styles.tabsRow}>
          <Pressable
            style={styles.tabButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={[styles.tabText, styles.tabTextInactive]}>
              Iniciar sesion
            </Text>
          </Pressable>

          <View style={styles.tabButton}>
            <Text style={[styles.tabText, styles.tabTextActive]}>
              Registrarse
            </Text>
            <View style={[styles.tabUnderline, styles.tabUnderlineActive]} />
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Correo electronico</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              placeholder="tu@email.com"
              placeholderTextColor="rgba(153, 144, 124, 0.7)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Contrasena</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={[styles.textInput, styles.passwordInput]}
                placeholder="********"
                placeholderTextColor="rgba(153, 144, 124, 0.7)"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable
                style={styles.passwordToggle}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#99907c"
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.strengthBlock}>
            <View style={styles.strengthRow}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.strengthSegment,
                    step === 1 && styles.firstStrengthSegment,
                    step === 4 && styles.lastStrengthSegment,
                    passwordScore >= step
                      ? step === 1
                        ? styles.weakStrength
                        : styles.activeStrength
                      : styles.inactiveStrength,
                  ]}
                />
              ))}
            </View>
            <Text
              style={[
                styles.strengthLabel,
                passwordScore <= 1
                  ? styles.strengthWeak
                  : styles.strengthNeutral,
              ]}
            >
              {passwordLabel || "Debil"}
            </Text>
          </View>

          <Pressable
            style={styles.termsRow}
            onPress={() => setAcceptedTerms((prev) => !prev)}
          >
            <View
              style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
            >
              {acceptedTerms ? (
                <MaterialIcons name="check" size={14} color="#3c2f00" />
              ) : null}
            </View>
            <Text style={styles.termsText}>
              Acepto los{" "}
              <Text style={styles.termsLink}>terminos y condiciones</Text> y la{" "}
              <Text style={styles.termsLink}>politica de privacidad</Text>.
            </Text>
          </Pressable>

          <View style={styles.actionsArea}>
            <Pressable
              style={[
                styles.primaryButton,
                isCreatingAccount && styles.buttonDisabled,
              ]}
              onPress={handleCreateAccount}
              disabled={isCreatingAccount}
            >
              {isCreatingAccount ? (
                <ActivityIndicator color="#3c2f00" />
              ) : (
                <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              )}
            </Pressable>

            {registerError ? (
              <Text style={styles.errorText}>{registerError}</Text>
            ) : null}

            <View style={styles.dividerWrap}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>O</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              style={[
                styles.googleButton,
                isGoogleLoading && styles.buttonDisabled,
              ]}
              onPress={handleGoogleAuth}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color="#e5e2e1" />
              ) : (
                <>
                  <AntDesign name="google" size={18} color="#e5e2e1" />
                  <Text style={styles.googleButtonText}>
                    Continuar con Google
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0b0c0f",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 16,
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 14,
    gap: 6,
  },
  brandTitle: {
    color: "#d4af37",
    fontSize: 23,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: 4,
  },
  tabsRow: {
    flexDirection: "row",
    marginBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: "#32343b",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 12,
    position: "relative",
  },
  tabText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#f2ca50",
  },
  tabTextInactive: {
    color: "#cbc5b7",
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  tabUnderlineActive: {
    backgroundColor: "#f2ca50",
  },
  form: {
    flexGrow: 1,
  },
  fieldBlock: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: "#99907c",
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 2,
  },
  textInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#5a513d",
    color: "#e5e2e1",
    fontSize: 16,
    paddingHorizontal: 2,
    paddingVertical: 8,
  },
  passwordWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 34,
  },
  passwordToggle: {
    position: "absolute",
    right: 0,
    top: 8,
    padding: 2,
  },
  strengthBlock: {
    marginTop: -2,
    marginBottom: 14,
    gap: 6,
  },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 8,
  },
  firstStrengthSegment: {
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  lastStrengthSegment: {
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  weakStrength: {
    backgroundColor: "#ffb4ab",
  },
  activeStrength: {
    backgroundColor: "#f2ca50",
  },
  inactiveStrength: {
    backgroundColor: "#353535",
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  strengthWeak: {
    color: "#ffb4ab",
  },
  strengthNeutral: {
    color: "#d0c5af",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  checkbox: {
    marginTop: 2,
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#6e6449",
    backgroundColor: "#0e0e0e",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: "#f2ca50",
    backgroundColor: "#f2ca50",
  },
  termsText: {
    flex: 1,
    color: "#d0c5af",
    fontSize: 14,
    lineHeight: 22,
  },
  termsLink: {
    color: "#f2ca50",
  },
  actionsArea: {
    marginTop: 20,
    paddingBottom: 2,
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButtonText: {
    color: "#3c2f00",
    fontSize: 18,
    fontWeight: "800",
  },
  errorText: {
    color: "#ffb4ab",
    fontSize: 13,
    marginTop: -2,
    textAlign: "center",
  },
  dividerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 2,
  },
  dividerLine: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "#353535",
  },
  dividerText: {
    color: "#99907c",
    fontSize: 13,
    fontWeight: "500",
  },
  googleButton: {
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#38393e",
  },
  googleButtonText: {
    color: "#e5e2e1",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
});
