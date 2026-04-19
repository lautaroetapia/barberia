import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { OwnerToast } from "@/components/ui/owner-toast";
import {
  getOwnerInvitation,
  regenerateOwnerInvitation,
} from "@/lib/owner-barbers";

export default function InvitationCodeScreen() {
  const [inviteCode, setInviteCode] = useState("------");
  const [expiresLabel, setExpiresLabel] = useState("-");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({
    visible: false,
    message: "",
  });

  useEffect(() => {
    let isMounted = true;

    const loadInvitation = async () => {
      const invitation = await getOwnerInvitation();
      if (!isMounted) {
        return;
      }

      const expiresDate = new Date(invitation.expiresAt);
      setInviteCode(invitation.code);
      setExpiresLabel(
        `Expira ${expiresDate.getDate()}/${expiresDate.getMonth() + 1}/${expiresDate.getFullYear()}`,
      );
    };

    void loadInvitation();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRegenerate = async () => {
    if (isRegenerating) {
      return;
    }

    setIsRegenerating(true);
    try {
      const invitation = await regenerateOwnerInvitation();
      const expiresDate = new Date(invitation.expiresAt);
      setInviteCode(invitation.code);
      setExpiresLabel(
        `Expira ${expiresDate.getDate()}/${expiresDate.getMonth() + 1}/${expiresDate.getFullYear()}`,
      );
      setToast({ visible: true, message: "Codigo regenerado" });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <View style={styles.screen}>
      <OwnerToast
        visible={toast.visible}
        message={toast.message}
        type="success"
        onHide={() => setToast({ visible: false, message: "" })}
      />

      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#d0c5af" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <Pressable
          style={styles.backButton}
          onPress={() => router.replace("/barber/barbers-management")}
        >
          <MaterialIcons name="close" size={20} color="#d0c5af" />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Codigo de invitacion</Text>
        <Text style={styles.subtitle}>
          Comparti este codigo para sumar barberos.
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.code}>{inviteCode}</Text>
        </View>

        <Pressable
          style={styles.copyButton}
          onPress={() => {
            void Clipboard.setStringAsync(inviteCode);
            setToast({ visible: true, message: "Codigo copiado" });
          }}
        >
          <MaterialIcons name="content-copy" size={18} color="#3c2f00" />
          <Text style={styles.copyButtonText}>Copiar codigo</Text>
        </Pressable>

        <Pressable
          style={styles.regenerateButton}
          disabled={isRegenerating}
          onPress={() => void handleRegenerate()}
        >
          <MaterialIcons name="autorenew" size={16} color="#f2ca50" />
          <Text style={styles.regenerateButtonText}>
            {isRegenerating ? "Regenerando..." : "Regenerar codigo"}
          </Text>
        </Pressable>

        <Text style={styles.expire}>{expiresLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#131313" },
  topBar: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
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
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  title: {
    color: "#e5e2e1",
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    color: "#d0c5af",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 280,
  },
  codeCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    paddingVertical: 34,
    alignItems: "center",
  },
  code: {
    color: "#f2ca50",
    fontSize: 46,
    letterSpacing: 8,
    fontWeight: "500",
  },
  copyButton: {
    width: "100%",
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  copyButtonText: { color: "#3c2f00", fontSize: 17, fontWeight: "800" },
  regenerateButton: {
    width: "100%",
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#2a2a2a",
  },
  regenerateButtonText: { color: "#f2ca50", fontSize: 13, fontWeight: "700" },
  expire: { color: "#99907c", fontSize: 12 },
});
