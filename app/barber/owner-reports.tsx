import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import * as Print from "expo-print";
import { router } from "expo-router";
import * as Sharing from "expo-sharing";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BarberRoleNav } from "@/components/barber-role-nav";
import { AppToast } from "@/components/ui/app-toast";
import { getOwnerAppointmentsMap } from "@/lib/owner-agenda";
import { getOwnerBarbers } from "@/lib/owner-barbers";
import { getOwnerServices } from "@/lib/owner-services";

type DailyStats = {
  date: string;
  appointments: number;
  revenue: number;
};

type ReportRange = "today" | "week" | "month";

const toDisplayDate = (key: string) => {
  const [year, month, day] = key.split("-");
  if (!year || !month || !day) {
    return key;
  }

  return `${day}/${month}/${year}`;
};

const parseDateKey = (key: string) => {
  const [yearStr, monthStr, dayStr] = key.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
};

const isDateInsideRange = (date: Date, range: ReportRange) => {
  const today = new Date();
  const dayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (range === "today") {
    return (
      date.getFullYear() === dayStart.getFullYear() &&
      date.getMonth() === dayStart.getMonth() &&
      date.getDate() === dayStart.getDate()
    );
  }

  if (range === "week") {
    const weekStart = new Date(dayStart);
    weekStart.setDate(weekStart.getDate() - 6);
    return date >= weekStart && date <= dayStart;
  }

  const monthStart = new Date(dayStart);
  monthStart.setDate(1);
  return date >= monthStart && date <= dayStart;
};

