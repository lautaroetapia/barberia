import { MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type OwnerToastType = "success" | "info" | "error";

type OwnerToastProps = {
  visible: boolean;
  message: string;
  type?: OwnerToastType;
  onHide: () => void;
  durationMs?: number;
};

const ICON_BY_TYPE: Record<
  OwnerToastType,
  keyof typeof MaterialIcons.glyphMap
> = {
  success: "check-circle",
  info: "info",
  error: "error-outline",
};

export function OwnerToast({
  visible,
  message,
  type = "info",
  onHide,
  durationMs = 2200,
}: OwnerToastProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = setTimeout(() => {
      onHide();
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onHide, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Pressable
      style={[styles.wrap, type === "error" && styles.wrapError]}
      onPress={onHide}
    >
      <MaterialIcons name={ICON_BY_TYPE[type]} size={16} color="#f2ca50" />
      <Text style={styles.text}>{message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 20,
    right: 20,
    top: 82,
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    backgroundColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 12,
    zIndex: 50,
  },
  wrapError: {
    borderColor: "rgba(255,180,171,0.45)",
  },
  text: {
    color: "#e5e2e1",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
});
