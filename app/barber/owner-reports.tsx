import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { AppToast } from "@/components/ui/app-toast";
import { getOwnerAppointmentsMap } from "@/lib/owner-agenda";
import { getOwnerBarbers } from "@/lib/owner-barbers";
import { getOwnerServices } from "@/lib/owner-services";

// Tipos y funciones auxiliares (se mantienen de tu lógica original)
type DailyStats = { date: string; appointments: number; revenue: number };
type ReportRange = "today" | "week" | "month";

const toDisplayDate = (key: string) => {
  const [year, month, day] = key.split("-");
  return year ? `${day}/${month}/${year}` : key;
};

const parseDateKey = (key: string) => {
  const [year, month, day] = key.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const isDateInsideRange = (date: Date, range: ReportRange) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === "today") {
    return date.getTime() === today.getTime();
  }

  if (range === "week") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return date >= start && date <= today;
  }

  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

export default function OwnerReportsScreen() {
  const [reportRange, setReportRange] = useState<ReportRange>("week");
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [inProgressAppointments, setInProgressAppointments] = useState(0);
  const [noShowAppointments, setNoShowAppointments] = useState(0);
  const [estimatedRevenue, setEstimatedRevenue] = useState(0);
  const [activeBarbers, setActiveBarbers] = useState(0);
  const [activeServices, setActiveServices] = useState(0);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "info" as "success" | "info" | "error",
  });

  const formattedRevenue = useMemo(
    () => `$${estimatedRevenue.toLocaleString("es-AR")}`,
    [estimatedRevenue],
  );

  const loadReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [appointmentsMap, barbers, services] = await Promise.all([
        getOwnerAppointmentsMap(),
        getOwnerBarbers(),
        getOwnerServices(),
      ]);

      const servicePriceMap = new Map(
        services.map((item) => [
          item.serviceName.toLowerCase(),
          Number(item.price) || 0,
        ]),
      );

      let total = 0;
      let inProgress = 0;
      let noShow = 0;
      let revenue = 0;
      const days: DailyStats[] = [];

      Object.entries(appointmentsMap).forEach(([dateKey, appointments]) => {
        const parsed = parseDateKey(dateKey);
        if (!parsed || !isDateInsideRange(parsed, reportRange)) {
          return;
        }

        const validAppointments = appointments.filter(
          (item) => item.status !== "libre",
        );
        const revenueAppointments = validAppointments.filter(
          (item) => item.status !== "no_asistio",
        );

        const dayRevenue = revenueAppointments.reduce((acc, item) => {
          const price = servicePriceMap.get(item.service.toLowerCase()) ?? 0;
          return acc + price;
        }, 0);

        total += validAppointments.length;
        inProgress += validAppointments.filter(
          (item) => item.status === "en_progreso",
        ).length;
        noShow += validAppointments.filter(
          (item) => item.status === "no_asistio",
        ).length;
        revenue += dayRevenue;

        days.push({
          date: dateKey,
          appointments: validAppointments.length,
          revenue: dayRevenue,
        });
      });

      days.sort((a, b) => b.date.localeCompare(a.date));

      setTotalAppointments(total);
      setInProgressAppointments(inProgress);
      setNoShowAppointments(noShow);
      setEstimatedRevenue(revenue);
      setActiveBarbers(barbers.filter((item) => item.active).length);
      setActiveServices(services.filter((item) => item.active).length);
      setDailyStats(days);
    } catch {
      setToast({
        visible: true,
        message: "No se pudo cargar el reporte",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [reportRange]);

  const exportReport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
            <h1>Navaja Dorada - Reporte</h1>
            <p><strong>Rango:</strong> ${reportRange}</p>
            <p><strong>Turnos totales:</strong> ${totalAppointments}</p>
            <p><strong>Turnos en progreso:</strong> ${inProgressAppointments}</p>
            <p><strong>No asistió:</strong> ${noShowAppointments}</p>
            <p><strong>Ingresos estimados:</strong> ${formattedRevenue}</p>
            <p><strong>Barberos activos:</strong> ${activeBarbers}</p>
            <p><strong>Servicios activos:</strong> ${activeServices}</p>
            <hr />
            <h3>Desglose diario</h3>
            <ul>
              ${dailyStats
                .map(
                  (item) =>
                    `<li>${toDisplayDate(item.date)} · ${item.appointments} turnos · $${item.revenue.toLocaleString("es-AR")}</li>`,
                )
                .join("")}
            </ul>
          </body>
        </html>
      `;

      const file = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
        setToast({
          visible: true,
          message: "Reporte exportado",
          type: "success",
        });
      } else {
        const resume = [
          "Reporte Navaja Dorada",
          `Rango: ${reportRange}`,
          `Turnos totales: ${totalAppointments}`,
          `Turnos en progreso: ${inProgressAppointments}`,
          `No asistió: ${noShowAppointments}`,
          `Ingresos estimados: ${formattedRevenue}`,
        ].join("\n");

        await Share.share({
          title: "Reporte Navaja Dorada",
          message: resume,
        });

        setToast({
          visible: true,
          message: "Resumen del reporte compartido",
          type: "success",
        });
      }
    } catch {
      setToast({
        visible: true,
        message: "No se pudo exportar el reporte",
        type: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadReportData();
    }, [loadReportData]),
  );

  return (
    <View style={styles.screen}>
      <AppToast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      {/* Top Bar Moderna */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#d4af37" />
        </Pressable>
        <Text style={styles.headerTitle}>Análisis de Negocio</Text>
        <Pressable
          style={[styles.exportButton, isExporting && { opacity: 0.5 }]}
          onPress={() => void exportReport()}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Feather name="share" size={18} color="#000" />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Text style={styles.loadingText}>Cargando métricas...</Text>
        ) : null}

        {/* Selector de Rango */}
        <View style={styles.tabContainer}>
          {(["today", "week", "month"] as const).map((range) => (
            <Pressable
              key={range}
              onPress={() => setReportRange(range)}
              style={[styles.tab, reportRange === range && styles.activeTab]}
            >
              <Text
                style={[
                  styles.tabText,
                  reportRange === range && styles.activeTabText,
                ]}
              >
                {range === "today"
                  ? "Hoy"
                  : range === "week"
                    ? "Semana"
                    : "Mes"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Hero Card: Ingresos */}
        <View style={styles.revenueHero}>
          <View>
            <Text style={styles.heroLabel}>INGRESOS ESTIMADOS</Text>
            <Text style={styles.heroValue}>{formattedRevenue}</Text>
          </View>
          <View style={styles.heroIconContainer}>
            <Feather name="trending-up" size={32} color="#f2ca50" />
          </View>
        </View>

        {/* Grid de KPIs */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Turnos Totales</Text>
            <Text style={styles.statValue}>{totalAppointments}</Text>
            <Feather
              name="calendar"
              size={16}
              color="#d4af37"
              style={styles.statIcon}
            />
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>No Asistió</Text>
            <Text style={[styles.statValue, { color: "#ffb4ab" }]}>
              {noShowAppointments}
            </Text>
            <Feather
              name="user-x"
              size={16}
              color="#ffb4ab"
              style={styles.statIcon}
            />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Barberos</Text>
            <Text style={styles.statValue}>{activeBarbers}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Servicios</Text>
            <Text style={styles.statValue}>{activeServices}</Text>
          </View>
        </View>

        {/* Detalle Diario */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Desglose Diario</Text>
          <Feather name="list" size={18} color="#99907c" />
        </View>

        {dailyStats.length > 0 ? (
          dailyStats.map((item, idx) => (
            <View key={idx} style={styles.dayRow}>
              <View style={styles.dayDateBox}>
                <Text style={styles.dayDateText}>
                  {item.date.split("-")[2]}
                </Text>
                <Text style={styles.dayMonthText}>
                  {item.date.split("-")[1] === "04" ? "ABR" : "MES"}
                </Text>
              </View>
              <View style={styles.dayInfo}>
                <Text style={styles.dayTitle}>{toDisplayDate(item.date)}</Text>
                <Text style={styles.daySub}>
                  {item.appointments} servicios completados
                </Text>
              </View>
              <Text style={styles.dayPrice}>
                ${item.revenue.toLocaleString("es-AR")}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Feather name="inbox" size={40} color="#333" />
            <Text style={styles.emptyText}>No hay datos en este periodo</Text>
          </View>
        )}
      </ScrollView>

      <BarberRoleNav mode="owner" current="mas" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#080808" },
  header: {
    height: 110,
    paddingTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#080808",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#151515",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#d4af37",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#151515",
    padding: 6,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 12 },
  activeTab: { backgroundColor: "#d4af37" },
  tabText: { color: "#888", fontWeight: "700", fontSize: 13 },
  activeTabText: { color: "#000" },

  // Hero Card
  revenueHero: {
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#d4af3733",
    marginBottom: 16,
  },
  heroLabel: {
    color: "#d4af37",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroValue: { color: "#fff", fontSize: 36, fontWeight: "900", marginTop: 4 },
  heroIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#d4af3715",
    alignItems: "center",
    justifyContent: "center",
  },

  // Stats Grid
  statsGrid: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#121212",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  statLabel: {
    color: "#666",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
  },
  statValue: { color: "#eee", fontSize: 22, fontWeight: "800" },
  statIcon: { position: "absolute", top: 16, right: 16, opacity: 0.5 },

  // List Detail
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 4,
  },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1a1a1a",
  },
  dayDateBox: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    borderWidth: 1,
    borderColor: "#222",
  },
  dayDateText: { color: "#d4af37", fontSize: 16, fontWeight: "800" },
  dayMonthText: { color: "#666", fontSize: 8, fontWeight: "800" },
  dayInfo: { flex: 1 },
  dayTitle: { color: "#fff", fontSize: 14, fontWeight: "700" },
  daySub: { color: "#666", fontSize: 11, marginTop: 2 },
  dayPrice: { color: "#f2ca50", fontSize: 15, fontWeight: "800" },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: { color: "#333", fontSize: 14, fontWeight: "600", marginTop: 10 },
  loadingText: {
    color: "#99907c",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
});
