import { MaterialIcons } from "@expo/vector-icons";
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
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import {
    getBarberClientNote,
    saveBarberClientNote,
} from "@/lib/barber-client-notes";
import { getOwnerAppointmentsMap } from "@/lib/owner-agenda";

type ClientRow = {
  name: string;
  lastVisitLabel: string;
  totalVisitsLabel: string;
  hasPenalty: boolean;
  noShows: number;
};

const toDisplayDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-");
  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}/${month}/${year}`;
};

const toDateValue = (key: string) => {
  const [year, month, day] = key.split("-");
  return Number(`${year}${month}${day}`);
};

export default function ClientsManagementScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clientNote, setClientNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  const loadClients = useCallback(async () => {
    const appointmentsMap = await getOwnerAppointmentsMap();
    const byClient = new Map<
      string,
      { visits: number; noShows: number; lastDate: string }
    >();

    Object.entries(appointmentsMap).forEach(([dateKey, appointments]) => {
      appointments.forEach((appointment) => {
        if (appointment.status === "libre") {
          return;
        }

        const name = appointment.client.trim();
        if (!name) {
          return;
        }

        const existing = byClient.get(name) ?? {
          visits: 0,
          noShows: 0,
          lastDate: dateKey,
        };

        existing.visits += 1;
        if (appointment.status === "no_asistio") {
          existing.noShows += 1;
        }

        if (toDateValue(dateKey) > toDateValue(existing.lastDate)) {
          existing.lastDate = dateKey;
        }

        byClient.set(name, existing);
      });
    });

    const nextClients: ClientRow[] = Array.from(byClient.entries())
      .map(([name, value]) => ({
        name,
        lastVisitLabel: `Ultima visita: ${toDisplayDate(value.lastDate)}`,
        totalVisitsLabel: `Total visitas: ${value.visits}`,
        hasPenalty: value.noShows > 0,
        noShows: value.noShows,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setClients(nextClients);
  }, []);

  const openClientDetail = async (client: ClientRow) => {
    setSelectedClient(client);
    const note = await getBarberClientNote(client.name);
    setClientNote(note);
  };

  const handleSaveNote = async () => {
    if (!selectedClient || isSavingNote) {
      return;
    }

    setIsSavingNote(true);
    try {
      await saveBarberClientNote(selectedClient.name, clientNote.trim());
      setToast({
        visible: true,
        message: "Nota guardada",
        type: "success",
      });
    } finally {
      setIsSavingNote(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadClients();
    }, [loadClients]),
  );

  const filteredClients = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return clients;
    }

    return clients.filter((client) => {
      const name = client.name.toLowerCase();
      const meta1 = client.lastVisitLabel.toLowerCase();
      const meta2 = client.totalVisitsLabel.toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        meta1.includes(normalizedQuery) ||
        meta2.includes(normalizedQuery)
      );
    });
  }, [searchQuery]);

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ visible: false, message: "", type: "info" })}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.replace("/barber/barber-my-agenda")}
        >
          <MaterialIcons name="arrow-back" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Clientes</Text>
        <TextInput
          style={styles.search}
          placeholder="Buscar cliente..."
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredClients.map((client) => (
          <Pressable
            key={client.name}
            style={[
              styles.clientCard,
              client.hasPenalty && styles.clientCardWarning,
            ]}
            onPress={() => {
              void openClientDetail(client);
            }}
          >
            <View style={styles.initials}>
              <Text style={styles.initialsText}>
                {client.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </Text>
            </View>
            <View style={styles.clientBody}>
              <Text style={styles.clientName}>{client.name}</Text>
              <Text style={styles.clientMeta}>{client.lastVisitLabel}</Text>
              <Text style={styles.clientMeta}>{client.totalVisitsLabel}</Text>
              {client.hasPenalty ? (
                <Text style={styles.badge}>PENALIZACION</Text>
              ) : null}
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#99907c" />
          </Pressable>
        ))}

        {!filteredClients.length ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              No se encontraron clientes
            </Text>
            <Text style={styles.emptyStateText}>
              Ajusta tu busqueda e intenta de nuevo.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(selectedClient)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedClient(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {selectedClient?.name ?? "Cliente"}
            </Text>
            <Text style={styles.modalMeta}>
              {selectedClient?.lastVisitLabel ?? "-"}
            </Text>
            <Text style={styles.modalMeta}>
              {selectedClient?.totalVisitsLabel ?? "-"}
            </Text>
            <Text style={styles.modalMeta}>
              No asistio: {selectedClient?.noShows ?? 0}
            </Text>

            <TextInput
              style={styles.noteInput}
              value={clientNote}
              onChangeText={setClientNote}
              placeholder="Notas internas del cliente"
              placeholderTextColor="#777"
              multiline
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => setSelectedClient(null)}
              >
                <Text style={styles.modalCancelText}>Cerrar</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveButton}
                disabled={isSavingNote}
                onPress={() => {
                  void handleSaveNote();
                }}
              >
                <Text style={styles.modalSaveText}>
                  {isSavingNote ? "Guardando..." : "Guardar nota"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BarberRoleNav mode="barber" current="clientes" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  topBar: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(19,19,19,0.92)",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    color: "#d4af37",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
    gap: 12,
  },
  title: { color: "#e5e2e1", fontSize: 34, fontWeight: "800" },
  search: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    color: "#e5e2e1",
    paddingHorizontal: 14,
  },
  clientCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clientCardWarning: { borderLeftWidth: 2, borderLeftColor: "#ffb4ab" },
  initials: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#353535",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { color: "#e5e2e1", fontWeight: "700" },
  clientBody: { flex: 1 },
  clientName: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  clientMeta: { color: "#d0c5af", fontSize: 11, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    color: "#ffb4ab",
    backgroundColor: "rgba(147,0,10,0.25)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    fontSize: 9,
    fontWeight: "700",
  },
  emptyStateCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.22)",
    backgroundColor: "#1c1b1b",
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 4,
  },
  emptyStateTitle: {
    color: "#e5e2e1",
    fontSize: 15,
    fontWeight: "700",
  },
  emptyStateText: {
    color: "#d0c5af",
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    borderRadius: 14,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 16,
    gap: 8,
  },
  modalTitle: { color: "#e5e2e1", fontSize: 20, fontWeight: "800" },
  modalMeta: { color: "#d0c5af", fontSize: 12 },
  noteInput: {
    minHeight: 110,
    borderRadius: 10,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    color: "#e5e2e1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 6 },
  modalCancelButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4d4635",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: { color: "#d0c5af", fontSize: 13, fontWeight: "600" },
  modalSaveButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSaveText: { color: "#241a00", fontSize: 13, fontWeight: "800" },
});
