import { Image } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";

const IMAGE_URI = "https://lh3.googleusercontent.com/aida-public/AB6AXuDeB_-RYCV8JurLrp589nxnbhls3S1b9GVZDOv1vykFUiKd11m1spPPY8jAFNyFb2tck05Df7IbanAXadsLEaGcyPVYd5zPf7WeO_8lc0YSN01MyHJqr0nryERq6Vorw94OIZMcu_oh3-FOfiGD9lkKVm0F--8rrlr-vKtjpgRQjitUarqbKqJ4crn0zPpl-UyAsjgB_k7hlMtFYitBua0Z05-3NorsDrPi3X12GVFjTjM5SW4Ly7g0FYGjKGtcOZg2Alq5_vWW32Db";

export default function StepThreeScreen() {
    const { height: screenHeight } = useWindowDimensions();
    const panelHeight = Math.round(
        Math.min(420, Math.max(340, screenHeight * 0.45)),
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.hero}>
                <View style={styles.heroInner}>
                    <View style={styles.imageFrame}>
                        <Image
                            source={{ uri: IMAGE_URI }}
                            style={styles.image}
                            contentFit="cover"
                        />
                    </View>
                </View>
            </View>

            <View style={[styles.panel, { height: panelHeight }]}>
                <View style={styles.copyBlock}>
                    {/* Texto pequeño superior para dar contexto de marca */}
                    <Text style={styles.overhead}>NOTIFICACIONES</Text>
                    
                    <Text style={styles.title}>
                        Nunca más{"\n"}
                        <Text style={styles.titleAccent}>pierdas un turno</Text>
                    </Text>
                    
                    <Text style={styles.subtitle}>
                        Activá los recordatorios personalizados y mantené tu estilo siempre impecable.
                    </Text>
                </View>

                <View style={styles.actions}>
                    <View style={styles.progressRow}>
                        <View style={styles.progressDot} />
                        <View style={styles.progressDot} />
                        <View style={styles.progressActive} />
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => router.replace("/auth/login")}
                    >
                        <Text style={styles.buttonText}>COMENZAR</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0A0A0A",
    },
    hero: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    imageFrame: {
        width: 280,
        height: 280,
        borderRadius: 140, // Cambio a circular para suavizar el diseño final
        borderWidth: 1,
        borderColor: "rgba(212, 175, 55, 0.3)",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    panel: {
        paddingHorizontal: 32,
        paddingBottom: 40,
        justifyContent: "space-between",
    },
    copyBlock: {
        alignItems: "center",
    },
    // --- MEJORA DE LETRAS ---
    overhead: {
        color: "#D4AF37",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 3, // Espaciado amplio para estilo premium
        marginBottom: 16,
        textAlign: "center",
    },
    title: {
        color: "#FFFFFF",
        textAlign: "center",
        fontSize: 38,
        lineHeight: 42, // Interlineado ajustado para que no se vea amontonado
        fontWeight: "900", // Extra bold
        letterSpacing: -1, // Un poco más juntas para un look moderno
    },
    titleAccent: {
        color: "#D4AF37", // Resaltamos la acción principal en dorado
        fontWeight: "300", // Jugamos con un peso más fino para contraste elegante
    },
    subtitle: {
        color: "rgba(255, 255, 255, 0.5)",
        textAlign: "center",
        fontSize: 16,
        lineHeight: 24,
        marginTop: 20,
        fontWeight: "400",
        paddingHorizontal: 10,
    },
    buttonText: {
        color: "#1A1A1A",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 2, // Estilo capsular (todo mayúsculas + espaciado)
    },
    // ------------------------
    actions: {
        gap: 30,
    },
    progressRow: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
    },
    progressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#333",
    },
    progressActive: {
        width: 24,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#D4AF37",
    },
    button: {
        height: 60,
        backgroundColor: "#D4AF37",
        borderRadius: 30,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#D4AF37",
        shadowOpacity: 0.3,
        shadowRadius: 15,
        shadowOffset: { width: 0, height: 8 },
    },
});