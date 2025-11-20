import { useFocusEffect } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingDown,
  TrendingUp,
  XCircle
} from "lucide-react-native";
import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { initDB } from "../database/database";
import {
  getEstadisticasMensuales,
  getGastosProximosVencer,
  getSaldoActual
} from "../services/movimientosService";

interface Estadisticas {
  totalPagados: number;
  totalPendientes: number;
  montoPagado: number;
  montoPendiente: number;
  totalIngresos: number;
  montoIngresos: number;
}

interface GastoVencimiento {
  id: number;
  concepto: string;
  monto: number;
  fecha_limite: string;
  dias_restantes: number;
  estado: 'vencido' | 'proximo' | 'normal';
}

export default function Dashboard() {
  const [saldo, setSaldo] = useState(0);
  const [estadisticas, setEstadisticas] = useState<Estadisticas>({
    totalPagados: 0,
    totalPendientes: 0,
    montoPagado: 0,
    montoPendiente: 0,
    totalIngresos: 0,
    montoIngresos: 0,
  });
  const [gastosVencimiento, setGastosVencimiento] = useState<GastoVencimiento[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      initDB();
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    try {
      const total = await getSaldoActual();
      setSaldo(total);
      console.log("Saldo Actual:");
      console.log(total);
      const stats = await getEstadisticasMensuales();
      setEstadisticas(stats);
      console.log("Estadísticas Mensuales:");
      console.log(stats);
      const gastos = await getGastosProximosVencer();
      console.log("Gastos Próximos a Vencer:");
      console.log(gastos);
      setGastosVencimiento(gastos);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarDatos();
    setRefreshing(false);
  };

  const getColorSemaforo = (estado: string) => {
    switch (estado) {
      case 'vencido': return '#dc2626'; // Rojo
      case 'proximo': return '#f59e0b'; // Amarillo/Naranja
      default: return '#16a34a'; // Verde
    }
  };

  const getIconoEstado = (estado: string) => {
    switch (estado) {
      case 'vencido': return <XCircle color="#fff" size={16} />;
      case 'proximo': return <Clock color="#fff" size={16} />;
      default: return <CheckCircle color="#fff" size={16} />;
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Encabezado con saldo principal */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Financiero</Text>
        <View style={styles.saldoCard}>
          <DollarSign color="#fff" size={32} />
          <View style={styles.saldoInfo}>
            <Text style={styles.saldoLabel}>Saldo Actual</Text>
            <Text style={[styles.saldo, { color: saldo >= 0 ? "#10b981" : "#ef4444" }]}>
              S/. {saldo.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tarjetas de estadísticas */}
      <View style={styles.statsContainer}>
        {/* Ingresos */}
        <View style={[styles.statCard, styles.ingresoCard]}>
          <View style={styles.statIconContainer}>
            <TrendingUp color="#10b981" size={24} />
          </View>
          <Text style={styles.statLabel}>Ingresos del Mes</Text>
          <Text style={styles.statValue}>S/. {estadisticas.montoIngresos.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>{estadisticas.totalIngresos} registros</Text>
        </View>

        {/* Gastos Pagados */}
        <View style={[styles.statCard, styles.pagadoCard]}>
          <View style={styles.statIconContainer}>
            <CheckCircle color="#3b82f6" size={24} />
          </View>
          <Text style={styles.statLabel}>Pagados</Text>
          <Text style={styles.statValue}>S/. {estadisticas.montoPagado.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>{estadisticas.totalPagados} conceptos</Text>
        </View>

        {/* Gastos Pendientes */}
        <View style={[styles.statCard, styles.pendienteCard]}>
          <View style={styles.statIconContainer}>
            <AlertCircle color="#f59e0b" size={24} />
          </View>
          <Text style={styles.statLabel}>Pendientes</Text>
          <Text style={styles.statValue}>S/. {estadisticas.montoPendiente.toFixed(2)}</Text>
          <Text style={styles.statSubtext}>{estadisticas.totalPendientes} conceptos</Text>
        </View>

        {/* Balance */}
        <View style={[styles.statCard, styles.balanceCard]}>
          <View style={styles.statIconContainer}>
            <TrendingDown color="#8b5cf6" size={24} />
          </View>
          <Text style={styles.statLabel}>Total Gastos</Text>
          <Text style={styles.statValue}>
            S/. {(estadisticas.montoPagado + estadisticas.montoPendiente).toFixed(2)}
          </Text>
          <Text style={styles.statSubtext}>
            {estadisticas.totalPagados + estadisticas.totalPendientes} total
          </Text>
        </View>
      </View>

      {/* Sección de vencimientos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ Próximos Vencimientos</Text>
        {gastosVencimiento.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle color="#10b981" size={48} />
            <Text style={styles.emptyText}>¡Todo al día!</Text>
            <Text style={styles.emptySubtext}>No hay pagos próximos a vencer</Text>
          </View>
        ) : (
          gastosVencimiento.map((gasto) => (
            <View
              key={gasto.id}
              style={[
                styles.vencimientoCard,
                { borderLeftColor: getColorSemaforo(gasto.estado) }
              ]}
            >
              <View style={styles.vencimientoHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vencimientoConcepto}>{gasto.concepto}</Text>
                  <Text style={styles.vencimientoMonto}>
                    S/. {gasto.monto.toFixed(2)}
                  </Text>
                </View>
                <View style={[
                  styles.estadoBadge,
                  { backgroundColor: getColorSemaforo(gasto.estado) }
                ]}>
                  {getIconoEstado(gasto.estado)}
                  <Text style={styles.estadoText}>
                    {gasto.estado === 'vencido'
                      ? 'VENCIDO'
                      : gasto.estado === 'proximo'
                        ? 'PRÓXIMO'
                        : 'NORMAL'}
                  </Text>
                </View>
              </View>
              <View style={styles.vencimientoFooter}>
                <Text style={styles.vencimientoFecha}>
                  📅 Vence: {gasto.fecha_limite}
                </Text>
                <Text style={[
                  styles.vencimientoDias,
                  { color: getColorSemaforo(gasto.estado) }
                ]}>
                  {gasto.dias_restantes < 0
                    ? `${Math.abs(gasto.dias_restantes)} días atrasado`
                    : gasto.dias_restantes === 0
                      ? 'Vence hoy'
                      : `${gasto.dias_restantes} días restantes`}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Gráfico de progreso */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 Progreso de Pagos</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${estadisticas.totalPagados + estadisticas.totalPendientes > 0
                      ? (estadisticas.totalPagados / (estadisticas.totalPagados + estadisticas.totalPendientes)) * 100
                      : 0
                    }%`
                }
              ]}
            />
          </View>
          <View style={styles.progressLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
              <Text style={styles.legendText}>
                Pagados: {estadisticas.totalPagados}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#e5e7eb' }]} />
              <Text style={styles.legendText}>
                Pendientes: {estadisticas.totalPendientes}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "#1f2937",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  saldoCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  saldoInfo: {
    marginLeft: 15,
  },
  saldoLabel: {
    fontSize: 14,
    color: "#d1d5db",
    marginBottom: 5,
  },
  saldo: {
    fontSize: 32,
    fontWeight: "bold",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    gap: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  ingresoCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  pagadoCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  pendienteCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  balanceCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#8b5cf6",
  },
  statIconContainer: {
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "600",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  statSubtext: {
    fontSize: 11,
    color: "#9ca3af",
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 15,
  },
  vencimientoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  vencimientoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  vencimientoConcepto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  vencimientoMonto: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#16a34a",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
  },
  estadoText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  vencimientoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  vencimientoFecha: {
    fontSize: 13,
    color: "#6b7280",
  },
  vencimientoDias: {
    fontSize: 13,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
  progressCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 15,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 6,
  },
  progressLegend: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
});