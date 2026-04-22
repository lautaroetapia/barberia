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

const IMAGE_URI = "https://lh3.googleusercontent.com/aida-public/AB6AXuCd_prQ72qfD_jFg4TrHaSUwoWPrNoEupRhESASxUsbtIUB4DvEEFMEY8aDdpTQoedZvui5bIQXItDsorX_Q4uIns1y1hOXP9xiq8YFYa2B7U9inPV5Cde40wASld9btp9EgkGN0-YeNg5mJXBmdplxTGXvgcTVmQOL7M24QJvFyg5Mk_JNSgjLh6_lM0HtiushsXxYkm7qxdtkEQt7gokVFfzU0rvB37EM8feazRBkkS4Bs2lWCU7mtlAzKSdBUFxtZ6ykhFFWhqXO";

export default function StepTwoScreen() {
    const { height: screenHeight } = useWindowDimensions();
    const sheetHeight = Math.round(
        Math.min(400, Math.max(340, screenHeight * 0.43)),
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.hero}>
                <View style={styles.imageWrap}>
                    <Image
                        source={{ uri: IMAGE_URI }}
                        style={styles.image}
                        contentFit="cover"
                        contentPosition="top"
                    />
                </View>
            </View>

            <View style={[styles.sheet, { height: sheetHeight }]}>
                <View style={styles.progressRow}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressActive} />
                    <View style={styles.progressDot} />
                </View>

                <View style={styles.copyBlock}>
                    {/* Etiqueta superior sutil */}
                    <Text style={styles.overline}>PERSONALIZACIÓN</Text>
                    
                    <Text style={styles.title}>
                        Elegí a tu{"\n"}
                        <Text style={styles.titleGold}>estilista</Text>
                    </Text>
                    
                    <Text style={styles.subtitle}>
                        Conocé a nuestros barberos expertos y seleccioná el estilo que mejor hable de vos.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <Pressable
                        style={({ pressed }) => [
                            styles.button,
                            pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }
                        ]}
                        onPress={() => router.push("/onboarding/step-3")}
                    >
                        <Text style={styles.buttonText}>SIGUIENTE</Text>
                    </Pressable>

                    <Pressable onPress={() => router.push("/auth/login")}>
                        <Text style={styles.linkText}>
                            ¿Ya tenés cuenta? <Text style={styles.linkTextStrong}>Iniciar sesión</Text>
                        </Text>
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
    },
    imageWrap: {
        flex: 1,
        backgroundColor: "#0A0A0A",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    sheet: {
        backgroundColor: "#121212",
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingTop: 32,
        paddingHorizontal: 36,
        paddingBottom: 40,
        shadowColor: "#000",
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
    },
    progressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 32,
    },
    progressDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "rgba(212, 175, 55, 0.2)",
    },
    progressActive: {
        width: 28,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#D4AF37",
    },
    copyBlock: {
        gap: 8,
    },
    // --- OPTIMIZACIÓN DE LETRAS ---
    overline: {
        color: "#D4AF37",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 3, // Mucho espacio para look de marca de lujo
        marginBottom: 8,
    },
    title: {
        color: "#FFFFFF",
        fontSize: 36,
        lineHeight: 40,
        fontWeight: "900", // Peso máximo para impacto
        letterSpacing: -1.2, // Kerning negativo para look moderno/editorial
    },
    titleGold: {
        color: "#D4AF37",
        fontWeight: "300", // Contraste de peso: Extra Bold + Light
    },
    subtitle: {
        color: "rgba(255, 255, 255, 0.5)",
        fontSize: 16,
        lineHeight: 24, // Interlineado generoso para legibilidad
        fontWeight: "400",
        marginTop: 12,
    },
    buttonText: {
        color: "#1A1A1A",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 2, // Espaciado para botones "caps"
    },
    linkText: {
        color: "rgba(255, 255, 255, 0.4)",
        textAlign: "center",
        fontSize: 14,
    },
    linkTextStrong: {
        color: "#D4AF37",
        fontWeight: "700",
    },
    // ------------------------------
    footer: {
        marginTop: "auto",
        gap: 20,
    },
    button: {
        height: 60,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#D4AF37",
        shadowColor: "#D4AF37",
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
});