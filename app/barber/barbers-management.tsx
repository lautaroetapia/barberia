import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { OwnerToast } from "@/components/ui/owner-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { setStoredActiveRole } from "@/lib/active-role";
import {
    getOwnerBarberRequests,
    getOwnerBarbers,
    saveOwnerBarberRequests,
    saveOwnerBarbers,
    type OwnerBarber,
    type OwnerBarberRequest,
} from "@/lib/owner-barbers";
import { supabase } from "@/lib/supabase";

export default function BarbersManagementScreen() {
  // ... (Mantengo los mismos estados y lógica del original)
  const [barbers, setBarbers] = useState<OwnerBarber[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [pendingRequests, setPendingRequests] = useState<OwnerBarberRequest[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<OwnerBarberRequest | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "aprobar" | "rechazar" | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newBarberName, setNewBarberName] = useState("");
  const [newBarberEmail, setNewBarberEmail] = useState("");
  const [newBarberSpecialty, setNewBarberSpecialty] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({
    visible: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const [{ data: authData }, storedBarbers, storedRequests] =
        await Promise.all([
          supabase.auth.getUser(),
          getOwnerBarbers(),
          getOwnerBarberRequests(),
        ]);
      if (!isMounted) return;
      setCurrentUserId(authData.user?.id ?? "");
      setCurrentUserEmail(authData.user?.email?.trim().toLowerCase() ?? "");
      setBarbers(storedBarbers);
      setPendingRequests(storedRequests);
      setIsLoading(false);
    };
    void loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const ownerBarberActive = useMemo(() => {
    if (!currentUserId && !currentUserEmail) {
      return false;
    }

    return barbers.some((item) => {
      const byUserId =
        Boolean(currentUserId) && item.accountUserId === currentUserId;
      const byEmail =
        Boolean(currentUserEmail) &&
        item.accountEmail?.trim().toLowerCase() === currentUserEmail;
      return (byUserId || byEmail) && item.active;
    });
  }, [barbers, currentUserEmail, currentUserId]);

  const goBarberView = async () => {
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user ?? null;

    if (currentUser?.id) {
      const currentBarbers = await getOwnerBarbers(currentUser);
      const userEmail = currentUser.email?.trim().toLowerCase() ?? "";
      const matchedBarber = currentBarbers.find((barber) => {
        const byUserId = barber.accountUserId === currentUser.id;
        const byEmail =
          Boolean(userEmail) &&
          barber.accountEmail?.trim().toLowerCase() === userEmail;
        return byUserId || byEmail;
      });

      if (matchedBarber) {
        const nextBarbers = currentBarbers.map((barber) =>
          barber.id === matchedBarber.id
            ? {
                ...barber,
                active: true,
                accountUserId: currentUser.id,
                accountEmail: currentUser.email ?? barber.accountEmail,
              }
            : barber,
        );
        await saveOwnerBarbers(nextBarbers, currentUser);
      } else {
        const displayName =
          typeof currentUser.user_metadata?.display_name === "string" &&
          currentUser.user_metadata.display_name.trim()
            ? currentUser.user_metadata.display_name.trim()
            : currentUser.email?.split("@")[0]?.trim() || "Barbero";

        await saveOwnerBarbers(
          [
            ...currentBarbers,
            {
              id: `auto-${currentUser.id}`,
              name: displayName,
              specialty: "Barbero",
              active: true,
              accountEmail: currentUser.email ?? undefined,
              accountUserId: currentUser.id,
            },
          ],
          currentUser,
        );
      }
    }

    await setStoredActiveRole("barbero");
    router.replace("/barber/barber-my-agenda");
  };

  const openRequestModal = (
    request: OwnerBarberRequest,
    action: "aprobar" | "rechazar",
  ) => {
    setSelectedRequest(request);
    setPendingAction(action);
    setActionReason("");
    setModalVisible(true);
  };

  const closeRequestModal = () => {
    if (isProcessing) return;
    setModalVisible(false);
    setSelectedRequest(null);
    setPendingAction(null);
    setActionReason("");
  };

  const confirmRequestAction = async () => {
    if (!selectedRequest || !pendingAction || isProcessing) return;

    setIsProcessing(true);
    try {
      const nextRequests = pendingRequests.filter(
        (item) => item.id !== selectedRequest.id,
      );
      setPendingRequests(nextRequests);
      await saveOwnerBarberRequests(nextRequests);

      if (pendingAction === "aprobar") {
        const exists = barbers.some(
          (item) =>
            item.name.trim().toLowerCase() ===
            selectedRequest.name.trim().toLowerCase(),
        );

        if (!exists) {
          const nextBarbers = [
            ...barbers,
            {
              id: `manual-${Date.now()}`,
              name: selectedRequest.name,
              specialty: "Barbero",
              active: true,
            } satisfies OwnerBarber,
          ];
          setBarbers(nextBarbers);
          await saveOwnerBarbers(nextBarbers);
        }
      }

      setToast({
        visible: true,
        type: "success",
        message:
          pendingAction === "aprobar"
            ? "Solicitud aprobada"
            : "Solicitud rechazada",
      });
      closeRequestModal();
    } catch {
      setToast({
        visible: true,
        type: "error",
        message: "No se pudo procesar la solicitud",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const closeAddModal = () => {
    if (isProcessing) return;
    setAddModalVisible(false);
    setNewBarberName("");
    setNewBarberEmail("");
    setNewBarberSpecialty("");
  };

  const handleAddBarber = async () => {
    if (isProcessing) return;

    const trimmedName = newBarberName.trim();
    const trimmedEmail = newBarberEmail.trim();
    const trimmedSpecialty = newBarberSpecialty.trim();

    if (!trimmedName) {
      setToast({
        visible: true,
        type: "error",
        message: "Ingresa el nombre del barbero",
      });
      return;
    }

    if (trimmedEmail && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setToast({
        visible: true,
        type: "error",
        message: "Correo inválido",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const nextBarbers = [
        ...barbers,
        {
          id: `manual-${Date.now()}`,
          name: trimmedName,
          specialty: trimmedSpecialty || "Barbero",
          active: true,
          accountEmail: trimmedEmail || undefined,
        } satisfies OwnerBarber,
      ];

      setBarbers(nextBarbers);
      await saveOwnerBarbers(nextBarbers);
      closeAddModal();
      setToast({
        visible: true,
        type: "success",
        message: "Barbero agregado",
      });
    } catch {
      setToast({
        visible: true,
        type: "error",
        message: "No se pudo agregar el barbero",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleBarberState = async (barberId: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    const nextBarbers = barbers.map((b) =>
      b.id === barberId ? { ...b, active: !b.active } : b,
    );
    setBarbers(nextBarbers);
    await saveOwnerBarbers(nextBarbers);
    setToast({ visible: true, type: "success", message: "Estado actualizado" });
    setIsProcessing(false);
  };

  const handleDeleteBarber = (barberId: string) => {
    if (isProcessing) {
      return;
    }

    Alert.alert(
      "Eliminar barbero",
      "Este barbero dejará de aparecer en tu equipo y no podrá ser asignado en reservas.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setIsProcessing(true);
            try {
              const nextBarbers = barbers.filter(
                (item) => item.id !== barberId,
              );
              setBarbers(nextBarbers);
              await saveOwnerBarbers(nextBarbers);
              setToast({
                visible: true,
                type: "success",
                message: "Barbero eliminado",
              });
            } catch {
              setToast({
                visible: true,
                type: "error",
                message: "No se pudo eliminar el barbero",
              });
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  // Renderizado de items de barbero para evitar repetición
  const renderBarberItem = (item: OwnerBarber) => (
    <View key={item.id} style={styles.barberCard}>
      <View style={styles.barberAvatarPlaceholder}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
        {item.active && <View style={styles.onlineBadge} />}
      </View>
      <View style={styles.barberTextWrap}>
        <Text style={styles.barberName}>{item.name}</Text>
        <Text style={styles.barberRole}>{item.specialty}</Text>
        {item.accountEmail && (
          <Text style={styles.barberMeta}>{item.accountEmail}</Text>
        )}
      </View>
      <View style={styles.barberActions}>
        <Pressable
          onPress={() => void toggleBarberState(item.id)}
          style={[
            styles.switchContainer,
            item.active ? styles.switchOn : styles.switchOff,
          ]}
        >
          <View style={styles.switchDot} />
        </Pressable>
        <Pressable
          style={styles.deleteBarberButton}
          onPress={() => handleDeleteBarber(item.id)}
        >
          <MaterialIcons name="delete-outline" size={18} color="#f07f7f" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.replace("/barber/owner-more-settings")}
        >
          <MaterialIcons name="sort" size={24} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaCL-aJcoK2Zp25XLE-1FWroVng48nYGm_oVI80LrGLe0YgMHIw2QTzCFeGH_eNhzo1txC7GImg8Ke6ymFkoRbKELAtt-hxjB4Hhgb7XqNLJdC6HGnS2_zVWIpHv_13lCBjoMhK1vfotekwLa7ttUUaccnA1e36TaJH6ftKOAnW9YEtHmkQii4mqaHJtl9B-_10h_mIX8cMUvITC5l-3lz21FqgRxPpdnHtZRiity7wZBryrbJLIkvV2oa2DkcMmUU20fAXlxX58Z",
          }}
          style={styles.avatar}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Equipo</Text>
          <Text style={styles.subtitle}>Gestiona el staff de tu barbería</Text>
        </View>

        {/* FEATURED CARD: OWNER AS BARBER */}
        <LinearGradient
          colors={["#2a2a2a", "#1a1a1a"]}
          style={styles.featuredCard}
        >
          <View style={styles.featuredContent}>
            <View style={styles.featuredInfo}>
              <Text style={styles.featuredTitle}>Tu Perfil</Text>
              <Text style={styles.featuredText}>
                Activa tu agenda personal para empezar a atender clientes hoy.
              </Text>
            </View>
            <Pressable
              style={[
                styles.featuredButton,
                ownerBarberActive && styles.featuredButtonDisabled,
              ]}
              onPress={() => void goBarberView()}
              disabled={ownerBarberActive || isProcessing || isLoading}
            >
              <Text style={styles.featuredButtonText}>
                {ownerBarberActive ? "Activo" : "Activar"}
              </Text>
            </Pressable>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Barberos Activos</Text>
          <Pressable onPress={() => setAddModalVisible(true)}>
            <Text style={styles.addText}>+ Agregar</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.skeletonList}>
            {[1, 2].map((i) => (
              <Skeleton key={i} style={styles.skeletonCard} borderRadius={16} />
            ))}
          </View>
        ) : (
          barbers.map(renderBarberItem)
        )}

        {/* INVITE SECTION */}
        <View style={styles.inviteContainer}>
          <View style={styles.inviteIconBox}>
            <MaterialIcons name="vpn-key" size={24} color="#d4af37" />
          </View>
          <View style={styles.inviteTextContent}>
            <Text style={styles.inviteTitle}>Nuevo Profesional</Text>
            <Text style={styles.inviteDesc}>
              Envía un código para que se unan.
            </Text>
          </View>
          <Pressable
            style={styles.inviteAction}
            onPress={() => router.push("/barber/invitation-code")}
          >
            <MaterialIcons name="chevron-right" size={24} color="#f2ca50" />
          </Pressable>
        </View>

        {/* REQUESTS SECTION */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Solicitudes
        </Text>
        {pendingRequests.length > 0 ? (
          pendingRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <MaterialIcons
                  name="person-outline"
                  size={20}
                  color="#d4af37"
                />
                <Text style={styles.requestName}>{request.name}</Text>
              </View>
              <View style={styles.requestActions}>
                <Pressable
                  style={styles.rejectBtn}
                  onPress={() => openRequestModal(request, "rechazar")}
                >
                  <Text style={styles.rejectBtnText}>Rechazar</Text>
                </Pressable>
                <Pressable
                  style={styles.approveBtn}
                  onPress={() => openRequestModal(request, "aprobar")}
                >
                  <Text style={styles.approveBtnText}>Aprobar</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <MaterialIcons name="auto-awesome" size={20} color="#333" />
            <Text style={styles.emptyText}>Todo al día por aquí.</Text>
          </View>
        )}
      </ScrollView>

      <BarberRoleNav mode="owner" current="barberos" />

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingAction === "aprobar"
                ? "Aprobar solicitud"
                : "Rechazar solicitud"}
            </Text>
            <Text style={styles.modalSubtitle}>{selectedRequest?.name}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={
                pendingAction === "aprobar"
                  ? "Nota opcional"
                  : "Motivo (opcional)"
              }
              placeholderTextColor="#666"
              value={actionReason}
              onChangeText={setActionReason}
            />
            <View style={styles.modalActionsRow}>
              <Pressable
                style={styles.modalBtnCancel}
                onPress={closeRequestModal}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnConfirm}
                onPress={() => void confirmRequestAction()}
                disabled={isProcessing}
              >
                <Text style={styles.modalBtnConfirmText}>
                  {pendingAction === "aprobar" ? "Aprobar" : "Rechazar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={addModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar barbero</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Nombre"
              placeholderTextColor="#666"
              value={newBarberName}
              onChangeText={setNewBarberName}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Correo (opcional)"
              placeholderTextColor="#666"
              value={newBarberEmail}
              onChangeText={setNewBarberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Especialidad (opcional)"
              placeholderTextColor="#666"
              value={newBarberSpecialty}
              onChangeText={setNewBarberSpecialty}
            />
            <View style={styles.modalActionsRow}>
              <Pressable style={styles.modalBtnCancel} onPress={closeAddModal}>
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalBtnConfirm}
                onPress={() => void handleAddBarber()}
                disabled={isProcessing}
              >
                <Text style={styles.modalBtnConfirmText}>Guardar</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f0f0f" },
  topBar: {
    height: 80,
    paddingTop: 30,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0f0f0f",
  },
  brand: {
    color: "#d4af37",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  iconButton: { padding: 4 },

  content: { paddingHorizontal: 20, paddingBottom: 120 },
  headerSection: { marginVertical: 20 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800" },
  subtitle: { color: "#666", fontSize: 14, marginTop: 4 },

  featuredCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: "#333",
  },
  featuredContent: { flexDirection: "row", alignItems: "center" },
  featuredInfo: { flex: 1, paddingRight: 15 },
  featuredTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  featuredText: { color: "#999", fontSize: 12, marginTop: 6, lineHeight: 18 },
  featuredButton: {
    backgroundColor: "#d4af37",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  featuredButtonText: { color: "#000", fontWeight: "800", fontSize: 13 },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  addText: { color: "#d4af37", fontSize: 14, fontWeight: "700" },

  barberCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  barberAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#d4af37", fontSize: 18, fontWeight: "800" },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#1a1a1a",
  },
  barberTextWrap: { flex: 1, marginLeft: 15 },
  barberName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  barberRole: {
    color: "#d4af37",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 2,
  },
  barberMeta: { color: "#555", fontSize: 11, marginTop: 2 },

  switchContainer: { width: 44, height: 24, borderRadius: 12, padding: 3 },
  switchOn: { backgroundColor: "#d4af37", alignItems: "flex-end" },
  switchOff: { backgroundColor: "#333", alignItems: "flex-start" },
  barberActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  deleteBarberButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3a2a2a",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#221515",
  },
  switchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
  },
  featuredButtonDisabled: {
    backgroundColor: "#5a512f",
    opacity: 0.75,
  },

  inviteContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161616",
    padding: 15,
    borderRadius: 18,
    marginTop: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#333",
  },
  inviteIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#222",
    alignItems: "center",
    justifyContent: "center",
  },
  inviteTextContent: { flex: 1, marginLeft: 12 },
  inviteTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  inviteDesc: { color: "#666", fontSize: 11, marginTop: 2 },

  requestCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 18,
    padding: 15,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#d4af37",
  },
  requestHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  requestName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  requestActions: { flexDirection: "row", gap: 10 },
  approveBtn: {
    flex: 1,
    height: 40,
    backgroundColor: "#d4af37",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  approveBtnText: { color: "#000", fontWeight: "800", fontSize: 12 },
  rejectBtn: {
    flex: 1,
    height: 40,
    backgroundColor: "#222",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtnText: { color: "#999", fontWeight: "600", fontSize: 12 },

  emptyCard: { alignItems: "center", padding: 30, opacity: 0.5 },
  emptyText: { color: "#666", fontSize: 13, marginTop: 10 },
  skeletonCard: {
    height: 80,
    width: "100%",
    marginBottom: 12,
    backgroundColor: "#1a1a1a",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: "#151515",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 16,
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  modalSubtitle: {
    color: "#bbb",
    fontSize: 13,
    marginTop: 4,
    marginBottom: 10,
  },
  modalInput: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    color: "#fff",
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 10,
  },
  modalActionsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  modalBtnCancel: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancelText: { color: "#999", fontSize: 13, fontWeight: "700" },
  modalBtnConfirm: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnConfirmText: { color: "#111", fontSize: 13, fontWeight: "800" },
});
