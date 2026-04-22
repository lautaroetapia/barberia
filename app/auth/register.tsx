import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
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

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isCreatingAccount, setIsCreatingAccount] = useState(false);
    const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
    const [focusedInput, setFocusedInput] = useState<"email" | "pass" | null>(null);

    const passwordScore = useMemo(() => {
        if (password.length === 0) return 0;
        if (password.length < 6) return 1;
        if (password.length < 9) return 2;
        if (!/[A-Z]/.test(password) || !/\d/.test(password)) return 3;
        return 4;
    }, [password]);

    const strengthColors = ["#353535", "#FF6B6B", "#F2CA50", "#D4AF37", "#00C851"];
    const passwordLabel = ["", "DÉBIL", "MEDIA", "FUERTE", "EXCELENTE"][passwordScore];

    const handleCreateAccount = async () => {
        if (isCreatingAccount) {
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

        if (password.length < 6) {
            Alert.alert("Contraseña débil", "La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (!acceptedTerms) {
            Alert.alert("Términos y privacidad", "Debes aceptar términos y privacidad para continuar.");
            return;
        }

        setIsCreatingAccount(true);
        try {
            const { error } = await supabase.auth.signUp({
                email: trimmedEmail,
                password,
            });

            if (error) {
                Alert.alert("No se pudo crear la cuenta", error.message);
                return;
            }

            router.push("/auth/verify-email");
        } finally {
            setIsCreatingAccount(false);
        }
    };

    const handleGoogleSignUp = async () => {
        if (isGoogleSigningIn) {
            return;
        }

        setIsGoogleSigningIn(true);
        try {
            const result = await signInWithGoogle();
            if (!result.ok) {
                Alert.alert("No se pudo continuar con Google", result.message);
            }
        } catch {
            Alert.alert("Error", "No se pudo continuar con Google. Inténtalo de nuevo.");
        } finally {
            setIsGoogleSigningIn(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <StatusBar style="light" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* BRANDING */}
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <MaterialIcons name="content-cut" size={32} color="#D4AF37" />
                    </View>
                    <Text style={styles.brandTitle}>NAVAJA <Text style={styles.brandTitleBold}>DORADA</Text></Text>
                </View>

                {/* TABS */}
                <View style={styles.tabsRow}>
                    <Pressable style={styles.tabButton} onPress={() => router.push("/auth/login")}>
                        <Text style={styles.tabTextInactive}>Ingresar</Text>
                    </Pressable>
                    <View style={styles.tabButton}>
                        <Text style={styles.tabTextActive}>Registrarse</Text>
                        <View style={styles.tabIndicator} />
                    </View>
                </View>

                <View style={styles.formCard}>
                    {/* EMAIL */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>CORREO ELECTRÓNICO</Text>
                        <View style={[styles.inputContainer, focusedInput === 'email' && styles.inputFocused]}>
                            <MaterialIcons name="mail-outline" size={20} color={focusedInput === 'email' ? "#D4AF37" : "#666"} />
                            <TextInput
                                value={email}
                                onChangeText={setEmail}
                                onFocus={() => setFocusedInput('email')}
                                onBlur={() => setFocusedInput(null)}
                                style={styles.textInput}
                                placeholder="tu@email.com"
                                placeholderTextColor="#444"
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    {/* PASSWORD */}
                    <View style={styles.fieldBlock}>
                        <Text style={styles.fieldLabel}>CONTRASEÑA</Text>
                        <View style={[styles.inputContainer, focusedInput === 'pass' && styles.inputFocused]}>
                            <MaterialIcons name="lock-outline" size={20} color={focusedInput === 'pass' ? "#D4AF37" : "#666"} />
                            <TextInput
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setFocusedInput('pass')}
                                onBlur={() => setFocusedInput(null)}
                                style={styles.textInput}
                                placeholder="********"
                                placeholderTextColor="#444"
                                secureTextEntry={!showPassword}
                            />
                            <Pressable onPress={() => setShowPassword(!showPassword)}>
                                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color="#666" />
                            </Pressable>
                        </View>

                        {/* STRENGTH BAR */}
                        <View style={styles.strengthWrapper}>
                            <View style={styles.strengthBarRow}>
                                {[1, 2, 3, 4].map((step) => (
                                    <View
                                        key={step}
                                        style={[
                                            styles.strengthSegment,
                                            { backgroundColor: passwordScore >= step ? strengthColors[passwordScore] : "#222" }
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={[styles.strengthText, { color: passwordScore > 0 ? strengthColors[passwordScore] : "#444" }]}>
                                {passwordLabel || "SEGURIDAD"}
                            </Text>
                        </View>
                    </View>

                    {/* TERMS */}
                    <Pressable style={styles.termsRow} onPress={() => setAcceptedTerms(!acceptedTerms)}>
                        <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                            {acceptedTerms && <MaterialIcons name="check" size={14} color="#1A1A1A" />}
                        </View>
                        <Text style={styles.termsText}>
                            Acepto los <Text style={styles.goldText}>términos</Text> y la <Text style={styles.goldText}>privacidad</Text>.
                        </Text>
                    </Pressable>

                    <Pressable 
                        style={({pressed}) => [styles.primaryButton, pressed && styles.buttonPressed]}
                        onPress={() => void handleCreateAccount()}
                        disabled={isCreatingAccount}
                    >
                        {isCreatingAccount ? <ActivityIndicator color="#1A1A1A" /> : <Text style={styles.primaryButtonText}>CREAR CUENTA</Text>}
                    </Pressable>

                    <View style={styles.dividerRow}>
                        <View style={styles.line} />
                        <Text style={styles.dividerText}>O REGÍSTRATE CON</Text>
                        <View style={styles.line} />
                    </View>

                    <Pressable style={styles.googleButton} onPress={() => void handleGoogleSignUp()} disabled={isGoogleSigningIn}>
                        {isGoogleSigningIn ? <ActivityIndicator color="#FFF" /> : <><AntDesign name="google" size={18} color="#FFF" /><Text style={styles.googleButtonText}>Google</Text></>}
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#0A0A0A" },
    scrollContent: { padding: 24, flexGrow: 1, justifyContent: "center" },
    header: { alignItems: "center", marginBottom: 30 },
    logoCircle: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: "#161616", alignItems: "center",
        justifyContent: "center", borderWidth: 1, borderColor: "rgba(212, 175, 55, 0.2)",
        marginBottom: 12
    },
    brandTitle: { color: "#FFF", fontSize: 20, letterSpacing: 4, fontWeight: "300" },
    brandTitleBold: { color: "#D4AF37", fontWeight: "800" },
    tabsRow: { flexDirection: "row", marginBottom: 32, paddingHorizontal: 4 },
    tabButton: { marginRight: 24 },
    tabTextActive: { color: "#FFF", fontSize: 16, fontWeight: "700" },
    tabTextInactive: { color: "#444", fontSize: 16, fontWeight: "600" },
    tabIndicator: { height: 3, backgroundColor: "#D4AF37", width: 16, marginTop: 4, borderRadius: 2 },
    formCard: { backgroundColor: "#121212", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "#1F1F1F" },
    fieldBlock: { marginBottom: 20 },
    fieldLabel: { color: "#D4AF37", fontSize: 11, fontWeight: "700", letterSpacing: 1.5, marginBottom: 10 },
    inputContainer: {
        flexDirection: "row", alignItems: "center", backgroundColor: "#1A1A1A",
        borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: "#222"
    },
    inputFocused: { borderColor: "#D4AF37", backgroundColor: "#1E1E1E" },
    textInput: { flex: 1, color: "#FFF", fontSize: 15, marginLeft: 12 },
    strengthWrapper: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    strengthBarRow: { flexDirection: "row", gap: 4, flex: 1, marginRight: 12 },
    strengthSegment: { height: 4, flex: 1, borderRadius: 2 },
    strengthText: { fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    termsRow: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 12 },
    checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: "#333", alignItems: "center", justifyContent: "center" },
    checkboxChecked: { backgroundColor: "#D4AF37", borderColor: "#D4AF37" },
    termsText: { color: "#666", fontSize: 13 },
    goldText: { color: "#D4AF37", fontWeight: "600" },
    primaryButton: { backgroundColor: "#D4AF37", height: 56, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 10 },
    primaryButtonText: { color: "#1A1A1A", fontSize: 15, fontWeight: "900", letterSpacing: 1.5 },
    buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
    dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
    line: { flex: 1, height: 1, backgroundColor: "#222" },
    dividerText: { color: "#444", fontSize: 10, marginHorizontal: 12, fontWeight: "700" },
    googleButton: {
        flexDirection: "row", height: 56, borderRadius: 12, borderWidth: 1,
        borderColor: "#333", alignItems: "center", justifyContent: "center", gap: 12
    },
    googleButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" }
});