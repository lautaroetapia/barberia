import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@supabase/supabase-js";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    ImageBackground,
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import {
    getRoleHomeRoute,
    getStoredActiveRole,
    type AppRole,
} from "@/lib/active-role";
import { getRoleVisibilityForUser } from "@/lib/role-visibility";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";
import { signInWithGoogle } from "../../lib/supabase-google-auth";

const WELCOME_BG_URI =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDAgxxxKtG3t7kNY_PiqBcB876M46WRgIl0ehOmZcq1AsKVHN9W6MPgemjNfl6VR6_nhU7WxpeSIzydBjUxILvJm07aVW7KzIUPnsOB9A_Y_yEeYJnAiXflgtpWaj-ZvzTvkWGTws6rxW8JaLBjU_YdsK3QJNnZ6buK7mrM-jjBNNJUQtg6pqRudJJjF6qFB5yPNUmEDawjAug7ZucCFLw08_x3OQqo11xn7WZuumsys2D3ISR7InJodR8gD_20EitiBfkV5sMnXGpX";
const POST_SIGNUP_WELCOME_KEY = "post_signup_welcome_email";

const hasDisplayName = (user: User | null) => {
  const displayName = user?.user_metadata?.display_name;
  return typeof displayName === "string" && displayName.trim().length > 0;
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isNicknameFocused, setIsNicknameFocused] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const [authError, setAuthError] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });
  const processedUrlsRef = useRef<Set<string>>(new Set());

  const continueAfterAuth = useCallback(async (user: User | null) => {
    const pendingWelcomeEmail = await AsyncStorage.getItem(
      POST_SIGNUP_WELCOME_KEY,
    );
    const loggedEmail = user?.email?.toLowerCase() ?? "";
    const shouldShowPostSignupWelcome =
      Boolean(pendingWelcomeEmail) && pendingWelcomeEmail === loggedEmail;

    const visibility = await getRoleVisibilityForUser(user);
    const storedRole = await getStoredActiveRole();

    let nextRole: AppRole = "cliente";
    if (storedRole === "dueno" && visibility.hasOwnerRole) {
      nextRole = "dueno";
    } else if (storedRole === "barbero" && visibility.hasBarberRole) {
      nextRole = "barbero";
    }

    const homeRoute = getRoleHomeRoute(nextRole);

    if (hasDisplayName(user)) {
      await AsyncStorage.removeItem(POST_SIGNUP_WELCOME_KEY);
      router.replace(homeRoute);
      return;
    }

    if (!shouldShowPostSignupWelcome) {
      router.replace(homeRoute);
      return;
    }

    setShowWelcomeModal(true);
  }, []);

  const handleAuthDeepLink = useCallback(
    async (incomingUrl: string) => {
      if (!incomingUrl || processedUrlsRef.current.has(incomingUrl)) {
        return;
      }

      processedUrlsRef.current.add(incomingUrl);

      try {
        const parsedUrl = new URL(incomingUrl);
        const hashParams = new URLSearchParams(
          parsedUrl.hash.startsWith("#")
            ? parsedUrl.hash.slice(1)
            : parsedUrl.hash,
        );

        const code =
          parsedUrl.searchParams.get("code") ?? hashParams.get("code");
        const tokenHash =
          parsedUrl.searchParams.get("token_hash") ??
          hashParams.get("token_hash");
        const otpType =
          parsedUrl.searchParams.get("type") ?? hashParams.get("type");
        const accessToken =
          parsedUrl.searchParams.get("access_token") ??
          hashParams.get("access_token");
        const refreshToken =
          parsedUrl.searchParams.get("refresh_token") ??
          hashParams.get("refresh_token");

        let authCompleted = false;

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw error;
          }
          authCompleted = true;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            throw error;
          }
          authCompleted = true;
        } else if (tokenHash && otpType) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType as
              | "signup"
              | "recovery"
              | "invite"
              | "email_change"
              | "magiclink",
          });
          if (error) {
            throw error;
          }
          authCompleted = true;
        }

        if (!authCompleted) {
          return;
        }

        const { data } = await supabase.auth.getUser();
        await continueAfterAuth(data.user ?? null);
      } catch {
        setAuthError(
          "No se pudo completar la verificacion automatica. Inicia sesion manualmente.",
        );
      }
    },
    [continueAfterAuth],
  );

  useEffect(() => {
    const handleInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await handleAuthDeepLink(initialUrl);
      }
    };

    void handleInitialUrl();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleAuthDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleAuthDeepLink]);

  const handleLogin = async () => {
    if (!isSupabaseConfigured) {
      setToast({
        visible: true,
        type: "error",
        message: "Falta configurar Supabase para autenticar.",
      });
      return;
    }

    if (!email.trim() || !password) {
      setAuthError("Ingresa correo y contrasena.");
      return;
    }

    setAuthError("");
    setIsSigningIn(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSigningIn(false);

    if (error) {
      setAuthError(error.message);
      return;
    }

    const { data } = await supabase.auth.getUser();
    await continueAfterAuth(data.user ?? null);
  };

  const handleSaveNickname = async () => {
    const cleanedNickname = nickname.trim();
    if (cleanedNickname.length < 2) {
      setToast({
        visible: true,
        type: "info",
        message: "Escribe al menos 2 caracteres para guardar tu nombre.",
      });
      return;
    }

    setIsSavingNickname(true);
    const { error } = await supabase.auth.updateUser({
      data: { display_name: cleanedNickname },
    });
    setIsSavingNickname(false);

    if (error) {
      setToast({ visible: true, type: "error", message: error.message });
      return;
    }

    await AsyncStorage.removeItem(POST_SIGNUP_WELCOME_KEY);
    setShowWelcomeModal(false);
    router.replace("/(tabs)");
  };

  const handleSkipWelcome = () => {
    if (isSavingNickname) {
      return;
    }

    void AsyncStorage.removeItem(POST_SIGNUP_WELCOME_KEY);
    setShowWelcomeModal(false);
    router.replace("/(tabs)");
  };

  const handleGoogleAuth = async () => {
    setAuthError("");
    setIsGoogleLoading(true);

    const result = await signInWithGoogle();
    setIsGoogleLoading(false);

    if (!result.ok) {
      setAuthError(result.message);
      return;
    }

    await AsyncStorage.removeItem(POST_SIGNUP_WELCOME_KEY);
    router.replace("/(tabs)");
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

      <View style={styles.brandBlock}>
        <MaterialIcons name="content-cut" size={38} color="#f2ca50" />
        <Text style={styles.brandTitle}>NAVAJA DORADA</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.tabsRow}>
          <Pressable style={styles.tabButton}>
            <Text style={[styles.tabText, styles.tabTextActive]}>
              Iniciar sesion
            </Text>
            <View style={[styles.tabUnderline, styles.tabUnderlineActive]} />
          </Pressable>

          <Pressable
            style={styles.tabButton}
            onPress={() => router.push("/auth/register")}
          >
            <Text style={[styles.tabText, styles.tabTextInactive]}>
              Registrarse
            </Text>
            <View style={[styles.tabUnderline, styles.tabUnderlineInactive]} />
          </Pressable>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <MaterialIcons
              name="mail"
              size={22}
              color="#99907c"
              style={styles.leftIcon}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              style={styles.textInput}
              placeholder="Email"
              placeholderTextColor="rgba(153, 144, 124, 0.7)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <MaterialIcons
              name="lock"
              size={22}
              color="#99907c"
              style={styles.leftIcon}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.textInput}
              placeholder="Contrasena"
              placeholderTextColor="rgba(153, 144, 124, 0.7)"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable
              style={styles.rightIconButton}
              onPress={() => setShowPassword((prev) => !prev)}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={22}
                color="#99907c"
              />
            </Pressable>
          </View>

          <Pressable
            style={styles.forgotWrap}
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contrasena?</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, isSigningIn && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator color="#3c2f00" />
            ) : (
              <Text style={styles.primaryButtonText}>Entrar</Text>
            )}
          </Pressable>

          {authError ? <Text style={styles.errorText}>{authError}</Text> : null}

          <View style={styles.dividerWrap}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
          </View>

          <Pressable
            style={[
              styles.secondaryButton,
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
                <Text style={styles.secondaryButtonText}>
                  Continuar con Google
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showWelcomeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWelcomeModal(false)}
      >
        <ImageBackground
          source={{ uri: WELCOME_BG_URI }}
          style={styles.modalBg}
        >
          <View style={styles.modalOverlay} />

          <View style={styles.modalWrapper}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconWrap}>
                <MaterialIcons name="content-cut" size={38} color="#f2ca50" />
              </View>

              <View style={styles.modalTextWrap}>
                <Text style={styles.modalTitle}>¡Bienvenido!</Text>
                <Text style={styles.modalSubtitle}>
                  ¿Como quieres que te llamemos?
                </Text>
              </View>

              <View style={styles.nicknameGroup}>
                <Text
                  style={[
                    styles.nicknameLabel,
                    (isNicknameFocused || nickname.length > 0) &&
                      styles.nicknameLabelRaised,
                  ]}
                >
                  Tu nombre o apodo
                </Text>

                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  onFocus={() => setIsNicknameFocused(true)}
                  onBlur={() => setIsNicknameFocused(false)}
                  style={styles.nicknameInput}
                  placeholder=""
                  placeholderTextColor="transparent"
                />
              </View>

              <Pressable
                style={[
                  styles.modalPrimaryButton,
                  isSavingNickname && styles.buttonDisabled,
                ]}
                onPress={handleSaveNickname}
                disabled={isSavingNickname}
              >
                {isSavingNickname ? (
                  <ActivityIndicator color="#3c2f00" />
                ) : (
                  <Text style={styles.modalPrimaryButtonText}>
                    Guardar y continuar
                  </Text>
                )}
              </Pressable>

              <Pressable
                style={styles.modalSecondaryButton}
                onPress={handleSkipWelcome}
                disabled={isSavingNickname}
              >
                <Text style={styles.modalSecondaryButtonText}>
                  Omitir por ahora
                </Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#131313",
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandBlock: {
    alignItems: "center",
    marginBottom: 42,
    gap: 12,
  },
  brandTitle: {
    color: "#d4af37",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: 3,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 20,
    paddingHorizontal: 26,
    paddingVertical: 26,
    backgroundColor: "#1c1b1b",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(77, 70, 53, 0.3)",
    marginBottom: 28,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
    gap: 10,
  },
  tabText: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#f2ca50",
  },
  tabTextInactive: {
    color: "#c6c6c7",
  },
  tabUnderline: {
    height: 2,
    width: "100%",
  },
  tabUnderlineActive: {
    backgroundColor: "#f2ca50",
  },
  tabUnderlineInactive: {
    backgroundColor: "transparent",
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    minHeight: 54,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#99907c",
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
    fontSize: 16,
    paddingVertical: 10,
  },
  forgotWrap: {
    alignItems: "center",
    marginTop: -8,
    marginBottom: -2,
  },
  forgotText: {
    color: "#c6c6c7",
    fontSize: 14,
    textDecorationLine: "underline",
    textDecorationColor: "#99907c",
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d4af37",
    shadowColor: "#d4af37",
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  primaryButtonText: {
    color: "#3c2f00",
    fontSize: 19,
    fontWeight: "800",
  },
  errorText: {
    color: "#ffb4ab",
    fontSize: 13,
    marginTop: -12,
    marginBottom: -6,
    textAlign: "center",
  },
  dividerWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
    marginBottom: -4,
  },
  dividerLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 70, 53, 0.3)",
  },
  dividerText: {
    position: "absolute",
    paddingHorizontal: 10,
    backgroundColor: "#1c1b1b",
    color: "#c6c6c7",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#1c1b1b",
  },
  secondaryButtonText: {
    color: "#e5e2e1",
    fontSize: 16,
    fontWeight: "500",
  },
  modalBg: {
    flex: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 14, 14, 0.86)",
  },
  modalWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 70, 53, 0.22)",
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 26,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.42,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  modalIconWrap: {
    marginBottom: 24,
  },
  modalTextWrap: {
    alignItems: "center",
    marginBottom: 28,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "800",
    marginBottom: 6,
  },
  modalSubtitle: {
    color: "#d0c5af",
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  nicknameGroup: {
    width: "100%",
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#99907c",
    justifyContent: "flex-end",
    marginBottom: 28,
    position: "relative",
  },
  nicknameLabel: {
    position: "absolute",
    left: 2,
    bottom: 12,
    color: "#d0c5af",
    fontSize: 17,
  },
  nicknameLabelRaised: {
    bottom: 36,
    fontSize: 12,
    color: "#f2ca50",
  },
  nicknameInput: {
    height: 42,
    color: "#e5e2e1",
    fontSize: 18,
    paddingHorizontal: 2,
    paddingBottom: 6,
  },
  modalPrimaryButton: {
    width: "100%",
    minHeight: 56,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalPrimaryButtonText: {
    color: "#3c2f00",
    fontSize: 19,
    fontWeight: "700",
  },
  modalSecondaryButton: {
    width: "100%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  modalSecondaryButtonText: {
    color: "#d0c5af",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    opacity: 0.75,
  },
});