const getRangeLabel = (range: ReportRange) => {
  if (range === "today") {
    return "Hoy";
  }

  if (range === "week") {
    return "Semana";
  }

  return "Mes";
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
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "info" | "error";
  }>({ visible: false, message: "", type: "info" });

  const loadReportData = useCallback(async () => {
    const [appointmentsMap, services, barbers] = await Promise.all([
      getOwnerAppointmentsMap(),
      getOwnerServices(),
      getOwnerBarbers(),
    ]);

    const servicePriceMap = new Map(
      services.map((item) => [
        item.serviceName.toLowerCase(),
        Number(item.price),
      ]),
    );

    let total = 0;
    let inProgress = 0;
    let noShow = 0;
    let revenue = 0;

    const filteredDateEntries = Object.entries(appointmentsMap)
      .map(([dateKey, appointments]) => ({
        dateKey,
        date: parseDateKey(dateKey),
        appointments,
      }))
      .filter(
        (entry) => entry.date && isDateInsideRange(entry.date, reportRange),
      )
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    const nextDailyStats: DailyStats[] = filteredDateEntries
      .slice(0, 31)
      .map(({ dateKey, appointments }) => {
        const scheduled = appointments.filter(
          (item) => item.status !== "libre",
        );

        const dayRevenue = scheduled.reduce((acc, item) => {
          if (item.status === "no_asistio") {
            return acc;
          }

          const itemPrice =
            servicePriceMap.get(item.service.toLowerCase()) ??
            Number(services[0]?.price ?? 0);
          return acc + itemPrice;
        }, 0);

        return {
          date: dateKey,
          appointments: scheduled.length,
          revenue: dayRevenue,
        };
      });

    filteredDateEntries.forEach(({ appointments }) => {
      appointments.forEach((item) => {
        if (item.status === "libre") {
          return;
        }

        total += 1;

        if (item.status === "en_progreso") {
          inProgress += 1;
        }

        if (item.status === "no_asistio") {
          noShow += 1;
          return;
        }

        const itemPrice =
          servicePriceMap.get(item.service.toLowerCase()) ??
          Number(services[0]?.price ?? 0);
        revenue += itemPrice;
      });
    });

    setTotalAppointments(total);
    setInProgressAppointments(inProgress);
    setNoShowAppointments(noShow);
    setEstimatedRevenue(revenue);
    setActiveBarbers(barbers.filter((item) => item.active).length);
    setActiveServices(services.filter((item) => item.active).length);
    setDailyStats(nextDailyStats);
  }, [reportRange]);

  const handleExportPdf = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);

    try {
      const rowsHtml = dailyStats.length
        ? dailyStats
            .map(
              (item) => `
                <tr>
                  <td>${toDisplayDate(item.date)}</td>
                  <td>${item.appointments}</td>
                  <td>$${item.revenue.toLocaleString("es-AR")}</td>
                </tr>
              `,
            )
            .join("")
        : '<tr><td colspan="3">Sin datos para el periodo</td></tr>';

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; padding: 24px; color: #1a1a1a; }
              h1 { margin: 0 0 6px 0; }
              p { margin: 4px 0; }
              .kpis { margin: 16px 0; }
              .kpi { margin: 2px 0; }
              table { width: 100%; border-collapse: collapse; margin-top: 14px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background: #f4f4f4; }
            </style>
          </head>
          <body>
            <h1>Reporte de Barberia</h1>
            <p>Periodo: ${getRangeLabel(reportRange)}</p>
            <p>Generado: ${new Date().toLocaleString("es-AR")}</p>

            <div class="kpis">
              <p class="kpi">Ingresos estimados: ${formattedRevenue}</p>
              <p class="kpi">Turnos: ${totalAppointments}</p>
              <p class="kpi">En progreso: ${inProgressAppointments}</p>
              <p class="kpi">No asistio: ${noShowAppointments}</p>
              <p class="kpi">Barberos activos: ${activeBarbers}</p>
              <p class="kpi">Servicios activos: ${activeServices}</p>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Turnos</th>
                  <th>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const file = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        setToast({
          visible: true,
          type: "info",
          message: `PDF generado en: ${file.uri}`,
        });
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartir reporte",
      });
    } catch {
      setToast({
        visible: true,
        type: "error",
        message: "No se pudo exportar el reporte.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      void loadReportData();
    }, [loadReportData]),
  );

  const formattedRevenue = useMemo(
    () => `$${estimatedRevenue.toLocaleString("es-AR")}`,
    [estimatedRevenue],
  );

  return (
    <View style={styles.screen}>
      <AppToast
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
          <MaterialIcons name="arrow-back" size={22} color="#d4af37" />
        </Pressable>
        <Text style={styles.brand}>Reportes</Text>
        <Pressable
          style={styles.iconButton}
          onPress={() => void handleExportPdf()}
        >
          <MaterialIcons
            name={isExporting ? "sync" : "picture-as-pdf"}
            size={20}
            color="#d4af37"
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.rangeRow}>
          {(["today", "week", "month"] as const).map((range) => (
            <Pressable
              key={range}
              style={[
                styles.rangeChip,
                reportRange === range && styles.rangeChipActive,
              ]}
              onPress={() => setReportRange(range)}
            >
              <Text
                style={[
                  styles.rangeChipText,
                  reportRange === range && styles.rangeChipTextActive,
                ]}
              >
                {getRangeLabel(range)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Ingresos estimados</Text>
          <Text style={styles.summaryValue}>{formattedRevenue}</Text>
          <Text style={styles.summaryHint}>
            Basado en turnos cargados y servicios activos
          </Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Turnos</Text>
            <Text style={styles.kpiValue}>{totalAppointments}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>En progreso</Text>
            <Text style={styles.kpiValue}>{inProgressAppointments}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>No asistio</Text>
            <Text style={styles.kpiValue}>{noShowAppointments}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Barberos activos</Text>
            <Text style={styles.kpiValue}>{activeBarbers}</Text>
          </View>
        </View>

        <View style={styles.kpiRowSingle}>
          <View style={styles.kpiCardSingle}>
            <Text style={styles.kpiLabel}>Servicios activos</Text>
            <Text style={styles.kpiValue}>{activeServices}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Detalle del periodo</Text>

        {dailyStats.length ? (
          dailyStats.map((item) => (
            <View key={item.date} style={styles.dayCard}>
              <View>
                <Text style={styles.dayDate}>{toDisplayDate(item.date)}</Text>
                <Text style={styles.dayMeta}>{item.appointments} turnos</Text>
              </View>
              <Text style={styles.dayRevenue}>
                ${item.revenue.toLocaleString("es-AR")}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              Aun no hay datos para reportar.
            </Text>
          </View>
        )}
      </ScrollView>

      <BarberRoleNav mode="owner" current="mas" />
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
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
    gap: 12,
  },
  rangeRow: {
    flexDirection: "row",
    gap: 8,
  },
  rangeChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.3)",
    backgroundColor: "#1c1b1b",
    alignItems: "center",
    justifyContent: "center",
  },
  rangeChipActive: {
    borderColor: "rgba(212,175,55,0.45)",
    backgroundColor: "rgba(212,175,55,0.15)",
  },
  rangeChipText: {
    color: "#d0c5af",
    fontSize: 12,
    fontWeight: "700",
  },
  rangeChipTextActive: {
    color: "#f2ca50",
  },
  summaryCard: {
    borderRadius: 14,
    backgroundColor: "#2a2a2a",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 16,
  },
  summaryLabel: {
    color: "#d0c5af",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  summaryValue: {
    color: "#e5e2e1",
    fontSize: 34,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryHint: {
    color: "#99907c",
    fontSize: 12,
    marginTop: 4,
  },
  kpiRow: { flexDirection: "row", gap: 10 },
  kpiRowSingle: { flexDirection: "row" },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
  },
  kpiCardSingle: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.25)",
    padding: 14,
  },
  kpiLabel: {
    color: "#99907c",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  kpiValue: { color: "#e5e2e1", fontSize: 28, fontWeight: "800", marginTop: 6 },
  sectionTitle: {
    color: "#e5e2e1",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
  },
  dayCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayDate: { color: "#e5e2e1", fontSize: 15, fontWeight: "700" },
  dayMeta: { color: "#d0c5af", fontSize: 12, marginTop: 2 },
  dayRevenue: { color: "#f2ca50", fontSize: 16, fontWeight: "800" },
  emptyCard: {
    borderRadius: 12,
    backgroundColor: "#1c1b1b",
    borderWidth: 1,
    borderColor: "rgba(77,70,53,0.2)",
    padding: 14,
  },
  emptyText: { color: "#d0c5af", fontSize: 13 },
});
