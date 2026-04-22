import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, SafeAreaView } from "react-native";

import {
    getFavoriteBarbers,
    getFavoriteShops,
    removeFavoriteBarber,
    removeFavoriteShop,
    type FavoriteBarber,
    type FavoriteShop,
} from "@/lib/favorites";

export default function FavoritesScreen() {
    const [activeTab, setActiveTab] = useState<"barberias" | "barberos">("barberias");
    const [favoriteShops, setFavoriteShops] = useState<FavoriteShop[]>([]);
    const [favoriteBarbers, setFavoriteBarbers] = useState<FavoriteBarber[]>([]);

    useFocusEffect(
        useCallback(() => {
            let isMounted = true;
            const loadFavorites = async () => {
                const [shops, barbers] = await Promise.all([
                    getFavoriteShops(),
                    getFavoriteBarbers(),
                ]);
                if (isMounted) {
                    setFavoriteShops(shops);
                    setFavoriteBarbers(barbers);
                }
            };
            loadFavorites();
            return () => { isMounted = false; };
        }, [])
    );

    const handleRemoveShop = async (shopId: string) => {
        const nextFavorites = await removeFavoriteShop(shopId);
        setFavoriteShops(nextFavorites);
    };

    const handleRemoveBarber = async (barberId: string) => {
        const nextFavorites = await removeFavoriteBarber(barberId);
        setFavoriteBarbers(nextFavorites);
    };

    return (
        <SafeAreaView style={styles.screen}>
            {/* HEADER PREMIUM */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <MaterialIcons name="keyboard-backspace" size={26} color="#d4af37" />
                </Pressable>
                <Text style={styles.headerTitle}>Mis Favoritos</Text>
                <View style={styles.headerSpacer} />
            </View>

            {/* TAB SELECTOR */}
            <View style={styles.tabContainer}>
                <View style={styles.tabTrack}>
                    <Pressable
                        style={[styles.tab, activeTab === "barberias" && styles.tabActive]}
                        onPress={() => setActiveTab("barberias")}
                    >
                        <Text style={[styles.tabText, activeTab === "barberias" && styles.tabTextActive]}>
                            Barberías
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.tab, activeTab === "barberos" && styles.tabActive]}
                        onPress={() => setActiveTab("barberos")}
                    >
                        <Text style={[styles.tabText, activeTab === "barberos" && styles.tabTextActive]}>
                            Maestros
                        </Text>
                    </Pressable>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === "barberias" ? (
                    favoriteShops.length > 0 ? (
                        <View style={styles.cardsWrap}>
                            {favoriteShops.map((shop) => (
                                <View key={shop.id} style={styles.shopCard}>
                                    <View style={styles.shopImageWrap}>
                                        <Image
                                            source={{ uri: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop" }}
                                            style={styles.shopImage}
                                            contentFit="cover"
                                        />
                                        <Pressable
                                            style={styles.floatingFavButton}
                                            onPress={() => handleRemoveShop(shop.id)}
                                        >
                                            <MaterialIcons name="favorite" size={20} color="#d4af37" />
                                        </Pressable>
                                    </View>

                                    <View style={styles.shopBody}>
                                        <View style={styles.shopInfoRow}>
                                            <Text style={styles.shopTitle} numberOfLines={1}>{shop.name}</Text>
                                            <View style={styles.ratingBadge}>
                                                <MaterialIcons name="star" size={14} color="#000" />
                                                <Text style={styles.ratingText}>4.8</Text>
                                            </View>
                                        </View>

                                        <View style={styles.locationRow}>
                                            <MaterialIcons name="location-pin" size={14} color="#888" />
                                            <Text style={styles.shopAddress} numberOfLines={1}>{shop.address}</Text>
                                        </View>

                                        <Pressable
                                            style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.8 }]}
                                            onPress={() => router.push({
                                                pathname: "/(tabs)/booking-service",
                                                params: { shopId: shop.id, shopName: shop.name },
                                            })}
                                        >
                                            <Text style={styles.primaryButtonText}>Agendar Cita</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <EmptyState message="No tienes barberías favoritas todavía." />
                    )
                ) : favoriteBarbers.length > 0 ? (
                    <View style={styles.barberList}>
                        {favoriteBarbers.map((barber) => (
                            <View key={barber.id} style={styles.barberCard}>
                                <Image source={{ uri: barber.image }} style={styles.barberAvatar} />
                                <View style={styles.barberInfo}>
                                    <Text style={styles.barberName}>{barber.name}</Text>
                                    <Text style={styles.barberRole}>{barber.role} • {barber.branch}</Text>
                                    <Pressable 
                                        style={styles.barberAction}
                                        onPress={() => router.push({
                                            pathname: "/(tabs)/barber-profile",
                                            params: { ...barber, shopId: barber.shopId ?? "shop-1" }
                                        })}
                                    >
                                        <Text style={styles.barberActionText}>Ver Perfil</Text>
                                        <MaterialIcons name="chevron-right" size={16} color="#d4af37" />
                                    </Pressable>
                                </View>
                                <Pressable 
                                    style={styles.barberFavIcon}
                                    onPress={() => handleRemoveBarber(barber.id)}
                                >
                                    <MaterialIcons name="favorite" size={22} color="#d4af37" />
                                </Pressable>
                            </View>
                        ))}
                    </View>
                ) : (
                    <EmptyState message="Tu lista de maestros está vacía." />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const EmptyState = ({ message }: { message: string }) => (
    <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
            <MaterialIcons name="auto-fix-off" size={40} color="#333" />
        </View>
        <Text style={styles.emptyText}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#0A0A0A" },
    header: {
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        justifyContent: "space-between",
    },
    backButton: { width: 40, height: 40, justifyContent: "center" },
    headerTitle: { color: "#FFF", fontSize: 18, fontWeight: "900", letterSpacing: 1 },
    headerSpacer: { width: 40 },
    
    tabContainer: { paddingHorizontal: 20, marginVertical: 15 },
    tabTrack: {
        flexDirection: "row",
        backgroundColor: "#1A1A1A",
        borderRadius: 12,
        padding: 4,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
    tabActive: { backgroundColor: "#d4af37" },
    tabText: { color: "#888", fontWeight: "700", fontSize: 13 },
    tabTextActive: { color: "#000" },

    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    
    cardsWrap: { gap: 20 },
    shopCard: {
        backgroundColor: "#151515",
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#222",
    },
    shopImageWrap: { height: 160, width: "100%" },
    shopImage: { width: "100%", height: "100%" },
    floatingFavButton: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 8,
        borderRadius: 12,
    },
    shopBody: { padding: 16, gap: 8 },
    shopInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    shopTitle: { color: "#FFF", fontSize: 20, fontWeight: "800", flex: 1 },
    ratingBadge: {
        flexDirection: "row",
        backgroundColor: "#d4af37",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignItems: "center",
        gap: 4,
    },
    ratingText: { color: "#000", fontWeight: "900", fontSize: 12 },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    shopAddress: { color: "#888", fontSize: 13 },
    primaryButton: {
        backgroundColor: "#FFF",
        height: 48,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
    },
    primaryButtonText: { color: "#000", fontWeight: "900", fontSize: 14, textTransform: "uppercase" },

    barberList: { gap: 12 },
    barberCard: {
        flexDirection: "row",
        backgroundColor: "#151515",
        padding: 12,
        borderRadius: 18,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#222",
    },
    barberAvatar: { width: 65, height: 65, borderRadius: 15, borderWidth: 1, borderColor: "#333" },
    barberInfo: { flex: 1, marginLeft: 16, gap: 2 },
    barberName: { color: "#FFF", fontSize: 16, fontWeight: "800" },
    barberRole: { color: "#666", fontSize: 12 },
    barberAction: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    barberActionText: { color: "#d4af37", fontWeight: "700", fontSize: 12 },
    barberFavIcon: { padding: 8 },

    emptyContainer: { alignItems: "center", justifyContent: "center", marginTop: 100 },
    emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#111", justifyContent: "center", alignItems: "center", marginBottom: 16 },
    emptyText: { color: "#444", fontSize: 15, textAlign: "center", paddingHorizontal: 40 },
});