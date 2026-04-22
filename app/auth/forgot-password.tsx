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
    SafeAreaView,
    Dimensions
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

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
                message: "Configuración de Supabase pendiente.",
            });
            return;
        }

        if (!email.trim()) {
            setErrorMessage("Por favor, ingresa tu correo.");
            return;
        }

        // Validación básica de email
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email.trim())) {
            setErrorMessage("Introduce un correo electrónico válido.");
            return;
        }

        setErrorMessage("");
        setIsSending(true);

        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: "barberia://auth/new-password",
        });

        setIsSending(false);

        if (error) {
            // Manejo amable de errores de Supabase
            if (error.message.includes("User not found")) {
                setErrorMessage("No encontramos ninguna cuenta con ese correo.");
            } else {
                setErrorMessage("Ocurrió un error. Inténtalo de nuevo más tarde.");
            }
            return;
        }

        router.push({
            pathname: "/auth/email-sent",
            params: { email: email.trim() },
        });
    };

    return (
        <SafeAreaView style={styles.screen}>
            <AppToast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ visible: false, message: "", type: "info" })}
            />

            <StatusBar style="light" />
            
            {/* Resplandor ambiental superior muy sutil */}
            <View style={styles.topGlow} />

            {/* HEADER LIMPIO CON BOTÓN DORADO */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    accessibilityRole="button"
                    accessibilityLabel="Volver"
                >
                    <MaterialIcons name="chevron-left" size={34} color="#D4AF37" />
                </Pressable>
            </View>

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                {/* SECCIÓN DE TEXTO */}
                <View style={styles.textSection}>
                    <Text style={styles.title}>Recuperar{"\n"}contraseña</Text>
                    <Text style={styles.subtitle}>
                        No te preocupes. Introduce tu correo y te guiaremos para restablecerla.
                    </Text>
                </View>

                {/* FORMULARIO ESTILO PREMIUM */}
                <View style={styles.form}>
                    <View style={[styles.inputContainer, errorMessage ? styles.inputError : null]}>
                        <MaterialIcons name="alternate-email" size={20} color="#666" style={styles.inputIcon} />
                        <TextInput
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errorMessage) setErrorMessage("");
                            }}
                            style={styles.input}
                            placeholder="Correo electrónico"
                            placeholderTextColor="#555"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleSendReset}
                        />
                    </View>

                    {errorMessage ? (
                        <View style={styles.errorContainer}>
                            <MaterialIcons name="error-outline" size={14} color="#FF5252" />
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    ) : null}

                    <Pressable
                        style={({ pressed }) => [
                            styles.submitButton,
                            pressed && styles.buttonPressed,
                            isSending && styles.buttonDisabled
                        ]}
                        onPress={handleSendReset}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Enviar instrucciones</Text>
                                <MaterialIcons name="arrow-forward" size={18} color="#000" />
                            </>
                        )}
                    </Pressable>
                </View>

                {/* FOOTER */}
                <View style={styles.footer}>
                    <Pressable onPress={() => router.push("/auth/login")} style={styles.loginLink}>
                        <Text style={styles.footerText}>¿Recordaste tu contraseña? </Text>
                        <Text style={styles.footerLinkBold}>Inicia sesión</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0A0A0A", // Negro más profundo
    },
    topGlow: {
        position: "absolute",
        top: -width * 0.25,
        alignSelf: 'center',
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: width * 0.4,
        backgroundColor: "rgba(212, 175, 55, 0.03)", // Resplandor dorado muy tenue
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 10,
        height: 60,
        justifyContent: 'center',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 5,
    },
    container: {
        flex: 1,
        paddingHorizontal: 30,
    },
    textSection: {
        marginTop: 20,
        marginBottom: 40,
    },
    title: {
        color: "#FFF",
        fontSize: 36,
        fontWeight: "900",
        letterSpacing: -1.5,
        lineHeight: 42,
    },
    subtitle: {
        color: "#888", // Gris medio para lectura suave
        fontSize: 16,
        marginTop: 15,
        lineHeight: 24,
        fontWeight: '400',
    },
    form: {
        width: "100%",
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111", // Fondo del input ligeramente más claro que el screen
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#222",
        paddingHorizontal: 18,
        height: 64,
    },
    inputError: {
        borderColor: "#FF525244", // Borde rojo tenue en error
        backgroundColor: "#1A1010",
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        paddingLeft: 4,
    },
    errorText: {
        color: "#FF5252",
        fontSize: 13,
        fontWeight: "500",
    },
    submitButton: {
        height: 64,
        borderRadius: 18,
        backgroundColor: "#D4AF37", // Dorado principal
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 35,
        gap: 10,
        // Sombra dorada premium
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }], // Efecto de hundimiento
        opacity: 0.95,
    },
    buttonDisabled: {
        opacity: 0.5,
        backgroundColor: "#555",
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: "#000", // Texto negro sobre dorado
        fontSize: 17,
        fontWeight: "800",
        letterSpacing: -0.2,
    },
    footer: {
        marginTop: 'auto', // Empuja el footer al final
        marginBottom: 30,
        alignItems: "center",
    },
    loginLink: {
        flexDirection: 'row',
        padding: 10,
    },
    footerText: {
        color: "#555",
        fontSize: 15,
        fontWeight: '500',
    },
    footerLinkBold: {
        color: "#D4AF37",
        fontSize: 15,
        fontWeight: "700",
    },
});