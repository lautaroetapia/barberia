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
                message: "Configuración de Supabase pendiente.",
            });
            return;
        }

        if (!newPassword || !confirmPassword) {
            setErrorMessage("Por favor, completa ambos campos.");
            return;
        }

        if (newPassword.length < 6) {
            setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Las contraseñas no coinciden.");
            return;
        }

        setErrorMessage("");
        setIsResetting(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        setIsResetting(false);

        if (error) {
            // Manejo amable de errores de Supabase
            if (error.message.includes("Password should be different")) {
                setErrorMessage("La nueva contraseña debe ser diferente a la anterior.");
            } else {
                setErrorMessage("Ocurrió un error. Inténtalo de nuevo más tarde.");
            }
            return;
        }

        setToast({
            visible: true,
            type: "success",
            message: "Contraseña actualizada correctamente.",
        });
        
        // Pequeño delay para que el usuario vea el éxito antes de redirigir
        setTimeout(() => {
            router.replace("/auth/login");
        }, 1500);
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
                <View style={styles.topSection}>
                    <Text style={styles.title}>Nueva{"\n"}Contraseña</Text>
                    <Text style={styles.subtitle}>
                        Crea una clave segura que no hayas usado antes en esta cuenta.
                    </Text>
                </View>

                {/* FORMULARIO ESTILO PREMIUM */}
                <View style={styles.form}>
                    {/* INPUT 1 - NUEVA CONTRASEÑA */}
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="lock-outline" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            value={newPassword}
                            onChangeText={(text) => {
                                setNewPassword(text);
                                if (errorMessage) setErrorMessage("");
                            }}
                            style={styles.input}
                            placeholder="Nueva contraseña"
                            placeholderTextColor="#555"
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="next"
                        />
                        <Pressable 
                            onPress={() => setShowNewPassword(!showNewPassword)}
                            style={styles.eyeIcon}
                            accessibilityRole="button"
                            accessibilityLabel={showNewPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            <MaterialIcons 
                                name={showNewPassword ? "visibility" : "visibility-off"} 
                                size={20} 
                                color={showNewPassword ? "#D4AF37" : "#444"} 
                            />
                        </Pressable>
                    </View>

                    {/* INPUT 2 - CONFIRMAR CONTRASEÑA */}
                    <View style={styles.inputWrapper}>
                        <MaterialIcons name="lock-reset" size={20} color="#666" style={styles.icon} />
                        <TextInput
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (errorMessage) setErrorMessage("");
                            }}
                            style={styles.input}
                            placeholder="Confirmar contraseña"
                            placeholderTextColor="#555"
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleResetPassword}
                        />
                        <Pressable 
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={styles.eyeIcon}
                            accessibilityRole="button"
                            accessibilityLabel={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            <MaterialIcons 
                                name={showConfirmPassword ? "visibility" : "visibility-off"} 
                                size={20} 
                                color={showConfirmPassword ? "#D4AF37" : "#444"} 
                            />
                        </Pressable>
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
                            isResetting && styles.buttonDisabled
                        ]}
                        onPress={handleResetPassword}
                        disabled={isResetting}
                    >
                        {isResetting ? (
                            <ActivityIndicator color="#000" />
                        ) : (
                            <>
                                <Text style={styles.submitButtonText}>Actualizar Contraseña</Text>
                                <MaterialIcons name="check-circle" size={20} color="#000" />
                            </>
                        )}
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
    header: {
        height: 60,
        paddingHorizontal: 16,
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
    topSection: {
        marginTop: 20,
        marginBottom: 40,
    },
    title: {
        color: "#FFF",
        fontSize: 36,
        fontWeight: "900",
        lineHeight: 42,
        letterSpacing: -1.5,
    },
    subtitle: {
        color: "#888", // Gris medio para lectura suave
        fontSize: 16,
        marginTop: 15,
        lineHeight: 24,
        fontWeight: '400',
    },
    form: {
        gap: 16,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111", // Fondo del input ligeramente más claro que el screen
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#222",
        paddingHorizontal: 18,
        height: 64,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        color: "#FFF",
        fontSize: 16,
        fontWeight: "600",
    },
    eyeIcon: {
        padding: 8, // Área de toque más grande para el icono de ojo
        marginRight: -5,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
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
        marginTop: 25,
        gap: 10,
        // Sombra dorada premium sutil
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }], // Efecto de hundimiento
        opacity: 0.9,
    },
    buttonDisabled: {
        opacity: 0.6,
        backgroundColor: "#555",
        shadowOpacity: 0,
    },
    submitButtonText: {
        color: "#000", // Texto negro sobre dorado
        fontSize: 17,
        fontWeight: "800",
        letterSpacing: -0.2,
    },
});