import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface ChartData {
  mes: string;
  ingresos: number;
  gastos: number;
}

interface BarChartProps {
  data: ChartData[];
}

export default function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(
    ...data.map(d => Math.max(d.ingresos, d.gastos)),
    100 // Minimun scale height
  );

  const chartHeight = 160;

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((item, index) => {
          // Calculamos la altura de cada barra
          const hIngreso = (item.ingresos / maxValue) * chartHeight;
          const hGasto = (item.gastos / maxValue) * chartHeight;

          return (
            <View key={`chart-col-${index}`} style={styles.column}>
              <View style={[styles.barsArea, { height: chartHeight }]}>
                {/* Barra de Ingreso */}
                <View style={styles.barWrapper}>
                  {item.ingresos > 0 && (
                    <Text style={styles.valueText}>
                      {item.ingresos > 999 ? `${(item.ingresos / 1000).toFixed(1)}k` : Math.round(item.ingresos)}
                    </Text>
                  )}
                  <View style={[styles.bar, styles.barIngreso, { height: hIngreso }]} />
                </View>

                {/* Barra de Gasto */}
                <View style={styles.barWrapper}>
                  {item.gastos > 0 && (
                    <Text style={styles.valueText}>
                      {item.gastos > 999 ? `${(item.gastos / 1000).toFixed(1)}k` : Math.round(item.gastos)}
                    </Text>
                  )}
                  <View style={[styles.bar, styles.barGasto, { height: hGasto }]} />
                </View>
              </View>
              <Text style={styles.monthLabel}>{item.mes}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Leyenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Ingresos</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Gastos</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 10,
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  column: {
    alignItems: 'center',
    width: 60,
    marginRight: 10,
  },
  barsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barIngreso: {
    backgroundColor: '#10b981', // Verde
  },
  barGasto: {
    backgroundColor: '#ef4444', // Rojo
  },
  valueText: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  monthLabel: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 8,
    fontWeight: '500',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});
