import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { getOwnerAppointmentsMap } from "@/lib/owner-agenda";
import { getOwnerServices } from "@/lib/owner-services";

type HistoryItem = {
  id: string;
  client: string;
  service: string;
  price: number;
  time: string;
  status: "COMPLETADO" | "NO ASISTIO";
  dateKey: string;
};

type HistoryRange = "today" | "week" | "month" | "all";

const toDateValue = (key: string) => {
  const [year, month, day] = key.split("-");
  return Number(`${year}${month}${day}`);
};

export default function BarberHistoryScreen() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("month");

  const loadHistory = useCallback(async () => {
    const [appointmentsMap, services] = await Promise.all([
      getOwnerAppointmentsMap(),
      getOwnerServices(),
    ]);

    const servicePriceMap = new Map(
      services.map((item) => [
        item.serviceName.toLowerCase(),
        Number(item.price),
      ]),
    );

    const today = new Date();
    const todayKey = `${today.getFullYear()}${`${today.getMonth() + 1}`.padStart(2, "0")}${`${today.getDate()}`.padStart(2, "0")}`;
    const todayValue = Number(todayKey);

    const nextItems: HistoryItem[] = Object.entries(appointmentsMap)
      .flatMap(([dateKey, appointments]) =>
        appointments
          .filter((item) => item.status !== "libre")
          .filter((item) => {
            const dateValue = toDateValue(dateKey);
            if (dateValue < todayValue) {
              return true;
            }

            return item.status === "completado" || item.status === "no_asistio";
          })
          .map((item) => ({
            id: `${dateKey}-${item.id}`,
            client: item.client,
            service: item.service,
            price: servicePriceMap.get(item.service.toLowerCase()) ?? 0,
            time: item.time,
            status: item.status === "no_asistio" ? "NO ASISTIO" : "COMPLETADO",
            dateKey,
          })),
      )
      .sort((a, b) => {
        const dayCompare = toDateValue(b.dateKey) - toDateValue(a.dateKey);
        if (dayCompare !== 0) {
          return dayCompare;
        }

        return b.time.localeCompare(a.time);
      })
      .slice(0, 100);

    setHistoryItems(nextItems);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHistory();
    }, [loadHistory]),
  );

  const filteredItems = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return historyItems.filter((item) => {
      if (historyRange === "all") {
        return true;
      }

      const [year, month, day] = item.dateKey.split("-").map(Number);
      if (!year || !month || !day) {
        return false;
      }

      const itemDate = new Date(year, month - 1, day);

      if (historyRange === "today") {
        return (
          itemDate.getFullYear() === dayStart.getFullYear() &&
          itemDate.getMonth() === dayStart.getMonth() &&
          itemDate.getDate() === dayStart.getDate()
        );
      }

      if (historyRange === "week") {
        const weekStart = new Date(dayStart);
        weekStart.setDate(weekStart.getDate() - 6);
        return itemDate >= weekStart && itemDate <= dayStart;
      }

      const monthStart = new Date(dayStart);
      monthStart.setDate(1);
      return itemDate >= monthStart && itemDate <= dayStart;
    });
  }, [historyItems, historyRange]);

  const facturado = useMemo(
    () =>
      filteredItems
        .filter((item) => item.status === "COMPLETADO")
        .reduce((acc, item) => acc + item.price, 0),
    [filteredItems],
  );

  const promedioDiario = useMemo(() => {
    if (!filteredItems.length) {
      return 0;
    }

    const days = new Set(filteredItems.map((item) => item.dateKey)).size;
    return Math.round(facturado / Math.max(days, 1));
  }, [facturado, filteredItems]);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.replace("/barber/barber-profile")}
        >
          <MaterialIcons name="menu" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>NAVAJA DORADA</Text>
        <View style={styles.avatarWrap}>
          <Image
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAX1EpTxTBfHPIz_ERnDNz8lkrWoVRi0CRE_9RdwhvAbovqqx3kptw6b-E1PLVGYixL3-dgYXEJ6ZcSqL9VV9EffMAQDUMIs6sjhs2Wv6XKfbq3nOm1mdpzm4I7ZdAR6lLdrEM0iAVOlard0B4cWIy_xh9P2w-2NzZD1WyDZC5QxeRGSRlVyn1o4KCmnFk4OCMuLpI1Q3tpv1H9bySX56U7m6HWrcGu4UT3HRYtd_kvqG-XcK7lh4cSH_gLAiYY5qavG-2_m7n6XCx6",
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
        <Text style={styles.title}>Historial</Text>

        <View style={styles.rangeRow}>
          {(
            [
              ["today", "Hoy"],
              ["week", "Semana"],
              ["month", "Mes"],
              ["all", "Todo"],
            ] as const
          ).map(([value, label]) => (
            <Pressable
              key={value}
              style={[
                styles.rangeChip,
                historyRange === value && styles.rangeChipActive,
              ]}
              onPress={() => setHistoryRange(value)}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  historyRange === value && styles.rangeChipTextActive,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Facturado 30d</Text>
            <Text style={styles.statValue}>
              ${facturado.toLocaleString("es-AR")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Promedio diario</Text>
            <Text style={styles.statValue}>
              ${promedioDiario.toLocaleString("es-AR")}
            </Text>
          </View>
        </View>

        {filteredItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemLeft}>
              <Text style={styles.client}>{item.client}</Text>
              <Text style={styles.service}>{item.service}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.price}>
                ${item.price.toLocaleString("es-AR")}
              </Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </View>
        ))}

        {!filteredItems.length ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Sin historial disponible</Text>
            <Text style={styles.emptyStateText}>
              Los turnos completados y no asistio apareceran aqui.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <BarberRoleNav mode="barber" current="historial" />
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
  rangeRow: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 2 },
  rangeChip: {
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.3)",
    backgroundColor: "#1c1b1b",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rangeChipActive: {
    backgroundColor: "#d4af37",
    borderColor: "#d4af37",
  },
  rangeChipText: { color: "#d0c5af", fontSize: 12, fontWeight: "600" },
  rangeChipTextActive: { color: "#241a00", fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 12,
  },
  statLabel: { color: "#d0c5af", fontSize: 11 },
  statValue: {
    color: "#f2ca50",
    fontSize: 22,
    fontWeight: "800",
    marginTop: 6,
  },
  itemCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemLeft: { flex: 1 },
  client: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  service: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  status: { color: "#99907c", fontSize: 10, marginTop: 5, letterSpacing: 0.5 },
  itemRight: { alignItems: "flex-end" },
  price: { color: "#f2ca50", fontSize: 15, fontWeight: "800" },
  time: { color: "#d0c5af", fontSize: 11, marginTop: 4 },
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
});
