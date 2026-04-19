import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export default function BarbersManagementScreen() {
  const [barbers, setBarbers] = useState<OwnerBarber[]>([]);
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
      const [storedBarbers, storedRequests] = await Promise.all([
        getOwnerBarbers(),
        getOwnerBarberRequests(),
      ]);

      if (!isMounted) {
        return;
      }

      setBarbers(storedBarbers);
      setPendingRequests(storedRequests);
      setIsLoading(false);
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const goBarberView = async () => {
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

  const confirmRequestAction = async () => {
    if (!selectedRequest || !pendingAction || isProcessing) {
      return;
    }

    if (!actionReason.trim()) {
      setToast({
        visible: true,
        type: "error",
        message: "Escribe un motivo para continuar.",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const nextRequests = pendingRequests.filter(
        (item) => item.id !== selectedRequest.id,
      );

      setPendingRequests(nextRequests);
      await saveOwnerBarberRequests(nextRequests);

      if (pendingAction === "aprobar") {
        const nextBarbers: OwnerBarber[] = [
          ...barbers,
          {
            id: `barber-${Date.now()}`,
            name: selectedRequest.name,
            specialty: "Nuevo barbero",
            active: true,
          },
        ];
        setBarbers(nextBarbers);
        await saveOwnerBarbers(nextBarbers);
      }

      setToast({
        visible: true,
        type: "success",
        message:
          pendingAction === "aprobar"
            ? `${selectedRequest.name} aprobado`
            : `${selectedRequest.name} rechazado`,
      });
      setModalVisible(false);
      setSelectedRequest(null);
      setPendingAction(null);
      setActionReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleBarberState = async (barberId: string) => {
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    const nextBarbers = barbers.map((barber) =>
      barber.id === barberId ? { ...barber, active: !barber.active } : barber,
    );
    setBarbers(nextBarbers);
    await saveOwnerBarbers(nextBarbers);

    const changed = nextBarbers.find((item) => item.id === barberId);
    setToast({
      visible: true,
      type: "success",
      message: `${changed?.name ?? "Barbero"} ${changed?.active ? "activado" : "desactivado"}`,
    });
    setIsProcessing(false);
  };

  const handleAddBarber = async () => {
    if (isProcessing) {
      return;
    }

    const normalizedEmail = newBarberEmail.trim().toLowerCase();
    const normalizedName = newBarberName.trim();
    const normalizedSpecialty = newBarberSpecialty.trim();

    if (!normalizedEmail || !normalizedSpecialty) {
      setToast({
        visible: true,
        type: "error",
        message: "Correo y especialidad son obligatorios",
      });
      return;
    }

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!isEmailValid) {
      setToast({
        visible: true,
        type: "error",
        message: "Ingresa un correo valido",
      });
      return;
    }

    const alreadyLinked = barbers.some(
      (item) => item.accountEmail?.toLowerCase() === normalizedEmail,
    );
    if (alreadyLinked) {
      setToast({
        visible: true,
        type: "info",
        message: "Esa cuenta ya esta vinculada",
      });
      return;
    }

    setIsProcessing(true);

    let accountUserId: string | undefined;
    if (isSupabaseConfigured) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithOtp({
          email: normalizedEmail,
          options: {
            shouldCreateUser: false,
            emailRedirectTo: "barberia://auth/login",
          },
        });

      if (signInError) {
        setToast({
          visible: true,
          type: "error",
          message: "No se encontro una cuenta registrada con ese correo",
        });
        setIsProcessing(false);
        return;
      }

      accountUserId = signInData?.user?.id;
    }

    const nextBarbers: OwnerBarber[] = [
      ...barbers,
      {
        id: accountUserId ?? `barber-account-${normalizedEmail}`,
        name: normalizedName || normalizedEmail.split("@")[0] || "Barbero",
        specialty: normalizedSpecialty,
        active: true,
        accountEmail: normalizedEmail,
        accountUserId,
      },
    ];

    setBarbers(nextBarbers);
    await saveOwnerBarbers(nextBarbers);
    setAddModalVisible(false);
    setNewBarberName("");
    setNewBarberEmail("");
    setNewBarberSpecialty("");
    setToast({
      visible: true,
      type: "success",
      message: isSupabaseConfigured
        ? "Barbero agregado con cuenta existente"
        : "Barbero agregado y vinculado por correo",
    });
    setIsProcessing(false);
  };

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
          onPress={() => router.replace("/barber/owner-more-settings")}
        >
          <MaterialIcons name="menu" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBaCL-aJcoK2Zp25XLE-1FWroVng48nYGm_oVI80LrGLe0YgMHIw2QTzCFeGH_eNhzo1txC7GImg8Ke6ymFkoRbKELAtt-hxjB4Hhgb7XqNLJdC6HGnS2_zVWIpHv_13lCBjoMhK1vfotekwLa7ttUUaccnA1e36TaJH6ftKOAnW9YEtHmkQii4mqaHJtl9B-_10h_mIX8cMUvITC5l-3lz21FqgRxPpdnHtZRiity7wZBryrbJLIkvV2oa2DkcMmUU20fAXlxX58Z",
            }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Barberos</Text>

        <View style={styles.featuredCard}>
          <Text style={styles.featuredTitle}>Quieres atender vos mismo?</Text>
          <Text style={styles.featuredText}>
            Activa tu perfil de barbero para recibir turnos.
          </Text>
          <Pressable
            style={styles.featuredButton}
            onPress={() => {
              void goBarberView();
            }}
          >
            <Text style={styles.featuredButtonText}>Activar</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Barberos activos</Text>
        {barbers.map((item) => (
          <Pressable
            key={item.id}
            style={styles.barberCard}
            disabled={isProcessing}
            onPress={() => {
              void toggleBarberState(item.id);
            }}
          >
            <View style={styles.barberTextWrap}>
              <Text style={styles.barberName}>{item.name}</Text>
              <Text style={styles.barberRole}>{item.specialty}</Text>
              {item.accountEmail ? (
                <Text style={styles.barberMeta}>{item.accountEmail}</Text>
              ) : null}
            </View>
            <View style={item.active ? styles.switchOn : styles.switchOff}>
              <View style={styles.switchDot} />
            </View>
          </Pressable>
        ))}

        {isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <View style={styles.skeletonTextWrap}>
                  <Skeleton style={styles.skeletonName} />
                  <Skeleton style={styles.skeletonRole} />
                  <Skeleton style={styles.skeletonMeta} />
                </View>
                <Skeleton style={styles.skeletonSwitch} borderRadius={12} />
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          style={styles.addBarberButton}
          disabled={isProcessing}
          onPress={() => setAddModalVisible(true)}
        >
          <MaterialIcons name="person-add" size={18} color="#f2ca50" />
          <Text style={styles.addBarberText}>Agregar barbero manual</Text>
        </Pressable>

        <View style={styles.inviteCard}>
          <MaterialIcons name="qr-code-scanner" size={28} color="#d4af37" />
          <Text style={styles.inviteTitle}>Invitar nuevo barbero</Text>
          <Text style={styles.inviteText}>
            Genera un codigo para sumar un nuevo profesional.
          </Text>
          <Pressable
            style={styles.inviteButton}
            disabled={isProcessing}
            onPress={() => router.push("/barber/invitation-code")}
          >
            <Text style={styles.inviteButtonText}>
              Generar codigo invitacion
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Solicitudes pendientes</Text>
        {pendingRequests.length ? (
          pendingRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <Text style={styles.requestName}>{request.name}</Text>
              <View style={styles.requestActions}>
                <Pressable
                  style={styles.rejectButton}
                  disabled={isProcessing}
                  onPress={() => openRequestModal(request, "rechazar")}
                >
                  <Text style={styles.rejectText}>Rechazar</Text>
                </Pressable>
                <Pressable
                  style={styles.approveButton}
                  disabled={isProcessing}
                  onPress={() => openRequestModal(request, "aprobar")}
                >
                  <Text style={styles.approveText}>Aprobar</Text>
                </Pressable>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyRequestsCard}>
            <Text style={styles.emptyRequestsText}>
              No hay solicitudes pendientes.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {pendingAction === "aprobar"
                ? "Aprobar solicitud"
                : "Rechazar solicitud"}
            </Text>
            <Text style={styles.modalSubtitle}>
              {selectedRequest?.name ?? "-"}
            </Text>

            <TextInput
              style={styles.reasonInput}
              value={actionReason}
              onChangeText={setActionReason}
              placeholder="Motivo de la accion"
              placeholderTextColor="#777"
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedRequest(null);
                  setPendingAction(null);
                  setActionReason("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                disabled={isProcessing}
                onPress={confirmRequestAction}
              >
                <Text style={styles.modalConfirmText}>
                  {isProcessing ? "Procesando..." : "Confirmar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={addModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Agregar barbero</Text>

            <TextInput
              style={styles.fieldInput}
              value={newBarberName}
              onChangeText={setNewBarberName}
              placeholder="Nombre (opcional)"
              placeholderTextColor="#777"
            />

            <TextInput
              style={styles.fieldInput}
              value={newBarberEmail}
              onChangeText={setNewBarberEmail}
              placeholder="Correo de la cuenta del barbero"
              placeholderTextColor="#777"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.fieldInput}
              value={newBarberSpecialty}
              onChangeText={setNewBarberSpecialty}
              placeholder="Especialidad"
              placeholderTextColor="#777"
            />

            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelButton}
                onPress={() => {
                  setAddModalVisible(false);
                  setNewBarberName("");
                  setNewBarberEmail("");
                  setNewBarberSpecialty("");
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.modalConfirmButton}
                disabled={isProcessing}
                onPress={handleAddBarber}
              >
                <Text style={styles.modalConfirmText}>
                  {isProcessing ? "Guardando..." : "Agregar"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <BarberRoleNav mode="owner" current="barberos" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#1a1a1a" },
  topBar: {
    height: 70,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(26,26,26,0.92)",
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
  avatarWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#4d4635",
  },
  avatar: { width: "100%", height: "100%" },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
    gap: 12,
  },
  title: { color: "#e5e2e1", fontSize: 34, fontWeight: "800" },
  featuredCard: {
    borderRadius: 14,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.22)",
    padding: 16,
  },
  featuredTitle: { color: "#e5e2e1", fontSize: 18, fontWeight: "700" },
  featuredText: { color: "#d0c5af", fontSize: 13, marginTop: 4 },
  featuredButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 11,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 20,
  },
  featuredButtonText: { color: "#241a00", fontSize: 14, fontWeight: "800" },
  sectionTitle: {
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  barberCard: {
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  barberTextWrap: { flex: 1 },
  barberName: { color: "#e5e2e1", fontSize: 16, fontWeight: "700" },
  barberRole: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  barberMeta: { color: "#99907c", fontSize: 11, marginTop: 3 },
  switchOn: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.25)",
    justifyContent: "center",
    paddingHorizontal: 3,
    alignItems: "flex-end",
  },
  switchOff: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(77,70,53,0.25)",
    justifyContent: "center",
    paddingHorizontal: 3,
    alignItems: "flex-start",
  },
  switchDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#f2ca50",
  },
  inviteCard: {
    borderRadius: 14,
    backgroundColor: "#20201f",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.24)",
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  inviteTitle: {
    color: "#e5e2e1",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  inviteText: {
    color: "#d0c5af",
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  inviteButton: {
    marginTop: 12,
    minHeight: 42,
    borderRadius: 11,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  inviteButtonText: { color: "#f2ca50", fontSize: 13, fontWeight: "700" },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skeletonTextWrap: {
    flex: 1,
    gap: 6,
  },
  skeletonName: {
    width: "48%",
    height: 16,
  },
  skeletonRole: {
    width: "35%",
    height: 12,
  },
  skeletonMeta: {
    width: "58%",
    height: 11,
  },
  skeletonSwitch: {
    width: 42,
    height: 24,
  },
  loadingText: {
    color: "#99907c",
    fontSize: 12,
    textAlign: "center",
  },
  addBarberButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  addBarberText: {
    color: "#f2ca50",
    fontSize: 13,
    fontWeight: "700",
  },
  requestCard: {
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    borderLeftWidth: 2,
    borderLeftColor: "#d4af37",
    padding: 14,
    gap: 10,
  },
  requestName: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  requestActions: { flexDirection: "row", gap: 8 },
  rejectButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectText: { color: "#d0c5af", fontSize: 12, fontWeight: "600" },
  approveButton: {
    flex: 1,
    minHeight: 36,
    borderRadius: 9,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  approveText: { color: "#241a00", fontSize: 12, fontWeight: "800" },
  emptyRequestsCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
  },
  emptyRequestsText: { color: "#d0c5af", fontSize: 13 },
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
    gap: 10,
  },
  modalTitle: { color: "#e5e2e1", fontSize: 20, fontWeight: "800" },
  modalSubtitle: { color: "#d0c5af", fontSize: 13 },
  reasonInput: {
    minHeight: 84,
    borderRadius: 10,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    color: "#e5e2e1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  fieldInput: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#0e0e0e",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    color: "#e5e2e1",
    paddingHorizontal: 12,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
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
  modalConfirmButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: { color: "#241a00", fontSize: 13, fontWeight: "800" },
});
