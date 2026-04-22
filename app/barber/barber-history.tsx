import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { getOwnerAppointmentsMap } from "@/lib/owner-agenda";
import { getOwnerServices } from "@/lib/owner-services";

const { width } = Dimensions.get("window");

// ... (Mantenemos tipos y helpers idénticos)
type HistoryItem = {
  id: string; client: string; service: string; price: number;
  time: string; status: "COMPLETADO" | "NO ASISTIO"; dateKey: string;
};

type HistoryRange = "today" | "week" | "month" | "all";

const formatDateLabel = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "HOY";
  return date.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).toUpperCase();
};

export default function BarberHistoryScreen() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyRange, setHistoryRange] = useState<HistoryRange>("month");

  // --- Lógica de carga (Idéntica a la anterior para mantener funcionalidad) ---
  const loadHistory = useCallback(async () => {
    const [appointmentsMap, services] = await Promise.all([
      getOwnerAppointmentsMap(),
      getOwnerServices(),
    ]);
    const servicePriceMap = new Map(services.map((i) => [i.serviceName.toLowerCase(), Number(i.price)]));
    const today = new Date();
    const todayValue = Number(`${today.getFullYear()}${`${today.getMonth() + 1}`.padStart(2, "0")}${`${today.getDate()}`.padStart(2, "0")}`);

    const nextItems: HistoryItem[] = Object.entries(appointmentsMap)
      .flatMap(([dateKey, appointments]) =>
        appointments.filter(item => item.status !== "libre").filter(item => {
          const [y, m, d] = dateKey.split("-").map(Number);
          const dateValue = Number(`${y}${`${m}`.padStart(2, "0")}${`${d}`.padStart(2, "0")}`);
          return dateValue < todayValue || item.status === "completado" || item.status === "no_asistio";
        }).map(item => ({
          id: `${dateKey}-${item.id}`, client: item.client, service: item.service,
          price: servicePriceMap.get(item.service.toLowerCase()) ?? 0,
          time: item.time, status: item.status === "no_asistio" ? "NO ASISTIO" : "COMPLETADO",
          dateKey,
        }))
      )
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey) || b.time.localeCompare(a.time))
      .slice(0, 100);
    setHistoryItems(nextItems);
  }, []);

  useFocusEffect(useCallback(() => { void loadHistory(); }, [loadHistory]));

  const filteredItems = useMemo(() => {
    const now = new Date();
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return historyItems.filter((item) => {
      if (historyRange === "all") return true;
      const [year, month, day] = item.dateKey.split("-").map(Number);
      const itemDate = new Date(year, month - 1, day);
      if (historyRange === "today") return itemDate.toDateString() === dayStart.toDateString();
      if (historyRange === "week") {
        const weekStart = new Date(dayStart);
        weekStart.setDate(weekStart.getDate() - 6);
        return itemDate >= weekStart;
      }
      return itemDate.getMonth() === dayStart.getMonth() && itemDate.getFullYear() === dayStart.getFullYear();
    });
  }, [historyItems, historyRange]);

  const facturado = useMemo(() => filteredItems.reduce((acc, i) => i.status === "COMPLETADO" ? acc + i.price : acc, 0), [filteredItems]);
  const stats = useMemo(() => {
    const completed = filteredItems.filter(i => i.status === "COMPLETADO").length;
    const days = new Set(filteredItems.map(i => i.dateKey)).size || 1;
    return { completed, avg: Math.round(facturado / days) };
  }, [facturado, filteredItems]);

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    filteredItems.forEach(item => {
      if (!groups[item.dateKey]) groups[item.dateKey] = [];
      groups[item.dateKey].push(item);
    });
    return Object.entries(groups);
  }, [filteredItems]);

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.replace("/barber/barber-profile")}>
          <Feather name="chevron-left" size={24} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>RESUMEN DE CAJA</Text>
        <Pressable onPress={() => router.push("/barber/barber-profile")}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: "https://i.pravatar.cc/100" }} style={styles.avatar} />
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* FILTROS SEGMENTADOS */}
        <View style={styles.filterContainer}>
          {(["today", "week", "month", "all"] as const).map((r) => (
            <Pressable 
                key={r} 
                onPress={() => setHistoryRange(r)} 
                style={[styles.filterTab, historyRange === r && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, historyRange === r && styles.filterTabTextActive]}>
                {r === 'today' ? 'Hoy' : r === 'week' ? '7D' : r === 'month' ? 'Mes' : 'Todo'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* DASHBOARD CARD */}
        <View style={styles.dashboardCard}>
            <View style={styles.dashboardHeader}>
                <View>
                    <Text style={styles.dashboardLabel}>Total Facturado</Text>
                    <Text style={styles.dashboardValue}>${facturado.toLocaleString("es-AR")}</Text>
                </View>
                <View style={styles.incomeBadge}>
                    <Feather name="trending-up" size={14} color="#00ff88" />
                    <Text style={styles.incomeBadgeText}>+12%</Text>
                </View>
            </View>
            
            <View style={styles.dashboardFooter}>
                <View style={styles.subStat}>
                    <Text style={styles.subStatLabel}>Servicios</Text>
                    <Text style={styles.subStatValue}>{stats.completed}</Text>
                </View>
                <View style={styles.subStatDivider} />
                <View style={styles.subStat}>
                    <Text style={styles.subStatLabel}>Promedio/Día</Text>
                    <Text style={styles.subStatValue}>${stats.avg.toLocaleString("es-AR")}</Text>
                </View>
            </View>
        </View>

        {/* HISTORIAL */}
        <Text style={styles.sectionTitle}>Cronología de Servicios</Text>
        
        {groupedItems.map(([dateKey, items]) => (
          <View key={dateKey} style={styles.dateGroup}>
            <View style={styles.dateStickyHeader}>
               <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeText}>{formatDateLabel(dateKey)}</Text>
               </View>
               <View style={styles.dateLine} />
            </View>
            
            {items.map((item, index) => (
              <View key={item.id} style={styles.timelineRow}>
                <View style={styles.timelineIndicator}>
                    <View style={[styles.dot, item.status === "NO ASISTIO" && styles.dotError]} />
                    {index !== items.length - 1 && <View style={styles.line} />}
                </View>

                <View style={styles.ticketCard}>
                    <View style={styles.ticketBody}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.clientName}>{item.client}</Text>
                            <Text style={styles.serviceName}>{item.service}</Text>
                            <View style={styles.timeTag}>
                                <Feather name="clock" size={10} color="#666" />
                                <Text style={styles.timeText}>{item.time}</Text>
                            </View>
                        </View>
                        <View style={styles.priceContainer}>
                            <Text style={[styles.priceText, item.status === "NO ASISTIO" && styles.priceTextError]}>
                                {item.status === "NO ASISTIO" ? "- $0" : `$${item.price.toLocaleString("es-AR")}`}
                            </Text>
                            <View style={[styles.statusMiniBadge, item.status === "NO ASISTIO" && styles.statusMiniBadgeError]}>
                                <Text style={[styles.statusMiniText, item.status === "NO ASISTIO" && styles.statusMiniTextError]}>
                                    {item.status === "COMPLETADO" ? "PAGO" : "AUSENTE"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
              </View>
            ))}
          </View>
        ))}

        {!filteredItems.length && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Feather name="bar-chart-2" size={32} color="#333" />
            </View>
            <Text style={styles.emptyTitle}>Sin movimientos</Text>
            <Text style={styles.emptyDesc}>No hay registros para este periodo de tiempo.</Text>
          </View>
        )}
      </ScrollView>

      <BarberRoleNav mode="barber" current="historial" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" },
  topBar: {
    height: 100,
    paddingTop: 45,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  brand: { color: "#d4af37", fontSize: 10, fontWeight: "800", letterSpacing: 2, opacity: 0.9 },
  avatarWrap: { width: 38, height: 38, borderRadius: 19, overflow: "hidden", borderWidth: 1, borderColor: "#222" },
  avatar: { width: "100%", height: "100%" },

  content: { paddingHorizontal: 20, paddingBottom: 140 },
  
  filterContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#111', 
    borderRadius: 14, 
    padding: 3, 
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#1a1a1a'
  },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  filterTabActive: { backgroundColor: '#d4af37' },
  filterTabText: { color: '#555', fontSize: 12, fontWeight: '700' },
  filterTabTextActive: { color: '#000' },

  dashboardCard: {
    backgroundColor: '#111',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    marginBottom: 30,
    // Sutil efecto de elevación
    shadowColor: "#d4af37",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  dashboardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 25 },
  dashboardLabel: { color: '#666', fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  dashboardValue: { color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 5 },
  incomeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00331a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  incomeBadgeText: { color: '#00ff88', fontSize: 10, fontWeight: '800' },
  
  dashboardFooter: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1a1a1a', paddingTop: 20 },
  subStat: { flex: 1 },
  subStatLabel: { color: '#444', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  subStatValue: { color: '#d4af37', fontSize: 18, fontWeight: '800', marginTop: 2 },
  subStatDivider: { width: 1, height: 30, backgroundColor: '#1a1a1a', marginHorizontal: 15 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 20, letterSpacing: 0.5 },

  dateGroup: { marginBottom: 35 },
  dateStickyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 15 },
  dateBadge: { backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#222' },
  dateBadgeText: { color: '#d4af37', fontSize: 11, fontWeight: '900' },
  dateLine: { flex: 1, height: 1, backgroundColor: '#111' },

  timelineRow: { flexDirection: 'row', gap: 18 },
  timelineIndicator: { width: 14, alignItems: 'center', paddingTop: 22 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff88', zIndex: 2 },
  dotError: { backgroundColor: '#ff4466' },
  line: { position: 'absolute', top: 30, bottom: -15, width: 1, backgroundColor: '#111' },

  ticketCard: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#161616",
    overflow: 'hidden'
  },
  ticketBody: { padding: 18, flexDirection: 'row', alignItems: 'center' },
  clientName: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  serviceName: { color: "#666", fontSize: 13, marginBottom: 8 },
  timeTag: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  timeText: { color: "#444", fontSize: 11, fontWeight: '600' },

  priceContainer: { alignItems: 'flex-end', gap: 6 },
  priceText: { color: "#fff", fontSize: 18, fontWeight: "900" },
  priceTextError: { color: "#ff4466", opacity: 0.5 },
  statusMiniBadge: { backgroundColor: '#002211', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusMiniBadgeError: { backgroundColor: '#220005' },
  statusMiniText: { color: '#00ff88', fontSize: 9, fontWeight: '900' },
  statusMiniTextError: { color: '#ff4466' },

  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  emptyDesc: { color: '#444', fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },
});