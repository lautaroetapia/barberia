import { Feather } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";

import { OwnerToast } from "@/components/ui/owner-toast";
import { getOwnerInvitation, regenerateOwnerInvitation } from "@/lib/owner-barbers";

const { width } = Dimensions.get("window");

export default function InvitationCodeScreen() {
  const [inviteCode, setInviteCode] = useState("------");
  const [expiresLabel, setExpiresLabel] = useState("-");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: "" });

  useEffect(() => {
    let isMounted = true;
    const loadInvitation = async () => {
      const invitation = await getOwnerInvitation();
      if (!isMounted) return;
      const expiresDate = new Date(invitation.expiresAt);
      setInviteCode(invitation.code);
      setExpiresLabel(`Válido hasta: ${expiresDate.toLocaleDateString("es-ES")}`);
    };
    void loadInvitation();
    return () => { isMounted = false; };
  }, []);

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const invitation = await regenerateOwnerInvitation();
      const expiresDate = new Date(invitation.expiresAt);
      setInviteCode(invitation.code);
      setExpiresLabel(`Válido hasta: ${expiresDate.toLocaleDateString("es-ES")}`);
      setToast({ visible: true, message: "Código actualizado" });
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(inviteCode);
    setToast({ visible: true, message: "¡Código copiado!" });
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
        <Pressable style={styles.iconBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.main}>
        <View style={styles.headerText}>
          <View style={styles.badge}>
            <Feather name="user-plus" size={12} color="#d4af37" />
            <Text style={styles.badgeText}>SISTEMA DE STAFF</Text>
          </View>
          <Text style={styles.title}>Invitar Barbero</Text>
          <Text style={styles.subtitle}>
            Cualquier persona con este código podrá unirse a tu equipo.
          </Text>
        </View>

        <View style={styles.ticketContainer}>
          {/* El ticket ahora tiene padding horizontal para evitar solapamiento con los recortes */}
          <View style={styles.ticketCard}>
            <Text style={styles.ticketHeader}>CÓDIGO DE ACCESO</Text>
            
            <View style={styles.codeWrapper}>
              <Text style={styles.codeText} numberOfLines={1} adjustsFontSizeToFit>
                {inviteCode}
              </Text>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.cutoutLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.cutoutRight} />
            </View>

            <View style={styles.ticketFooter}>
              <Feather name="clock" size={14} color="#555" />
              <Text style={styles.expireText}>{expiresLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionGroup}>
          <Pressable style={styles.copyButton} onPress={copyToClipboard}>
            <Feather name="copy" size={20} color="#000" />
            <Text style={styles.copyButtonText}>Copiar Código</Text>
          </Pressable>

          <Pressable 
            style={styles.regenButton} 
            onPress={() => void handleRegenerate()}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <ActivityIndicator size="small" color="#d4af37" />
            ) : (
              <>
                <Feather name="refresh-ccw" size={14} color="#666" />
                <Text style={styles.regenButtonText}>Generar uno nuevo</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.securityNote}>Navaja Dorada © 2026</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080808" },
  topBar: {
    height: 100,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: { 
    width: 44, height: 44, 
    alignItems: "center", justifyContent: "center", 
    backgroundColor: "#121212", borderRadius: 14,
    borderWidth: 1, borderColor: "#1a1a1a"
  },
  brand: { color: "#d4af37", fontSize: 11, fontWeight: "900", letterSpacing: 3 },
  
  main: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  headerText: { alignItems: "center", marginBottom: 30 },
  badge: { 
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginBottom: 15
  },
  badgeText: { color: "#d4af37", fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  title: { color: "#fff", fontSize: 32, fontWeight: "800", marginBottom: 8 },
  subtitle: { color: "#666", fontSize: 15, textAlign: "center", lineHeight: 22 },

  ticketContainer: { width: '100%', marginBottom: 30 },
  ticketCard: {
    backgroundColor: "#111",
    borderRadius: 28,
    paddingTop: 30,
    paddingBottom: 25,
    borderWidth: 1,
    borderColor: "#1a1a1a",
    overflow: 'hidden', // Importante para que los círculos se vean bien
  },
  ticketHeader: { 
    color: "#444", fontSize: 10, fontWeight: "900", 
    letterSpacing: 2, textAlign: 'center', marginBottom: 15 
  },
  codeWrapper: {
    paddingHorizontal: 30, // Espacio para que el código no toque los bordes
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
  },
  codeText: { 
    color: "#d4af37", 
    fontSize: 44, 
    fontWeight: "700", 
    letterSpacing: 6,
    textAlign: 'center',
    width: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  },
  
  // Nuevo contenedor para la división punteada y recortes
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    position: 'relative',
    height: 30,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderStyle: 'dashed',
    marginHorizontal: 10,
  },
  cutoutLeft: { 
    width: 24, height: 24, borderRadius: 12, 
    backgroundColor: "#080808", marginLeft: -12,
    borderWidth: 1, borderColor: '#1a1a1a' 
  },
  cutoutRight: { 
    width: 24, height: 24, borderRadius: 12, 
    backgroundColor: "#080808", marginRight: -12,
    borderWidth: 1, borderColor: '#1a1a1a' 
  },

  ticketFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  expireText: { color: "#555", fontSize: 12, fontWeight: "600" },

  actionGroup: { gap: 12 },
  copyButton: {
    backgroundColor: "#d4af37",
    height: 60,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  copyButtonText: { color: "#000", fontSize: 17, fontWeight: "900" },
  
  regenButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  regenButtonText: { color: "#444", fontSize: 14, fontWeight: "600" },

  footer: { paddingBottom: 30, alignItems: 'center' },
  securityNote: { color: "#222", fontSize: 10, fontWeight: "700", letterSpacing: 1 }
});