import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { ChevronLeft, ChevronRight, CircleDollarSign, AlertCircle, CheckCircle } from "lucide-react-native";
import { getCalendarioData, getDetalleDiaCalendario } from "../services/movimientosService";

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface DiaCalendario {
  tieneGasto: boolean;
  tieneIngreso: boolean;
}

export default function ReportesScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarioData, setCalendarioData] = useState<Record<string, DiaCalendario>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<{ gastos: any[], ingresos: any[] }>({ gastos: [], ingresos: [] });
  const [loading, setLoading] = useState(false);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  const fetchMesData = async (date: Date) => {
    setLoading(true);
    try {
      const data = await getCalendarioData(date.getFullYear(), date.getMonth() + 1);
      setCalendarioData(data);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMesData(currentDate);
    }, [currentDate])
  );

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
    setDetalle({ gastos: [], ingresos: [] });
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
    setDetalle({ gastos: [], ingresos: [] });
  };

  const handleDayPress = async (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const fullDate = `${year}-${month}-${dayStr}`;
    
    setSelectedDate(fullDate);
    setLoadingDetalle(true);
    try {
      const data = await getDetalleDiaCalendario(fullDate);
      setDetalle(data);
    } catch (error) {
      console.error("Error fetching day details:", error);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const dayStr = String(i).padStart(2, '0');
      const monthStr = String(month + 1).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      
      const hasGasto = calendarioData[dateKey]?.tieneGasto;
      const hasIngreso = calendarioData[dateKey]?.tieneIngreso;
      const isSelected = selectedDate === dateKey;

      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={[styles.dayCell, isSelected && styles.selectedDayCell]}
          onPress={() => handleDayPress(i)}
          activeOpacity={0.7}
        >
          <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
            {i}
          </Text>
          
          <View style={styles.indicatorsContainer}>
            {hasIngreso && <View style={[styles.indicator, { backgroundColor: '#10b981' }]} />}
            {hasGasto && <View style={[styles.indicator, { backgroundColor: '#ef4444' }]} />}
          </View>
        </TouchableOpacity>
      );
    }

    // Fill remaining cells to make a perfect grid if needed
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 0; i < remainingCells; i++) {
      days.push(<View key={`empty-end-${i}`} style={styles.dayCell} />);
    }

    return (
      <View style={styles.calendarGrid}>
        {DAYS_OF_WEEK.map((day, idx) => (
          <View key={`header-${idx}`} style={styles.dayHeaderCell}>
            <Text style={styles.dayHeaderText}>{day}</Text>
          </View>
        ))}
        {days}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#fff" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Calendario de Pagos</Text>
          <View style={{ width: 28 }} />
        </View>
        <Text style={styles.headerSubtitle}>Revisa tus pagos programados e ingresos</Text>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.chevronButton}>
            <ChevronLeft color="#4b5563" size={24} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.chevronButton}>
            <ChevronRight color="#4b5563" size={24} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          renderCalendar()
        )}
        
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.indicator, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Ingresos</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.indicator, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Gastos Programados</Text>
          </View>
        </View>
      </View>

      {selectedDate && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>
            Movimientos para el {selectedDate.split('-')[2]} de {MONTHS[parseInt(selectedDate.split('-')[1]) - 1]}
          </Text>
          
          {loadingDetalle ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="small" color="#3b82f6" />
          ) : (
            <>
              {detalle.ingresos.length === 0 && detalle.gastos.length === 0 ? (
                <Text style={styles.noDataText}>No hay movimientos registrados para este día.</Text>
              ) : (
                <View style={styles.listContainer}>
                  {detalle.ingresos.map(ingreso => (
                    <View key={`ingreso-${ingreso.id}`} style={styles.itemCard}>
                      <View style={[styles.iconContainer, { backgroundColor: '#d1fae5' }]}>
                        <CircleDollarSign color="#10b981" size={20} />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemConcept}>{ingreso.concepto}</Text>
                        <Text style={styles.itemType}>Ingreso</Text>
                      </View>
                      <Text style={[styles.itemAmount, { color: '#10b981' }]}>
                        + S/. {ingreso.monto.toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  {detalle.gastos.map(gasto => (
                    <View key={`gasto-${gasto.id}`} style={styles.itemCard}>
                      <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
                        {gasto.pagado === 1 ? (
                          <CheckCircle color="#ef4444" size={20} />
                        ) : (
                          <AlertCircle color="#ef4444" size={20} />
                        )}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemConcept}>{gasto.concepto}</Text>
                        <Text style={styles.itemType}>
                          {gasto.pagado === 1 ? 'Gasto Pagado' : 'Gasto Programado'}
                        </Text>
                      </View>
                      <Text style={[styles.itemAmount, { color: '#ef4444' }]}>
                        - S/. {gasto.monto.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}
      
      {/* Espacio extra al final para scroll */}
      <View style={{ height: 40 }} />
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: -15,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chevronButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    textTransform: 'capitalize',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayHeaderCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  dayCell: {
    width: '14.28%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  selectedDayCell: {
    backgroundColor: '#3b82f6',
  },
  dayText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  indicatorsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    gap: 3,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  noDataText: {
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  listContainer: {
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemConcept: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  itemType: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
