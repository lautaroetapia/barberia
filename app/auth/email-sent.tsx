import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Pressable,
    StyleSheet,
    Text,
    View,
    Dimensions,
} from "react-native";

import { AppToast } from "@/components/ui/app-toast";
import { isSupabaseConfigured, supabase } from "../../lib/supabase";

const { width } = Dimensions.get("window");

export default function EmailSentScreen() {
    const params = useLocalSearchParams<{ email?: string }>();
    const [isResending, setIsResending] = useState(false);
    const [toast, setToast] = useState<{
        visible: boolean;
        message: string;
        type: "success" | "info" | "error";
    }>({ visible: false, message: "", type: "info" });

    const handleOpenMail = async () => {
        const canOpen = await Linking.canOpenURL("mailto:");
        if (!canOpen) {
            setToast({
                visible: true,
                type: "error",
                message: "No encontramos una app de correo instalada.",
            });
            return;
        }
        await Linking.openURL("mailto:");
    };

    const handleResend = async () => {
        if (!isSupabaseConfigured) return;

        const email = typeof params.email === "string" ? params.email : "";
        if (!email) {
            setToast({ visible: true, type: "error", message: "Correo no encontrado." });
            return;
        }

        setIsResending(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: "barberia://auth/new-password",
        });
        setIsResending(false);

        if (error) {
            setToast({ visible: true, type: "error", message: error.message });
            return;
        }

        setToast({
            visible: true,
            type: "success",
            message: "Enlace reenviado con éxito.",
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

            <View style={styles.container}>
                {/* --- ÁREA DE ILUSTRACIÓN --- */}
                <View style={styles.illustrationContainer}>
                    <View style={styles.outerGlow} />
                    <View style={styles.iconBackdrop}>
                        <MaterialIcons name="mark-email-read" size={64} color="#D4AF37" />
                        <View style={styles.statusBadge}>
                            <MaterialIcons name="check" size={16} color="#000" />
                        </View>
                    </View>
                </View>

                {/* --- TEXTO PRINCIPAL --- */}
                <View style={styles.content}>
                    <Text style={styles.overline}>REABLECER CONTRASEÑA</Text>
                    <Text style={styles.title}>¡Listo! Revisa tu correo</Text>
                    <Text style={styles.subtitle}>
                        Hemos enviado un enlace seguro a <Text style={styles.emailHighlight}>{params.email || "tu bandeja"}</Text>.
                        {"\n"}Expira en 60 minutos.
                    </Text>
                </View>

                {/* --- ACCIONES --- */}
                <View style={styles.actionWrapper}>
                    <Pressable 
                        style={({ pressed }) => [styles.btnPrimary, pressed && styles.btnPressed]} 
                        onPress={handleOpenMail}
                    >
                        <Text style={styles.btnPrimaryText}>Abrir Bandeja</Text>
                        <MaterialIcons name="open-in-new" size={20} color="#000" />
                    </Pressable>

                    <Pressable
                        style={[styles.btnSecondary, isResending && styles.btnDisabled]}
                        onPress={handleResend}
                        disabled={isResending}
                    >
                        {isResending ? (
                            <ActivityIndicator color="#D4AF37" size="small" />
                        ) : (
                            <>
                                <Text style={styles.btnSecondaryText}>No recibí nada, reenviar</Text>
                                <MaterialIcons name="refresh" size={18} color="#D4AF37" />
                            </>
                        )}
                    </Pressable>
                </View>

                {/* --- FOOTER --- */}
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.replace("/auth/login")}
                >
                    <MaterialIcons name="keyboard-backspace" size={18} color="#666" />
                    <Text style={styles.backButtonText}>Regresar al inicio de sesión</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: "#0A0A0A",
    },
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 30,
    },
    illustrationContainer: {
        width: 140,
        height: 140,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 30,
    },
    outerGlow: {
        position: "absolute",
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(212, 175, 55, 0.05)",
    },
    iconBackdrop: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#161616",
        borderWidth: 1,
        borderColor: "#222",
        justifyContent: "center",
        alignItems: "center",
        // Sombras
        shadowColor: "#D4AF37",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    statusBadge: {
        position: "absolute",
        bottom: 10,
        right: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#D4AF37",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 3,
        borderColor: "#0A0A0A",
    },
    content: {
        alignItems: "center",
        marginBottom: 40,
    },
    overline: {
        color: "#D4AF37",
        fontSize: 12,
        fontWeight: "900",
        letterSpacing: 2,
        marginBottom: 8,
    },
    title: {
        color: "#FFF",
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 12,
    },
    subtitle: {
        color: "#888",
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
    },
    emailHighlight: {
        color: "#D4AF37",
        fontWeight: "600",
    },
    actionWrapper: {
        width: "100%",
        gap: 12,
    },
    btnPrimary: {
        height: 56,
        backgroundColor: "#D4AF37",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    btnPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    btnPrimaryText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "800",
    },
    btnSecondary: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#222",
        backgroundColor: "#111",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    btnSecondaryText: {
        color: "#D4AF37",
        fontSize: 15,
        fontWeight: "600",
    },
    btnDisabled: {
        opacity: 0.5,
    },
    backButton: {
        marginTop: 30,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 10,
    },
    backButtonText: {
        color: "#666",
        fontSize: 14,
        fontWeight: "600",
    },
});