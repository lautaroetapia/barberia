import { Feather } from "@expo/vector-icons";
import type { User } from "@supabase/supabase-js";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { AppToast } from "@/components/ui/app-toast";
import { clearStoredActiveRole, setStoredActiveRole } from "@/lib/active-role";
import { supabase } from "@/lib/supabase";
import {
    getGoogleAvatarFromProviderToken,
    getUserAvatarUri,
    isGoogleUser,
} from "@/lib/user-avatar";

const AVATAR_URI = "https://lh3.googleusercontent.com/aida-public/AB6AXuCWYKuVp3vuT0rwxEuDBrkSNn8KvTqwU7RbMRlW5bv8vfz1USDoA4wbVR1NbqbJDnbNGaA-Mq1ct27V_ygg4dLGQ1sV3GkZvA0yIpjjqHRc8zxP7ogqjEXAeZH0HpPp92ZgKk4dRaPA3X2AEImQTqlBvhq3LRmoeJI04zTdnUec9iF3AyN3m1yTj7SLagDU8LWxnMxUEPmxHjHbI568eAT2BrtBqmQB-WB2D-jaXQ_YuBOJfvNbUqes8eqS_ZqVXaNRptt0CATEULZj";

export default function OwnerMoreSettingsScreen() {
    const [avatarUri, setAvatarUri] = useState(AVATAR_URI);
    const [userEmail, setUserEmail] = useState("Propietario");
    const [toast, setToast] = useState<{
        visible: boolean;
        message: string;
        type: "success" | "info" | "error";
    }>({ visible: false, message: "", type: "info" });

    useEffect(() => {
        let isMounted = true;
        const applyUserData = async (user: User | null) => {
            const { data: sessionData } = await supabase.auth.getSession();
            const sessionUser = sessionData.session?.user ?? null;
            const userForAvatar = sessionUser ?? user;

            if (userForAvatar?.email) setUserEmail(userForAvatar.email);

            const resolvedAvatar = getUserAvatarUri(userForAvatar, AVATAR_URI);
            setAvatarUri(resolvedAvatar);

            if (isGoogleUser(userForAvatar)) {
                const googleAvatar = await getGoogleAvatarFromProviderToken(
                    sessionData.session?.provider_token,
                );
                if (isMounted && googleAvatar) setAvatarUri(googleAvatar);
            }
        };

        supabase.auth.getUser().then(({ data }) => {
            if (isMounted) void applyUserData(data.user ?? null);
        });

        return () => { isMounted = false; };
    }, []);

    const performSignOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            setToast({ visible: true, type: "error", message: error.message });
            return;
        }
        await clearStoredActiveRole();
        router.replace("/auth/login");
    };

    const SettingOption = ({ icon, label, onPress, variant = "default" }: any) => (
        <Pressable 
            style={[styles.option, variant === "danger" && styles.optionDanger]} 
            onPress={onPress}
        >
            <View style={styles.optionLeft}>
                <View style={[styles.iconContainer, variant === "highlight" && styles.iconHighlight]}>
                    <Feather 
                        name={icon} 
                        size={18} 
                        color={variant === "danger" ? "#ffb4ab" : variant === "highlight" ? "#000" : "#d4af37"} 
                    />
                </View>
                <Text style={[styles.optionText, variant === "danger" && styles.optionTextDanger]}>{label}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#444" />
        </Pressable>
    );

    return (
        <View style={styles.screen}>
            <AppToast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ visible: false, message: "", type: "info" })}
            />

            <View style={styles.topBar}>
                <Text style={styles.brand}>NAVAJA DORADA</Text>
                <View style={styles.statusBadge}>
                    <View style={styles.dot} />
                    <Text style={styles.statusText}>Owner</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* Perfil Header */}
                <View style={styles.profileCard}>
                    <Image source={{ uri: avatarUri }} style={styles.largeAvatar} contentFit="cover" />
                    <View>
                        <Text style={styles.profileWelcome}>Panel de Control</Text>
                        <Text style={styles.profileEmail} numberOfLines={1}>{userEmail}</Text>
                    </View>
                </View>

                {/* Grupo: Negocio */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mi Barbería</Text>
                    <SettingOption 
                        icon="home" 
                        label="Datos de barbería" 
                        onPress={() => router.push("/barber/owner-barbershop-profile")} 
                    />
                    <SettingOption 
                        icon="calendar" 
                        label="Horario semanal" 
                        onPress={() => router.push("/barber/owner-agenda")} 
                    />
                    <SettingOption 
                        icon="clock" 
                        label="Franjas de turnos" 
                        onPress={() => router.push("/barber/owner-shifts")} 
                    />
                    <SettingOption 
                        icon="bar-chart-2" 
                        label="Reportes de ventas" 
                        onPress={() => router.push("/barber/owner-reports")} 
                    />
                </View>

                {/* Grupo: Configuración */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Configuración</Text>
                    <SettingOption 
                        icon="shield" 
                        label="Políticas y Cancelación" 
                        onPress={() => router.push("/barber/owner-policies")} 
                    />
                    <SettingOption 
                        icon="refresh-cw" 
                        label="Cambiar a vista Barbero" 
                        variant="highlight"
                        onPress={async () => {
                            await setStoredActiveRole("barbero");
                            router.replace("/barber/barber-my-agenda");
                        }} 
                    />
                </View>

                {/* Grupo: Soporte y Cuenta */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ayuda</Text>
                    <SettingOption 
                        icon="help-circle" 
                        label="Soporte Técnico" 
                        onPress={() => router.push("/barber/owner-support")} 
                    />
                    <SettingOption 
                        icon="log-out" 
                        label="Cerrar sesión" 
                        variant="danger"
                        onPress={() => {
                            Alert.alert("Cerrar sesión", "¿Estás seguro?", [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Cerrar sesión", style: "destructive", onPress: performSignOut },
                            ]);
                        }} 
                    />
                </View>

                <Text style={styles.versionText}>NAVAJA DORADA V2.1.0 • 2026</Text>
            </ScrollView>

            <BarberRoleNav mode="owner" current="mas" />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#080808" },
    topBar: {
        height: 100,
        paddingTop: 45,
        paddingHorizontal: 25,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    brand: { color: "#d4af37", fontSize: 14, fontWeight: "900", letterSpacing: 4 },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#151515',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#222'
    },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#d4af37', marginRight: 6 },
    statusText: { color: '#888', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    
    content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 120 },
    
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#121212',
        padding: 20,
        borderRadius: 24,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#1a1a1a'
    },
    largeAvatar: { width: 55, height: 55, borderRadius: 20, marginRight: 15, borderWidth: 1, borderColor: '#d4af37' },
    profileWelcome: { color: '#555', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    profileEmail: { color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 },

    section: { marginBottom: 25 },
    sectionTitle: { color: "#444", fontSize: 11, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 10, marginBottom: 10 },
    
    option: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#121212',
        paddingHorizontal: 15,
        borderRadius: 18,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#1a1a1a'
    },
    optionDanger: { borderColor: 'rgba(255,180,171,0.1)' },
    optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#1a1a1a',
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconHighlight: { backgroundColor: '#d4af37' },
    optionText: { color: '#e5e2e1', fontSize: 15, fontWeight: '600' },
    optionTextDanger: { color: '#ffb4ab' },
    
    versionText: { textAlign: 'center', color: '#222', fontSize: 10, fontWeight: '800', marginTop: 10, letterSpacing: 1 }
});