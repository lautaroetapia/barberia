import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    KeyboardAvoidingView,
    Platform,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import { getBarberClientNote, saveBarberClientNote } from "@/lib/barber-client-notes";
import { getOwnerAppointmentsMap } from "@/lib/owner-agenda";

type ClientRow = {
    name: string;
    totalVisits: number;
    noShows: number;
    hasPenalty: boolean;
    lastVisitDateKey: string;
    lastVisitLabel: string;
    totalVisitsLabel: string;
};

const toDateValue = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-");
    return Number(`${year}${month}${day}`);
};

const toDisplayDate = (dateKey: string) => {
    const [year, month, day] = dateKey.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

type ToastType = "success" | "info" | "error";

export default function ClientsManagementScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
    const [clientNote, setClientNote] = useState("");
    const [isSavingNote, setIsSavingNote] = useState(false);
    const [toast, setToast] = useState<{ visible: boolean; message: string; type: ToastType }>({
        visible: false,
        message: "",
        type: "info",
    });

    const loadClients = useCallback(async () => {
        const appointmentsMap = await getOwnerAppointmentsMap();
        const byClient = new Map<
            string,
            {
                totalVisits: number;
                noShows: number;
                lastVisitDateKey: string;
            }
        >();

        Object.entries(appointmentsMap).forEach(([dateKey, appointments]) => {
            appointments.forEach((appointment) => {
                const clientName = appointment.client.trim();
                if (!clientName || appointment.status === "libre" || clientName.toLowerCase() === "disponible") {
                    return;
                }

                const current = byClient.get(clientName) ?? {
                    totalVisits: 0,
                    noShows: 0,
                    lastVisitDateKey: dateKey,
                };

                current.totalVisits += 1;
                if (appointment.status === "no_asistio") {
                    current.noShows += 1;
                }

                if (toDateValue(dateKey) > toDateValue(current.lastVisitDateKey)) {
                    current.lastVisitDateKey = dateKey;
                }

                byClient.set(clientName, current);
            });
        });

        const rows: ClientRow[] = Array.from(byClient.entries())
            .map(([name, data]) => ({
                name,
                totalVisits: data.totalVisits,
                noShows: data.noShows,
                hasPenalty: data.noShows > 0,
                lastVisitDateKey: data.lastVisitDateKey,
                lastVisitLabel: `Ultima visita: ${toDisplayDate(data.lastVisitDateKey)}`,
                totalVisitsLabel: `Total visitas: ${data.totalVisits}`,
            }))
            .sort((a, b) => toDateValue(b.lastVisitDateKey) - toDateValue(a.lastVisitDateKey));

        setClients(rows);
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadClients();
        }, [loadClients]),
    );

    const filteredClients = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) {
            return clients;
        }

        return clients.filter((client) => {
            const inName = client.name.toLowerCase().includes(q);
            const inDate = client.lastVisitLabel.toLowerCase().includes(q);
            return inName || inDate;
        });
    }, [clients, searchQuery]);

    const openClientDetail = useCallback(async (client: ClientRow) => {
        setSelectedClient(client);
        const note = await getBarberClientNote(client.name);
        setClientNote(note);
    }, []);

    const handleSaveNote = useCallback(async () => {
        if (!selectedClient || isSavingNote) {
            return;
        }

        setIsSavingNote(true);
        try {
            await saveBarberClientNote(selectedClient.name, clientNote.trim());
            setToast({
                visible: true,
                message: "Nota guardada correctamente.",
                type: "success",
            });
            setSelectedClient(null);
        } catch {
            setToast({
                visible: true,
                message: "No se pudo guardar la nota.",
                type: "error",
            });
        } finally {
            setIsSavingNote(false);
        }
    }, [clientNote, isSavingNote, selectedClient]);


    return (
        <View style={styles.screen}>
            <OwnerToast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onHide={() => setToast({ visible: false, message: "", type: "info" })}
            />

            <View style={styles.topBar}>
                <Pressable style={styles.backButton} onPress={() => router.replace("/barber/barber-my-agenda")}>
                    <Feather name="chevron-left" size={24} color="#d4af37" />
                </Pressable>
                <Text style={styles.brand}>CLIENTES</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Directorio</Text>
                    <Text style={styles.subtitle}>{clients.length} clientes registrados</Text>
                </View>

                {/* SEARCH BAR */}
                <View style={styles.searchContainer}>
                    <Feather name="search" size={18} color="#555" style={styles.searchIcon} />
                    <TextInput
                        style={styles.search}
                        placeholder="Nombre o fecha..."
                        placeholderTextColor="#555"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {/* CLIENT LIST */}
                <View style={styles.listContainer}>
                    {filteredClients.map((client) => (
                        <Pressable
                            key={client.name}
                            style={styles.clientCard}
                            onPress={() => void openClientDetail(client)}
                        >
                            <View style={[styles.avatar, client.hasPenalty && styles.avatarWarning]}>
                                <Text style={[styles.avatarText, client.hasPenalty && styles.avatarTextWarning]}>
                                    {client.name.split(" ").map(p => p[0]).join("").toUpperCase()}
                                </Text>
                            </View>
                            
                            <View style={styles.clientInfo}>
                                <Text style={styles.clientName}>{client.name}</Text>
                                <View style={styles.statsRow}>
                                    <View style={styles.statItem}>
                                        <Feather name="calendar" size={10} color="#777" />
                                        <Text style={styles.clientMeta}>{client.lastVisitLabel.replace('Ultima visita: ', '')}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Feather name="check-circle" size={10} color="#d4af37" />
                                        <Text style={styles.clientMeta}>{client.totalVisitsLabel.replace('Total visitas: ', '')} citas</Text>
                                    </View>
                                </View>
                            </View>

                            {client.hasPenalty && (
                                <View style={styles.warningIcon}>
                                    <MaterialIcons name="report-problem" size={18} color="#ffb4ab" />
                                </View>
                            )}
                            <Feather name="chevron-right" size={18} color="#333" />
                        </Pressable>
                    ))}
                </View>

                {!filteredClients.length && (
                    <View style={styles.emptyState}>
                        <Feather name="users" size={48} color="#222" />
                        <Text style={styles.emptyStateTitle}>Sin resultados</Text>
                        <Text style={styles.emptyStateText}>No encontramos coincidencias para "{searchQuery}"</Text>
                    </View>
                )}
            </ScrollView>

            {/* MODAL DETALLE / NOTAS */}
            <Modal
                visible={Boolean(selectedClient)}
                transparent
                animationType="slide"
                onRequestClose={() => setSelectedClient(null)}
            >
                <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <Pressable style={styles.modalDismiss} onPress={() => setSelectedClient(null)} />
                    <View style={styles.modalContent}>
                        <View style={styles.modalIndicator} />
                        
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{selectedClient?.name}</Text>
                                <Text style={styles.modalSubtitle}>Notas internas y recordatorios</Text>
                            </View>
                            {selectedClient?.hasPenalty && (
                                <View style={styles.penaltyBadge}>
                                    <Text style={styles.penaltyBadgeText}>{selectedClient.noShows} NO-SHOWS</Text>
                                </View>
                            )}
                        </View>

                        <TextInput
                            style={styles.noteInput}
                            value={clientNote}
                            onChangeText={setClientNote}
                            placeholder="Ej: Prefiere corte degradado bajo, no usar cera..."
                            placeholderTextColor="#444"
                            multiline
                        />

                        <View style={styles.modalFooter}>
                            <Pressable style={styles.cancelButton} onPress={() => setSelectedClient(null)}>
                                <Text style={styles.cancelButtonText}>Cerrar</Text>
                            </Pressable>
                            <Pressable 
                                style={[styles.saveButton, isSavingNote && styles.saveButtonDisabled]} 
                                onPress={() => void handleSaveNote()}
                                disabled={isSavingNote}
                            >
                                <Text style={styles.saveButtonText}>
                                    {isSavingNote ? "Guardando..." : "Guardar Nota"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <BarberRoleNav mode="barber" current="clientes" />
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: "#080808" },
    topBar: {
        height: 100,
        paddingTop: 45,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
    brand: { color: "#d4af37", fontSize: 12, fontWeight: "900", letterSpacing: 2 },
    
    content: { paddingHorizontal: 20, paddingBottom: 120 },
    header: { marginBottom: 20 },
    title: { color: "#fff", fontSize: 32, fontWeight: "800" },
    subtitle: { color: "#555", fontSize: 14, marginTop: 4 },

    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: "#111",
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        marginBottom: 20,
    },
    searchIcon: { marginRight: 10 },
    search: { flex: 1, color: "#fff", fontSize: 16 },

    listContainer: { gap: 10 },
    clientCard: {
        backgroundColor: "#111",
        borderRadius: 18,
        padding: 12,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#1a1a1a",
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 15,
        backgroundColor: "#1a1a1a",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 15,
        borderWidth: 1,
        borderColor: "#222"
    },
    avatarWarning: { backgroundColor: "rgba(255, 68, 102, 0.1)", borderColor: "rgba(255, 68, 102, 0.2)" },
    avatarText: { color: "#d4af37", fontWeight: "800", fontSize: 16 },
    avatarTextWarning: { color: "#ff4466" },

    clientInfo: { flex: 1, gap: 4 },
    clientName: { color: "#fff", fontSize: 17, fontWeight: "700" },
    statsRow: { flexDirection: 'row', gap: 12 },
    statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    clientMeta: { color: "#555", fontSize: 12, fontWeight: "600" },
    warningIcon: { marginRight: 10 },

    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, gap: 10 },
    emptyStateTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
    emptyStateText: { color: "#555", textAlign: 'center' },

    // Modal Styles
    modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: "rgba(0,0,0,0.8)" },
    modalDismiss: { flex: 1 },
    modalContent: {
        backgroundColor: "#111",
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        paddingTop: 15,
        borderWidth: 1,
        borderColor: "#222",
    },
    modalIndicator: { width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    modalTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
    modalSubtitle: { color: "#555", fontSize: 14 },
    penaltyBadge: { backgroundColor: "rgba(255, 68, 102, 0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    penaltyBadgeText: { color: "#ff4466", fontSize: 10, fontWeight: "900" },

    noteInput: {
        backgroundColor: "#080808",
        borderRadius: 20,
        padding: 20,
        color: "#fff",
        fontSize: 16,
        minHeight: 150,
        borderWidth: 1,
        borderColor: "#1a1a1a",
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    modalFooter: { flexDirection: 'row', gap: 10 },
    cancelButton: { flex: 1, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: "#1a1a1a" },
    cancelButtonText: { color: "#fff", fontWeight: "700" },
    saveButton: { flex: 2, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: "#d4af37" },
    saveButtonText: { color: "#000", fontWeight: "900", textTransform: 'uppercase' },
    saveButtonDisabled: { opacity: 0.5 }
});