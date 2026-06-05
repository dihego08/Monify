import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from "react-native";
import { Coffee, Trash2, Plus } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import {
  addGastoHormiga,
  getGastosHormiga,
  deleteGastoHormiga,
  getCuentas,
  Cuenta
} from "../services/movimientosService";

interface GastoHormiga {
  id: number;
  monto: number;
  descripcion: string;
  fecha: string;
}

export default function GastosHormigaScreen() {
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [gastos, setGastos] = useState<GastoHormiga[]>([]);
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [cuenta_id, setCuenta_id] = useState<number | null>(1);
  const [refreshing, setRefreshing] = useState(false);

  const cargarGastos = async () => {
    try {
      const listaCuentas = await getCuentas();
      setCuentas(listaCuentas);
      
      const defaultCuenta = listaCuentas.find(c => c.es_default_hormiga === 1);
      setCuenta_id(defaultCuenta ? defaultCuenta.id : (listaCuentas.length > 0 ? listaCuentas[0].id : 1));

      const data = await getGastosHormiga();
      setGastos(data);
    } catch (error) {
      console.error("Error al cargar gastos hormiga:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarGastos();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarGastos();
    setRefreshing(false);
  };

  const handleAgregar = async () => {
    if (!monto || isNaN(Number(monto)) || Number(monto) <= 0) {
      Alert.alert("Error", "Ingresa un monto válido");
      return;
    }

    try {
      await addGastoHormiga(Number(monto), descripcion || "Gasto sin descripción", cuenta_id || 1);
      setMonto("");
      setDescripcion("");
      await cargarGastos();
    } catch (error) {
      console.error("Error al guardar:", error);
      Alert.alert("Error", "No se pudo guardar el gasto");
    }
  };

  const handleEliminar = (id: number) => {
    Alert.alert(
      "Eliminar Gasto",
      "¿Estás seguro de que deseas eliminar este gasto hormiga?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteGastoHormiga(id);
              await cargarGastos();
            } catch (error) {
              console.error("Error al eliminar:", error);
            }
          }
        }
      ]
    );
  };

  // Agrupar por fecha
  const gastosAgrupados = gastos.reduce((acc, gasto) => {
    const fechaSoloDia = gasto.fecha.split(" ")[0]; // Extrae "YYYY-MM-DD"
    if (!acc[fechaSoloDia]) {
      acc[fechaSoloDia] = [];
    }
    acc[fechaSoloDia].push(gasto);
    return acc;
  }, {} as Record<string, GastoHormiga[]>);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIconBg}>
          <Coffee color="#fff" size={24} />
        </View>
        <Text style={styles.headerTitle}>Gastos Hormiga</Text>
        <Text style={styles.headerSubtitle}>Registra tus antojos y compras rápidas</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Formulario rápido */}
        <View style={styles.cardForm}>
          <Text style={styles.label}>Nuevo Gasto</Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencyPrefix}>S/.</Text>
            <TextInput
              style={styles.montoInput}
              placeholder="0.00"
              keyboardType="numeric"
              value={monto}
              onChangeText={setMonto}
            />
          </View>
          
          {cuentas.length > 0 && (
            <View style={styles.inputGroup}>
              <Picker
                  selectedValue={cuenta_id}
                  onValueChange={(value) => setCuenta_id(value)}
                  style={styles.picker}
              >
                  {cuentas.map((c) => (
                      <Picker.Item key={c.id} label={c.nombre} value={c.id} />
                  ))}
              </Picker>
            </View>
          )}

          <TextInput
            style={styles.descInput}
            placeholder="¿En qué lo gastaste? (Ej. Café, snacks...)"
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TouchableOpacity style={styles.btnAgregar} onPress={handleAgregar}>
            <Plus color="#fff" size={20} />
            <Text style={styles.btnText}>Añadir Gasto Rápido</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de gastos */}
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Historial Reciente</Text>
          
          {Object.keys(gastosAgrupados).length === 0 ? (
            <View style={styles.emptyState}>
              <Coffee color="#d1d5db" size={48} />
              <Text style={styles.emptyText}>No tienes gastos hormiga registrados.</Text>
            </View>
          ) : (
            Object.keys(gastosAgrupados).map((fecha) => (
              <View key={fecha} style={styles.fechaGroup}>
                <Text style={styles.fechaText}>{fecha}</Text>
                {gastosAgrupados[fecha].map((g) => (
                  <View key={g.id} style={styles.gastoItem}>
                    <View style={styles.gastoInfo}>
                      <View style={styles.gastoIcon}>
                        <Coffee color="#ef4444" size={16} />
                      </View>
                      <View>
                        <Text style={styles.gastoDesc}>{g.descripcion}</Text>
                        <Text style={styles.gastoHora}>
                          {g.fecha.includes(" ") ? g.fecha.split(" ")[1].slice(0, 5) : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.gastoRight}>
                      <Text style={styles.gastoMonto}>-S/. {g.monto.toFixed(2)}</Text>
                      <TouchableOpacity onPress={() => handleEliminar(g.id)} style={styles.btnTrash}>
                        <Trash2 color="#ef4444" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    backgroundColor: "#1e3a8a",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerIconBg: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 50,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#bfdbfe",
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  cardForm: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#6b7280",
    marginRight: 8,
  },
  montoInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    paddingVertical: 12,
  },
  descInput: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#f9fafb",
    marginBottom: 16,
  },
  btnAgregar: {
    backgroundColor: "#ef4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    marginTop: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 14,
    marginTop: 10,
  },
  fechaGroup: {
    marginBottom: 16,
  },
  fechaText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6b7280",
    marginBottom: 8,
    marginLeft: 4,
  },
  gastoItem: {
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  gastoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  gastoIcon: {
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 10,
    marginRight: 12,
  },
  gastoDesc: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1f2937",
  },
  gastoHora: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  gastoRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gastoMonto: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ef4444",
  },
  btnTrash: {
    padding: 6,
  },
});
